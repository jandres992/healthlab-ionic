<script setup lang="ts">
/**
 * Menú lateral (escritorio ≥ 992 px con split-pane; en móvil se abre con el botón de menú).
 * Las secciones salen de acciones[] del backend (§16.16.2, RF-44.1).
 */
import {
  IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuToggle, IonNote,
  IonToolbar,
} from '@ionic/vue';
import {
  clipboardOutline, documentTextOutline, flaskOutline, hardwareChipOutline, homeOutline, notificationsOutline,
  peopleOutline, personCircleOutline, ribbonOutline, settingsOutline, shieldCheckmarkOutline, statsChartOutline,
  warningOutline,
} from 'ionicons/icons';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ETIQUETAS_ROL } from '@/api/tipos';
import { usePermisos } from '@/composables/usePermisos';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const route = useRoute();
const { puede } = usePermisos();

const secciones = computed(() => [
  { titulo: 'Operación', items: [
    { ruta: '/tabs/inicio', icono: homeOutline, texto: 'Inicio', ok: true },
    { ruta: '/tabs/pacientes', icono: peopleOutline, texto: 'Pacientes', ok: puede('pacientes.ver') },
    { ruta: '/tabs/ordenes', icono: clipboardOutline, texto: 'Órdenes', ok: puede('ordenes.ver') },
    { ruta: '/tabs/muestras', icono: flaskOutline, texto: 'Muestras', ok: puede('muestras.ver') },
    { ruta: '/tabs/resultados', icono: documentTextOutline, texto: 'Resultados', ok: puede('resultados.ver') || puede('examenes.ver') },
    { ruta: '/criticos', icono: warningOutline, texto: 'Valores críticos', ok: puede('criticos.ver') },
    { ruta: '/lecturas', icono: hardwareChipOutline, texto: 'Lecturas de analizadores', ok: puede('lecturas.ver') },
  ] },
  { titulo: 'Calidad y gestión', items: [
    { ruta: '/calidad', icono: ribbonOutline, texto: 'Control de calidad', ok: puede('calidad.ver') || puede('equipos.ver') },
    { ruta: '/indicadores', icono: statsChartOutline, texto: 'Indicadores', ok: puede('indicadores.ver') },
    { ruta: '/auditoria', icono: shieldCheckmarkOutline, texto: 'Auditoría y RIPS', ok: puede('auditoria.ver') || puede('ordenes.export_rips') },
    { ruta: '/admin', icono: settingsOutline, texto: 'Administración', ok: puede('usuarios.ver') || puede('catalogos.gestionar') },
  ] },
  { titulo: 'Cuenta', items: [
    { ruta: '/notificaciones', icono: notificationsOutline, texto: 'Notificaciones', ok: true },
    { ruta: '/perfil', icono: personCircleOutline, texto: 'Mi perfil', ok: true },
  ] },
].map((s) => ({ ...s, items: s.items.filter((i) => i.ok) })).filter((s) => s.items.length));
</script>

<template>
  <ion-menu content-id="principal" type="overlay" :disabled="!auth.autenticado">
    <ion-header>
      <ion-toolbar color="primary">
        <div class="marca">
          <img src="/img/logo.png" alt="" width="40" height="40" />
          <span>HealthLab</span>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list v-if="auth.autenticado">
        <ion-item lines="full">
          <ion-label>
            <h2>{{ auth.nombre }}</h2>
            <ion-note>{{ auth.roles.map((r) => ETIQUETAS_ROL[r]).join(' · ') }}</ion-note>
          </ion-label>
        </ion-item>
        <template v-for="s in secciones" :key="s.titulo">
          <ion-list-header><ion-label>{{ s.titulo }}</ion-label></ion-list-header>
          <ion-menu-toggle v-for="i in s.items" :key="i.ruta" :auto-hide="false">
            <ion-item :router-link="i.ruta" router-direction="root" lines="none" :detail="false"
                      :class="{ activo: route.path.startsWith(i.ruta) }">
              <ion-icon slot="start" :icon="i.icono" />
              <ion-label>{{ i.texto }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </template>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<style scoped>
.marca { display: flex; align-items: center; gap: 12px; padding: 8px 16px; font-size: 20px; font-weight: 800; color: #fff; }
.marca img { border-radius: 50%; background: #fff; }
ion-menu ion-content { --background: var(--hl-surface-lowest); }
ion-item { --border-radius: 12px; margin: 2px 8px; }
.activo { --background: var(--hl-primary-fixed); --color: var(--hl-primary); font-weight: 700; }
.activo ion-icon { color: var(--hl-primary); }
</style>
