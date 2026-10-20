<script setup lang="ts">
/** Campo de código de barras con botón de escaneo (cámara en nativo; USB o manual en web). */
import { IonButton, IonIcon, IonInput, IonItem } from '@ionic/vue';
import { barcodeOutline } from 'ionicons/icons';
import { useEscaner } from '@/composables/useEscaner';

const modelo = defineModel<string>({ default: '' });
defineProps<{ label?: string; placeholder?: string; disabled?: boolean }>();
const emit = defineEmits<{ escaneado: [codigo: string] }>();
const { disponible, escanear } = useEscaner();

async function abrirEscaner() {
  const codigo = await escanear();
  if (codigo) {
    modelo.value = codigo;
    emit('escaneado', codigo);
  }
}
function alEnter() {
  if (modelo.value) emit('escaneado', modelo.value);
}
</script>

<template>
  <ion-item>
    <ion-input v-model="modelo" :label="label ?? 'Código de barras'" label-placement="stacked"
               :placeholder="placeholder ?? (disponible ? 'Escanea o escribe' : 'Lector USB o manual')"
               autocapitalize="characters" :disabled="disabled" @keyup.enter="alEnter" />
    <ion-button v-if="disponible" slot="end" fill="clear" aria-label="Escanear" @click="abrirEscaner">
      <ion-icon slot="icon-only" :icon="barcodeOutline" />
    </ion-button>
  </ion-item>
</template>
