import { defineStore } from 'pinia';
import { Network } from '@capacitor/network';
import {
  descartarConflicto, encolar, hayConexion, leerCola, reintentarConflicto, sincronizar,
  type Conflicto, type OperacionPendiente, type TipoOperacion,
} from '@/services/colaOffline';

interface Estado {
  pendientes: OperacionPendiente[];
  conflictos: Conflicto[];
  conectado: boolean;
  sincronizando: boolean;
  escuchando: boolean;
}

export const useColaOfflineStore = defineStore('colaOffline', {
  state: (): Estado => ({ pendientes: [], conflictos: [], conectado: true, sincronizando: false, escuchando: false }),

  actions: {
    async cargar() {
      const c = await leerCola();
      this.pendientes = c.pendientes;
      this.conflictos = c.conflictos;
      this.conectado = await hayConexion();
    },

    /** Escucha cambios de red y sincroniza al reconectar (RNF-12). Llamar una vez. */
    async iniciar() {
      if (this.escuchando) return;
      this.escuchando = true;
      await this.cargar();
      try {
        await Network.addListener('networkStatusChange', async (s) => {
          this.conectado = s.connected;
          if (s.connected) await this.sincronizar();
        });
      } catch { /* sin plugin de red (pruebas) */ }
      if (this.conectado && this.pendientes.length) await this.sincronizar();
    },

    async encolar(tipo: TipoOperacion, cuerpo: Record<string, unknown>, descripcion: string) {
      const op = await encolar(tipo, cuerpo, descripcion);
      this.pendientes.push(op);
      return op;
    },

    async sincronizar() {
      if (this.sincronizando) return null;
      this.sincronizando = true;
      try {
        const r = await sincronizar();
        await this.cargar();
        return r;
      } finally {
        this.sincronizando = false;
      }
    },

    async descartar(id: string) { await descartarConflicto(id); await this.cargar(); },
    async reintentar(id: string) { await reintentarConflicto(id); await this.cargar(); await this.sincronizar(); },
  },
});
