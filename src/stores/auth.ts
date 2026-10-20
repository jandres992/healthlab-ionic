/**
 * Sesión (RF-07, RF-08, RF-44.1, RF-44.2).
 * Los permisos de la interfaz son exactamente `acciones[]` que devuelve el backend;
 * la app no mantiene listas propias por rol.
 */
import { defineStore } from 'pinia';
import { Capacitor } from '@capacitor/core';
import * as authApi from '@/api/endpoints/auth';
import { esApiError, registrarProveedorSesion } from '@/api/http';
import type { PerfilPropio, Rol } from '@/api/tipos';
import { borrarSecreto, guardarSecreto, leerSecreto } from '@/services/almacenamientoSeguro';

const CLAVE_ACCESS = 'healthlab.access';
const CLAVE_REFRESH = 'healthlab.refresh';
const CLAVE_PERFIL = 'healthlab.perfil';
/** Puesto compartido (web): la sesión expira por inactividad (§16.16.4). */
const INACTIVIDAD_WEB_MS = 15 * 60 * 1000;

interface Estado {
  access: string | null;
  refresh: string | null;
  perfil: PerfilPropio | null;
  roles: Rol[];
  acciones: string[];
  restaurando: boolean;
  ultimaActividad: number;
}

export const useAuthStore = defineStore('auth', {
  state: (): Estado => ({
    access: null, refresh: null, perfil: null, roles: [], acciones: [], restaurando: true, ultimaActividad: Date.now(),
  }),

  getters: {
    autenticado: (s) => !!s.access && !!s.perfil,
    nombre: (s) => s.perfil?.nombre_completo || s.perfil?.username || '',
    puede: (s) => (accion: string) => s.acciones.includes(accion),
    tieneRol: (s) => (...roles: Rol[]) => roles.some((r) => s.roles.includes(r)),
  },

  actions: {
    async restaurar() {
      this.restaurando = true;
      try {
        const [access, refresh, perfilJson] = await Promise.all([
          leerSecreto(CLAVE_ACCESS), leerSecreto(CLAVE_REFRESH), leerSecreto(CLAVE_PERFIL),
        ]);
        this.access = access;
        this.refresh = refresh;
        if (perfilJson) this.aplicarPerfil(JSON.parse(perfilJson));
        if (this.access) {
          // Refresca roles/acciones por si cambiaron desde el último ingreso.
          try { this.aplicarPerfil(await authApi.perfil()); } catch (e) {
            if (esApiError(e) && !e.sinConexion) await this.cerrarSesion();
          }
        }
      } finally {
        this.restaurando = false;
      }
    },

    aplicarPerfil(p: PerfilPropio) {
      this.perfil = p;
      this.roles = (p.roles ?? []) as Rol[];
      this.acciones = p.acciones ?? [];
      void guardarSecreto(CLAVE_PERFIL, JSON.stringify(p));
    },

    async iniciarSesion(username: string, password: string) {
      const r = await authApi.login(username, password);
      this.access = r.access;
      this.refresh = r.refresh;
      await Promise.all([guardarSecreto(CLAVE_ACCESS, r.access), guardarSecreto(CLAVE_REFRESH, r.refresh)]);
      this.aplicarPerfil(await authApi.perfil());
      this.ultimaActividad = Date.now();
    },

    async renovar(): Promise<string | null> {
      if (!this.refresh) return null;
      try {
        const r = await authApi.renovarToken(this.refresh);
        this.access = r.access;
        await guardarSecreto(CLAVE_ACCESS, r.access);
        if (r.refresh) { this.refresh = r.refresh; await guardarSecreto(CLAVE_REFRESH, r.refresh); }
        return r.access;
      } catch {
        return null;
      }
    },

    async cerrarSesion(avisarServidor = true) {
      const refresh = this.refresh;
      this.access = null; this.refresh = null; this.perfil = null; this.roles = []; this.acciones = [];
      await Promise.all([borrarSecreto(CLAVE_ACCESS), borrarSecreto(CLAVE_REFRESH), borrarSecreto(CLAVE_PERFIL)]);
      if (avisarServidor && refresh) { try { await authApi.logout(refresh); } catch { /* ya cerrada */ } }
    },

    registrarActividad() {
      this.ultimaActividad = Date.now();
    },

    /** En web, si pasó el tiempo de inactividad, cierra la sesión (RNF-26, §16.16.4). */
    async verificarInactividad() {
      if (Capacitor.isNativePlatform() || !this.autenticado) return;
      if (Date.now() - this.ultimaActividad > INACTIVIDAD_WEB_MS) await this.cerrarSesion();
    },
  },
});

/** Conecta el store con el cliente HTTP (una sola vez, en main.ts). */
export function conectarSesionHttp() {
  const store = useAuthStore();
  registrarProveedorSesion({
    obtenerAccess: () => store.access,
    renovar: () => store.renovar(),
    cerrarSesion: () => store.cerrarSesion(false),
  });
}
