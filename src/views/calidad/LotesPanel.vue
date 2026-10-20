<script setup lang="ts">
/** Lotes de reactivo por equipo y analito (RF-52). */
import { IonBadge, IonButton, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonSelect, IonSelectOption, IonToggle } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { crearLoteReactivo, editarLoteReactivo, listarEquipos, listarLotesReactivo, type Equipo, type LoteReactivo } from '@/api/endpoints/calidad';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const { exito, error } = useMensajes();
const equipos = ref<Equipo[]>([]);
const lotes = ref<LoteReactivo[]>([]);
const nuevo = ref({ equipo: null as number | null, nombre_parametro: '', nombre: '', lote: '', fecha_vencimiento: '', fecha_apertura: '' });
const mostrar = ref(false);

async function cargar() {
  try { [equipos.value, lotes.value] = await Promise.all([listarEquipos(), listarLotesReactivo()]); } catch (e) { await error(e); }
}
async function guardar() {
  try {
    await crearLoteReactivo({ ...nuevo.value, fecha_apertura: nuevo.value.fecha_apertura || null } as never);
    mostrar.value = false; await exito('Lote registrado.'); await cargar();
  } catch (e) { await error(e); }
}
async function alternar(l: LoteReactivo) {
  try { await editarLoteReactivo(l.id, { activo: !l.activo }); await cargar(); } catch (e) { await error(e); }
}
function nombreEquipo(id?: number | null) { return equipos.value.find((e) => e.id === id)?.nombre ?? 'Todos'; }
onMounted(cargar);
</script>

<template>
  <ion-list>
    <Permitido accion="lotes.gestionar">
      <ion-item lines="full"><ion-button fill="clear" @click="mostrar = !mostrar">+ Nuevo lote de reactivo</ion-button></ion-item>
      <template v-if="mostrar">
        <ion-item>
          <ion-select v-model="nuevo.equipo" label="Equipo" label-placement="stacked" interface="popover">
            <ion-select-option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.nombre }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item><ion-input v-model="nuevo.nombre_parametro" label="Analito (vacío = todos los del equipo)" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.nombre" label="Reactivo" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.lote" label="Lote" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.fecha_vencimiento" type="date" label="Vence" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model="nuevo.fecha_apertura" type="date" label="Apertura (opcional)" label-placement="stacked" /></ion-item>
        <ion-button expand="block" fill="outline" class="ion-margin" @click="guardar">Guardar</ion-button>
      </template>
    </Permitido>
    <ion-list-header><ion-label>Lotes</ion-label></ion-list-header>
    <ion-item v-for="l in lotes" :key="l.id">
      <ion-label class="ion-text-wrap">
        <h3>{{ l.nombre }} · lote {{ l.lote }}
          <ion-badge v-if="l.vencido" color="danger">vencido</ion-badge>
          <ion-badge v-else-if="!l.activo" color="medium">inactivo</ion-badge>
        </h3>
        <p>{{ nombreEquipo(l.equipo) }} · {{ l.nombre_parametro || 'todos los analitos' }} · vence {{ l.fecha_vencimiento }}</p>
      </ion-label>
      <Permitido accion="lotes.gestionar"><ion-toggle slot="end" :checked="!!l.activo" @ionChange="alternar(l)" aria-label="Activo" /></Permitido>
    </ion-item>
    <ion-item v-if="!lotes.length" lines="none"><ion-label color="medium">Sin lotes registrados.</ion-label></ion-item>
  </ion-list>
</template>
