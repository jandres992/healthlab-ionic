<script setup lang="ts">
import {
  IonButton, IonContent, IonInput, IonItem, IonList, IonNote, IonPage, IonSpinner, IonText,
} from '@ionic/vue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { esApiError } from '@/api/http';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const cargando = ref(false);
const mensajeError = ref('');

async function entrar() {
  mensajeError.value = '';
  if (!username.value.trim() || !password.value) {
    mensajeError.value = 'Ingresa usuario y contraseña.';
    return;
  }
  cargando.value = true;
  try {
    await auth.iniciarSesion(username.value.trim(), password.value);
    const volver = typeof route.query.volver === 'string' ? route.query.volver : '/tabs/inicio';
    await router.replace(volver);
  } catch (e) {
    // RF-01.1: usuario sin rol → 403 con mensaje propio; credenciales → 401 genérico; 429 → límite.
    mensajeError.value = esApiError(e) ? e.mensaje : 'No se pudo iniciar sesión.';
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding login">
      <div class="login__caja">
        <img src="/favicon.png" alt="" class="login__logo" width="56" height="56" />
        <h1>HealthLab</h1>
        <p class="login__sub">Sistema de información de laboratorio</p>

        <form @submit.prevent="entrar">
          <ion-list lines="full">
            <ion-item>
              <ion-input v-model="username" label="Usuario" label-placement="floating" autocomplete="username"
                         autocapitalize="off" :disabled="cargando" />
            </ion-item>
            <ion-item>
              <ion-input v-model="password" type="password" label="Contraseña" label-placement="floating"
                         autocomplete="current-password" :disabled="cargando" />
            </ion-item>
          </ion-list>

          <ion-text v-if="mensajeError" color="danger"><p class="login__error" role="alert">{{ mensajeError }}</p></ion-text>

          <ion-button type="submit" expand="block" :disabled="cargando" class="ion-margin-top">
            <ion-spinner v-if="cargando" name="crescent" />
            <span v-else>Ingresar</span>
          </ion-button>
        </form>

        <ion-note class="login__nota">
          Si no tienes cuenta o rol asignado, contacta al administrador del laboratorio.
        </ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.login { --background: var(--ion-color-light); }
.login__caja { max-width: 420px; margin: 8vh auto 0; }
.login__logo { display: block; margin: 0 auto 8px; }
h1 { text-align: center; margin: 0; color: var(--ion-color-primary); }
.login__sub { text-align: center; color: var(--ion-color-medium); margin-top: 4px; }
.login__error { margin: 12px 0 0; }
.login__nota { display: block; margin-top: 24px; text-align: center; }
</style>
