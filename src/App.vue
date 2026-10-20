<template>
  <ion-app>
    <!-- Escritorio (≥ 992 px): menú lateral fijo; móvil: pestañas y menú deslizable (§16.16.2) -->
    <ion-split-pane content-id="principal" when="lg">
      <MenuLateral />
      <ion-router-outlet id="principal" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/vue';
import MenuLateral from '@/components/MenuLateral.vue';
</script>
