<script setup lang="ts">
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/vue';
import { lockClosedOutline } from 'ionicons/icons';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding ion-text-center">
      <ion-icon :icon="lockClosedOutline" style="font-size: 64px; margin-top: 15vh" color="medium" />
      <h2>Este flujo no es parte de tus tareas</h2>
      <p>
        Tu rol ({{ auth.roles.join(', ') || 'sin rol' }}) no tiene la acción
        <code>{{ route.query.accion }}</code>. Si crees que es un error, contacta al administrador.
      </p>
      <ion-button router-link="/tabs/inicio" fill="outline">Volver al inicio</ion-button>
    </ion-content>
  </ion-page>
</template>
