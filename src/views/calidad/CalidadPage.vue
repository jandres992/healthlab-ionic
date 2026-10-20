<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue';
import { ref } from 'vue';
import { usePermisos } from '@/composables/usePermisos';
import CciPanel from './CciPanel.vue';
import EquiposPanel from './EquiposPanel.vue';
import LotesPanel from './LotesPanel.vue';

const { puede } = usePermisos();
const panel = ref(puede('calidad.ver') ? 'cci' : 'equipos');
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Control de calidad</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="panel">
          <ion-segment-button v-if="puede('calidad.ver')" value="cci">CCI</ion-segment-button>
          <ion-segment-button v-if="puede('lotes.ver')" value="lotes">Lotes</ion-segment-button>
          <ion-segment-button v-if="puede('equipos.ver')" value="equipos">Equipos</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <CciPanel v-if="panel === 'cci'" />
      <LotesPanel v-else-if="panel === 'lotes'" />
      <EquiposPanel v-else />
    </ion-content>
  </ion-page>
</template>
