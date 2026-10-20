<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonChip, IonContent, IonHeader, IonInput, IonItem, IonLabel,
  IonList, IonListHeader, IonPage, IonTitle, IonToggle, IonToolbar,
} from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import * as authApi from '@/api/endpoints/auth';
import { ETIQUETAS_ROL } from '@/api/tipos';
import { useMensajes } from '@/composables/useMensajes';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const { exito, error, confirmar } = useMensajes();

const telefono = ref(auth.perfil?.telefono ?? '');
const email = ref(auth.perfil?.email ?? '');
const notificaciones = ref(auth.perfil?.recibir_notificaciones ?? true);
const passActual = ref('');
const passNueva = ref('');
const guardando = ref(false);

async function guardar() {
  guardando.value = true;
  try {
    const p = await authApi.actualizarPerfil({ telefono: telefono.value, email: email.value, recibir_notificaciones: notificaciones.value });
    auth.aplicarPerfil(p);
    await exito('Perfil actualizado.');
  } catch (e) { await error(e); } finally { guardando.value = false; }
}

async function cambiarClave() {
  if (!passActual.value || !passNueva.value) return;
  try {
    await authApi.cambiarContrasena(passActual.value, passNueva.value);
    await exito('Contraseña actualizada. Vuelve a iniciar sesión.');
    await auth.cerrarSesion(false);
    await router.replace('/login');
  } catch (e) { await error(e); }
}

async function salir() {
  if (await confirmar('Cerrar sesión', '¿Deseas cerrar la sesión en este dispositivo?', 'Salir')) {
    await auth.cerrarSesion();
    await router.replace('/login');
  }
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/inicio" text="" /></ion-buttons>
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-list-header><ion-label>Cuenta</ion-label></ion-list-header>
        <ion-item><ion-label>Usuario</ion-label><ion-label slot="end">{{ auth.perfil?.username }}</ion-label></ion-item>
        <ion-item><ion-label>Nombre</ion-label><ion-label slot="end">{{ auth.nombre }}</ion-label></ion-item>
        <ion-item v-if="auth.perfil?.registro_profesional">
          <ion-label>Registro profesional</ion-label><ion-label slot="end">{{ auth.perfil?.registro_profesional }}</ion-label>
        </ion-item>
        <ion-item>
          <ion-label>Roles</ion-label>
          <div slot="end"><ion-chip v-for="r in auth.roles" :key="r" color="primary">{{ ETIQUETAS_ROL[r] }}</ion-chip></div>
        </ion-item>

        <ion-list-header><ion-label>Contacto</ion-label></ion-list-header>
        <ion-item><ion-input v-model="email" type="email" label="Correo" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="telefono" type="tel" label="Teléfono" label-placement="stacked" /></ion-item>
        <ion-item><ion-toggle v-model="notificaciones">Recibir notificaciones</ion-toggle></ion-item>
        <ion-button expand="block" class="ion-margin" :disabled="guardando" @click="guardar">Guardar cambios</ion-button>

        <ion-list-header><ion-label>Contraseña</ion-label></ion-list-header>
        <ion-item><ion-input v-model="passActual" type="password" label="Contraseña actual" label-placement="stacked" autocomplete="current-password" /></ion-item>
        <ion-item><ion-input v-model="passNueva" type="password" label="Contraseña nueva (mín. 10)" label-placement="stacked" autocomplete="new-password" /></ion-item>
        <ion-button expand="block" fill="outline" class="ion-margin" @click="cambiarClave">Cambiar contraseña</ion-button>

        <ion-button expand="block" color="danger" fill="clear" class="ion-margin" @click="salir">Cerrar sesión</ion-button>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
