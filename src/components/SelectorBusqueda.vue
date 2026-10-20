<script setup lang="ts" generic="T extends { id: string | number }">
/** Selector con búsqueda en un modal: para pacientes, CUPS, etc. Admite selección múltiple. */
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonItem, IonLabel, IonList, IonModal, IonNote,
  IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed, ref, shallowRef, watch } from 'vue';

const props = defineProps<{
  titulo: string;
  items: T[];
  etiqueta: (item: T) => string;
  detalle?: (item: T) => string;
  multiple?: boolean;
  buscarRemoto?: (texto: string) => Promise<T[]>;
}>();
const seleccion = defineModel<Array<string | number>>({ default: () => [] });
const abierto = ref(false);
const texto = ref('');
// shallowRef: evita que Vue "desenvuelva" el genérico T y rompa el tipado.
const remotos = shallowRef<T[] | null>(null);
let temporizador: ReturnType<typeof setTimeout> | undefined;

const visibles = computed(() => {
  const base = remotos.value ?? props.items;
  const t = texto.value.trim().toLowerCase();
  if (!t) return base;
  return base.filter((i) => `${props.etiqueta(i)} ${props.detalle?.(i) ?? ''}`.toLowerCase().includes(t));
});

watch(texto, (t) => {
  if (!props.buscarRemoto) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(async () => { remotos.value = t.trim() ? await props.buscarRemoto!(t.trim()) : null; }, 300);
});

const seleccionados = computed(() => props.items.filter((i) => seleccion.value.includes(i.id)));

function alternar(item: T) {
  const id = item.id;
  if (props.multiple) {
    seleccion.value = seleccion.value.includes(id) ? seleccion.value.filter((x) => x !== id) : [...seleccion.value, id];
  } else {
    seleccion.value = [id];
    abierto.value = false;
  }
}
defineExpose({ abrir: () => { abierto.value = true; } });
</script>

<template>
  <ion-item button :detail="true" @click="abierto = true">
    <ion-label>
      <p>{{ titulo }}</p>
      <h3 v-if="seleccionados.length">{{ seleccionados.map(etiqueta).join(', ') }}</h3>
      <h3 v-else class="placeholder">Seleccionar…</h3>
    </ion-label>
  </ion-item>

  <ion-modal :is-open="abierto" @didDismiss="abierto = false">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end"><ion-button @click="abierto = false">{{ multiple ? 'Listo' : 'Cerrar' }}</ion-button></ion-buttons>
      </ion-toolbar>
      <ion-toolbar><ion-searchbar v-model="texto" :debounce="0" placeholder="Buscar" /></ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="i in visibles" :key="i.id" button @click="alternar(i)">
          <ion-checkbox v-if="multiple" slot="start" :checked="seleccion.includes(i.id)" aria-hidden="true" />
          <ion-label>
            <h3>{{ etiqueta(i) }}</h3>
            <p v-if="detalle">{{ detalle(i) }}</p>
          </ion-label>
          <ion-note v-if="!multiple && seleccion.includes(i.id)" slot="end" color="primary">✓</ion-note>
        </ion-item>
      </ion-list>
      <p v-if="!visibles.length" class="ion-padding ion-text-center">Sin resultados.</p>
    </ion-content>
  </ion-modal>
</template>

<style scoped>
.placeholder { color: var(--ion-color-medium); font-weight: normal; }
</style>
