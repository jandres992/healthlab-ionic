<script setup lang="ts">
import {
  IonButton, IonContent, IonInput, IonNote, IonPage, IonSpinner, IonText,
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
    <ion-content class="login">
      <div class="login__circulo login__circulo--1" aria-hidden="true" />
      <div class="login__circulo login__circulo--2" aria-hidden="true" />
      <div class="login__caja">
        <div class="login__cabecera">
          <img src="/img/logo.png" alt="Clínica de Especialistas de Girardot" class="login__logo" width="140" height="140" />
          <h1>HealthLab</h1>
          <p class="login__sub">Inicia sesión para continuar al panel de control</p>
        </div>

        <form class="login__tarjeta" @submit.prevent="entrar">
          <ion-input v-model="username" class="hl-campo" label="Usuario" label-placement="stacked"
                     placeholder="Ingresa tu usuario" autocomplete="username" autocapitalize="off" :disabled="cargando" />
          <ion-input v-model="password" class="hl-campo" type="password" label="Contraseña"
                     label-placement="stacked" placeholder="••••••••" autocomplete="current-password" :disabled="cargando" />

          <ion-text v-if="mensajeError" color="danger"><p class="login__error" role="alert">{{ mensajeError }}</p></ion-text>

          <ion-button type="submit" expand="block" :disabled="cargando" class="login__boton">
            <ion-spinner v-if="cargando" name="crescent" />
            <span v-else>Entrar al Sistema</span>
          </ion-button>

          <p class="login__pie">VERSIÓN 2.0 • SOPORTE RIPS</p>
        </form>

        <ion-note class="login__nota">
          Si no tienes cuenta o rol asignado, contacta al administrador del laboratorio.
        </ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.login { --background: var(--hl-surface); }
.login__circulo { position: absolute; border-radius: 50%; pointer-events: none; }
.login__circulo--1 { top: -100px; right: -50px; width: 250px; height: 250px; background: var(--hl-accent); opacity: 0.1; }
.login__circulo--2 { bottom: -80px; left: -80px; width: 200px; height: 200px; background: var(--hl-primary); opacity: 0.05; }
.login__caja { position: relative; max-width: 440px; margin: 0 auto; padding: 6vh 24px 24px; }
.login__cabecera { text-align: center; margin-bottom: 32px; }
.login__logo { display: block; margin: 0 auto 16px; width: 140px; height: 140px; object-fit: contain; }
h1 { margin: 0 0 8px; color: var(--hl-primary); font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
.login__sub { margin: 0; padding: 0 20px; color: var(--hl-on-surface-variant); font-size: 16px; line-height: 24px; }
.login__tarjeta {
  background: var(--hl-surface-lowest); border-radius: var(--hl-radius-md); box-shadow: var(--hl-sombra);
  padding: 20px 16px 16px;
}
.login__tarjeta :deep(.label-text-wrapper) .label-text, .login__etiqueta {
  display: block; margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase; color: var(--hl-on-surface-variant);
}
.login__tarjeta ion-input { margin-bottom: 20px; }
.login__error { margin: 0 0 8px; }
.login__boton { margin-top: 12px; }
.login__pie { text-align: center; margin: 20px 0 0; opacity: 0.5; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: var(--hl-on-surface-variant); }
.login__nota { display: block; margin-top: 24px; text-align: center; }
</style>
