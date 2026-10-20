<script setup lang="ts">
/** Acuse de valor crítico con read-back obligatorio (RF-54). */
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonList, IonModal, IonSelect,
  IonSelectOption, IonTextarea, IonTitle, IonToolbar,
} from '@ionic/vue';
import { ref } from 'vue';
import { registrarAcuse } from '@/api/endpoints/resultados';
import type { Resultado } from '@/api/tipos';
import { useMensajes } from '@/composables/useMensajes';

const props = defineProps<{ resultado: Resultado | null }>();
const emit = defineEmits<{ cerrado: [registrado: boolean] }>();
const { exito, error } = useMensajes();

const comunicadoA = ref('');
const medio = ref<'telefono' | 'presencial' | 'sistema' | 'otro'>('telefono');
const readBack = ref(false);
const observacion = ref('');
const guardando = ref(false);

async function guardar() {
  if (!props.resultado) return;
  if (!comunicadoA.value.trim()) return error(new Error('Indica a quién se comunicó el valor.'));
  if (!readBack.value) return error(new Error('El acuse exige que el receptor repita el valor (read-back).'));
  guardando.value = true;
  try {
    await registrarAcuse(props.resultado.id, { comunicado_a: comunicadoA.value.trim(), medio: medio.value, read_back: true, observacion: observacion.value });
    await exito('Acuse registrado.');
    emit('cerrado', true);
  } catch (e) { await error(e); } finally { guardando.value = false; }
}
</script>

<template>
  <ion-modal :is-open="!!resultado" @didDismiss="emit('cerrado', false)">
    <ion-header>
      <ion-toolbar color="danger">
        <ion-title>Acuse de valor crítico</ion-title>
        <ion-buttons slot="end"><ion-button @click="emit('cerrado', false)">Cerrar</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content v-if="resultado">
      <ion-list>
        <ion-item lines="none">
          <ion-input :value="`${resultado.parametro_nombre}: ${resultado.valor_resultado} ${resultado.unidades_aplicadas ?? ''}`" label="Valor" label-placement="stacked" readonly />
        </ion-item>
        <ion-item><ion-input v-model="comunicadoA" label="Comunicado a (nombre y cargo)" label-placement="stacked" placeholder="Dr. Pérez, hospitalización" /></ion-item>
        <ion-item>
          <ion-select v-model="medio" label="Medio" label-placement="stacked" interface="popover">
            <ion-select-option value="telefono">Teléfono</ion-select-option>
            <ion-select-option value="presencial">Presencial</ion-select-option>
            <ion-select-option value="sistema">Sistema</ion-select-option>
            <ion-select-option value="otro">Otro</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-checkbox v-model="readBack" label-placement="end" justify="start">
            <span class="ion-text-wrap">El receptor repitió el valor y el paciente (read-back)</span>
          </ion-checkbox>
        </ion-item>
        <ion-item><ion-textarea v-model="observacion" label="Observación" label-placement="stacked" auto-grow /></ion-item>
      </ion-list>
      <ion-button expand="block" color="danger" class="ion-margin" :disabled="guardando" @click="guardar">Registrar acuse</ion-button>
    </ion-content>
  </ion-modal>
</template>
