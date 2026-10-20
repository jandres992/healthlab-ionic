<script setup lang="ts">
/**
 * Tablero por rol (RF-45). Las tarjetas salen de `acciones[]`: si el backend no
 * concede la acción, la tarjeta no aparece.
 */
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,
  IonContent, IonHeader, IonIcon, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar,
} from '@ionic/vue';
import {
  clipboardOutline, documentTextOutline, flaskOutline, notificationsOutline, peopleOutline, personCircleOutline,
} from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';
import { listarNotificaciones } from '@/api/endpoints/notificaciones';
import { listarOrdenes } from '@/api/endpoints/ordenes';
import { listarMuestras } from '@/api/endpoints/muestras';
import { ETIQUETAS_ROL } from '@/api/tipos';
import { usePermisos } from '@/composables/usePermisos';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { puede } = usePermisos();

const noLeidas = ref(0);
const ordenesAbiertas = ref<number | null>(null);
const muestrasPendientes = ref<number | null>(null);

const tarjetas = computed(() => [
  { titulo: 'Pacientes', pista: puede('pacientes.crear') ? 'Registrar y consultar pacientes' : 'Consultar pacientes', icono: peopleOutline, ruta: '/tabs/pacientes', ok: puede('pacientes.ver') },
  { titulo: 'Órdenes', pista: puede('ordenes.crear') ? 'Crear órdenes con CUPS y CIE-10' : puede('ordenes.admitir') ? 'Admitir pacientes' : 'Trazabilidad de órdenes', icono: clipboardOutline, ruta: '/tabs/ordenes', ok: puede('ordenes.ver') },
  { titulo: 'Muestras', pista: puede('muestras.registrar') ? 'Toma, escaneo y etiquetado' : puede('muestras.recibir') ? 'Recibir o rechazar en laboratorio' : 'Estado de muestras', icono: flaskOutline, ruta: '/tabs/muestras', ok: puede('muestras.ver') },
  { titulo: 'Resultados', pista: puede('examenes.aprobar') ? 'Ingresar y validar resultados' : 'Consultar resultados e informes', icono: documentTextOutline, ruta: '/tabs/resultados', ok: puede('resultados.ver') || puede('examenes.ver') },
].filter((t) => t.ok));

async function cargar() {
  const tareas: Promise<unknown>[] = [
    listarNotificaciones(true, 1).then((p) => { noLeidas.value = p.count; }).catch(() => undefined),
  ];
  if (puede('ordenes.ver')) tareas.push(listarOrdenes({ limit: 1, estado_general__nombre: 'En Proceso' }).then((p) => { ordenesAbiertas.value = p.count; }).catch(() => undefined));
  if (puede('muestras.ver')) tareas.push(listarMuestras({ limit: 1, estado_muestra__nombre: 'Recolectada' }).then((p) => { muestrasPendientes.value = p.count; }).catch(() => undefined));
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
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>HealthLab</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/notificaciones" aria-label="Notificaciones">
            <ion-icon slot="icon-only" :icon="notificationsOutline" />
            <ion-badge v-if="noLeidas" color="danger" class="badge">{{ noLeidas }}</ion-badge>
          </ion-button>
          <ion-button router-link="/perfil" aria-label="Perfil"><ion-icon slot="icon-only" :icon="personCircleOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="refrescar"><ion-refresher-content /></ion-refresher>

      <h2 class="saludo">Hola, {{ auth.nombre }}</h2>
      <p class="rol">{{ auth.roles.map((r) => ETIQUETAS_ROL[r]).join(' · ') }}</p>

      <div class="metricas" v-if="ordenesAbiertas !== null || muestrasPendientes !== null">
        <ion-card v-if="ordenesAbiertas !== null" class="metrica">
          <ion-card-content><strong>{{ ordenesAbiertas }}</strong><span>órdenes en proceso</span></ion-card-content>
        </ion-card>
        <ion-card v-if="muestrasPendientes !== null" class="metrica">
          <ion-card-content><strong>{{ muestrasPendientes }}</strong><span>muestras por recibir</span></ion-card-content>
        </ion-card>
      </div>

      <ion-card v-for="t in tarjetas" :key="t.titulo" button :router-link="t.ruta">
        <ion-card-header>
          <ion-icon :icon="t.icono" color="primary" class="icono" />
          <ion-card-title>{{ t.titulo }}</ion-card-title>
          <ion-card-subtitle>{{ t.pista }}</ion-card-subtitle>
        </ion-card-header>
      </ion-card>

      <p v-if="!tarjetas.length" class="ion-text-center">
        Tu cuenta no tiene acciones clínicas habilitadas. Contacta al administrador.
      </p>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.saludo { margin: 8px 0 0; }
.rol { color: var(--ion-color-medium); margin: 0 0 16px; }
.metricas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
.metrica ion-card-content { display: flex; flex-direction: column; }
.metrica strong { font-size: 28px; color: var(--ion-color-primary); }
.icono { font-size: 28px; margin-bottom: 4px; }
.badge { position: absolute; top: 2px; right: 2px; font-size: 10px; }
</style>
