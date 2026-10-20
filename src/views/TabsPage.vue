<script setup lang="ts">
/**
 * Pestañas principales. Solo se muestran las que el backend permite (RF-44, RF-44.1).
 * En escritorio (≥ 992 px) Ionic mantiene las mismas rutas; el menú lateral llega en la fase 6.
 */
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import { clipboardOutline, documentTextOutline, flaskOutline, homeOutline, peopleOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { usePermisos } from '@/composables/usePermisos';

const { puede } = usePermisos();

const pestanas = computed(() => [
  { tab: 'inicio', href: '/tabs/inicio', icono: homeOutline, etiqueta: 'Inicio', visible: true },
  { tab: 'pacientes', href: '/tabs/pacientes', icono: peopleOutline, etiqueta: 'Pacientes', visible: puede('pacientes.ver') },
  { tab: 'ordenes', href: '/tabs/ordenes', icono: clipboardOutline, etiqueta: 'Órdenes', visible: puede('ordenes.ver') },
  { tab: 'muestras', href: '/tabs/muestras', icono: flaskOutline, etiqueta: 'Muestras', visible: puede('muestras.ver') },
  { tab: 'resultados', href: '/tabs/resultados', icono: documentTextOutline, etiqueta: 'Resultados', visible: puede('resultados.ver') || puede('examenes.ver') },
].filter((p) => p.visible));
</script>

<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button v-for="p in pestanas" :key="p.tab" :tab="p.tab" :href="p.href">
          <ion-icon aria-hidden="true" :icon="p.icono" />
          <ion-label>{{ p.etiqueta }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
