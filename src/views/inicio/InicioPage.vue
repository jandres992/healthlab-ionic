<script setup lang="ts">
/**
 * Tablero por rol (RF-45). Las tarjetas salen de `acciones[]`: si el backend no
 * concede la acción, la tarjeta no aparece.
 */
import {
  IonBadge, IonButton, IonCard, IonCardContent, IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent,
} from '@ionic/vue';
import {
  clipboardOutline, documentTextOutline, flaskOutline, notificationsOutline, peopleOutline, person, statsChartOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { useMensajes } from '@/composables/useMensajes';
import { computed, onMounted, ref } from 'vue';
import { listarNotificaciones } from '@/api/endpoints/notificaciones';
import { listarOrdenes } from '@/api/endpoints/ordenes';
import { listarMuestras } from '@/api/endpoints/muestras';
import { listarCriticos } from '@/api/endpoints/resultados';
import { ETIQUETAS_ROL } from '@/api/tipos';
import ColaOfflineBanner from '@/components/ColaOfflineBanner.vue';
import { usePermisos } from '@/composables/usePermisos';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { puede } = usePermisos();
const router = useRouter();
const { confirmar } = useMensajes();

async function salir() {
  if (await confirmar('Cerrar sesión', '¿Deseas cerrar la sesión en este dispositivo?', 'Salir')) {
    await auth.cerrarSesion();
    await router.replace('/login');
  }
}

const noLeidas = ref(0);
const ordenesAbiertas = ref<number | null>(null);
const muestrasPendientes = ref<number | null>(null);
const criticosPendientes = ref<number | null>(null);

const tarjetas = computed(() => [
  { titulo: 'Pacientes', pista: puede('pacientes.crear') ? 'Registrar y consultar pacientes' : 'Consultar pacientes', icono: peopleOutline, ruta: '/tabs/pacientes', ok: puede('pacientes.ver') },
  { titulo: 'Órdenes', pista: puede('ordenes.crear') ? 'Crear órdenes con CUPS y CIE-10' : puede('ordenes.admitir') ? 'Admitir pacientes' : 'Trazabilidad de órdenes', icono: clipboardOutline, ruta: '/tabs/ordenes', ok: puede('ordenes.ver') },
  { titulo: 'Muestras', pista: puede('muestras.registrar') ? 'Toma, escaneo y etiquetado' : puede('muestras.recibir') ? 'Recibir o rechazar en laboratorio' : 'Estado de muestras', icono: flaskOutline, ruta: '/tabs/muestras', ok: puede('muestras.ver') },
  { titulo: 'Resultados', pista: puede('examenes.aprobar') ? 'Ingresar y validar resultados' : 'Consultar resultados e informes', icono: documentTextOutline, ruta: '/tabs/resultados', ok: puede('resultados.ver') || puede('examenes.ver') },
  { titulo: 'Indicadores', pista: 'Dashboard de la operación del laboratorio', icono: statsChartOutline, ruta: '/indicadores', ok: puede('indicadores.ver') },
].filter((t) => t.ok));

async function cargar() {
  const tareas: Promise<unknown>[] = [
    listarNotificaciones(true, 1).then((p) => { noLeidas.value = p.count; }).catch(() => undefined),
  ];
  if (puede('ordenes.ver')) tareas.push(listarOrdenes({ limit: 1, estado_general__nombre: 'En Proceso' }).then((p) => { ordenesAbiertas.value = p.count; }).catch(() => undefined));
  if (puede('muestras.ver')) tareas.push(listarMuestras({ limit: 1, estado_muestra__nombre: 'Recolectada' }).then((p) => { muestrasPendientes.value = p.count; }).catch(() => undefined));
  if (puede('criticos.ver')) tareas.push(listarCriticos(true).then((l) => { criticosPendientes.value = l.length; }).catch(() => undefined));
  await Promise.all(tareas);
}

async function refrescar(ev: CustomEvent) {
  await cargar();
  (ev.target as HTMLIonRefresherElement).complete();
}

onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-content class="inicio">
      <ion-refresher slot="fixed" @ionRefresh="refrescar"><ion-refresher-content /></ion-refresher>

      <header class="cabecera">
        <div class="cabecera__texto">
          <span class="cabecera__etiqueta">PLATAFORMA HEALTHLAB</span>
          <h2 class="saludo">Hola, {{ auth.nombre }}</h2>
          <span class="rol">Rol: {{ auth.roles.map((r) => ETIQUETAS_ROL[r]).join(' · ') }}</span>
        </div>
        <div class="cabecera__acciones">
          <ion-button fill="clear" class="cabecera__btn" router-link="/notificaciones" aria-label="Notificaciones">
            <ion-icon slot="icon-only" :icon="notificationsOutline" />
            <ion-badge v-if="noLeidas" color="danger" class="badge">{{ noLeidas }}</ion-badge>
          </ion-button>
          <router-link to="/perfil" class="perfil" aria-label="Perfil"><ion-icon :icon="person" /></router-link>
        </div>
      </header>

      <ColaOfflineBanner />

      <ion-card v-if="criticosPendientes" class="critico" button router-link="/criticos">
        <ion-card-content><strong>{{ criticosPendientes }}</strong> valor(es) crítico(s) sin acuse — comunicar y registrar ahora</ion-card-content>
      </ion-card>

      <section v-if="ordenesAbiertas !== null || muestrasPendientes !== null || criticosPendientes !== null" class="seccion">
        <h3>Estado Operacional</h3>
        <div class="metricas">
          <div v-if="ordenesAbiertas !== null" class="metrica">
            <span class="metrica__icono">📋</span><strong>{{ ordenesAbiertas }}</strong><span>Órdenes</span>
          </div>
          <div v-if="muestrasPendientes !== null" class="metrica">
            <span class="metrica__icono">🧪</span>
            <strong :class="{ alerta: muestrasPendientes }">{{ muestrasPendientes }}</strong><span>Por recibir</span>
          </div>
          <div v-if="criticosPendientes !== null" class="metrica">
            <span class="metrica__icono">⚠️</span>
            <strong :class="{ alerta: criticosPendientes }">{{ criticosPendientes }}</strong><span>Críticos</span>
          </div>
        </div>
      </section>

      <section class="seccion">
        <h3>Bandeja de Tareas</h3>
        <div class="acciones">
          <router-link v-for="t in tarjetas" :key="t.titulo" :to="t.ruta" class="accion">
            <span class="accion__icono"><ion-icon :icon="t.icono" /></span>
            <strong>{{ t.titulo }}</strong>
            <span>{{ t.pista }}</span>
          </router-link>
        </div>
        <p v-if="!tarjetas.length" class="ion-text-center">
          Tu cuenta no tiene acciones clínicas habilitadas. Contacta al administrador.
        </p>
      </section>

      <div class="pie">
        <ion-button expand="block" fill="outline" color="danger" @click="salir">Cerrar Sesión</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.inicio { --background: var(--hl-surface); }
.cabecera {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: calc(32px + env(safe-area-inset-top)) 24px 24px;
  background: var(--hl-degradado); color: #fff;
  border-radius: 0 0 var(--hl-radius-xl) var(--hl-radius-xl); margin-bottom: 20px;
}
.cabecera__texto { min-width: 0; flex: 1; }
.cabecera__etiqueta { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; opacity: 0.8; }
.saludo { margin: 4px 0 2px; font-size: 24px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rol { font-size: 14px; color: var(--hl-primary-fixed); }
.cabecera__acciones { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cabecera__btn { --color: #fff; min-height: 36px; position: relative; }
.perfil {
  width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; font-size: 28px; color: #fff;
  background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3);
}
.badge { position: absolute; top: 0; right: 0; font-size: 10px; }
.critico { --background: var(--hl-error-container); color: var(--hl-on-error-container); border: 1.5px solid var(--ion-color-danger); }
.seccion { padding: 0 20px; margin-top: 24px; }
.seccion h3 { margin: 0 0 16px; font-size: 20px; font-weight: 700; color: var(--hl-on-surface); }
.metricas { display: flex; gap: 12px; }
.metrica {
  flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px 8px;
  background: var(--hl-surface-lowest); border-radius: var(--hl-radius-md); box-shadow: var(--hl-sombra);
}
.metrica__icono { font-size: 24px; margin-bottom: 4px; }
.metrica strong { font-size: 20px; color: var(--hl-primary); }
.metrica strong.alerta { color: var(--hl-accent); }
.metrica span:last-child { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: var(--hl-on-surface-variant); text-align: center; }
.acciones { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
.accion {
  min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  padding: 16px; background: var(--hl-surface-lowest); border-radius: var(--hl-radius-md); box-shadow: var(--hl-sombra);
  text-decoration: none; color: var(--hl-on-surface); transition: transform 0.15s;
}
.accion:active { transform: scale(0.97); }
.accion__icono {
  width: 56px; height: 56px; border-radius: 16px; background: var(--hl-primary-fixed); color: var(--hl-primary);
  display: grid; place-items: center; font-size: 26px; margin-bottom: 12px;
}
.accion strong { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.accion span:last-child { font-size: 14px; color: var(--hl-on-surface-variant); }
.pie { padding: 40px 20px 32px; }
</style>
