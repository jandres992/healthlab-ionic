<script setup lang="ts">
/** Administración (escritorio): cuentas y roles, catálogos. */
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/vue';
import { ref } from 'vue';
import { usePermisos } from '@/composables/usePermisos';
import CatalogosPanel from './CatalogosPanel.vue';
import UsuariosPanel from './UsuariosPanel.vue';

const { puede } = usePermisos();
const panel = ref(puede('usuarios.ver') ? 'usuarios' : 'catalogos');
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Administración</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="panel">
          <ion-segment-button v-if="puede('usuarios.ver')" value="usuarios">Cuentas y roles</ion-segment-button>
          <ion-segment-button v-if="puede('catalogos.ver')" value="catalogos">Catálogos</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <UsuariosPanel v-if="panel === 'usuarios'" />
      <CatalogosPanel v-else />
    </ion-content>
  </ion-page>
</template>
