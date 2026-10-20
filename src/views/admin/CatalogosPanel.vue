<script setup lang="ts">
/** Catálogos (RF-10, RF-13.2): CUPS y tipos de documento; se desactivan, nunca se borran. */
import { IonBadge, IonButton, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonSearchbar, IonToggle } from '@ionic/vue';
import { onMounted, ref } from 'vue';
import {
  crearCups, crearTipoDocumento, editarCups, editarTipoDocumento, listarCupsTodos, listarTiposDocumentoTodos,
} from '@/api/endpoints/admin';
import type { CatalogoCups, TipoDocumento } from '@/api/tipos';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const { exito, error } = useMensajes();
const cups = ref<CatalogoCups[]>([]);
const tipos = ref<TipoDocumento[]>([]);
const nuevoCups = ref({ codigo_cups: '', descripcion: '' });
const nuevoTipo = ref({ codigo: '', descripcion: '' });
let temporizador: ReturnType<typeof setTimeout> | undefined;

async function cargar(texto = '') {
  try { [cups.value, tipos.value] = await Promise.all([listarCupsTodos(texto), listarTiposDocumentoTodos()]); } catch (e) { await error(e); }
}
function buscar(ev: CustomEvent) {
  clearTimeout(temporizador);
  const t = String((ev.target as HTMLIonSearchbarElement).value ?? '').trim();
  temporizador = setTimeout(() => cargar(t), 300);
}
async function guardarCups() {
  try { await crearCups(nuevoCups.value); nuevoCups.value = { codigo_cups: '', descripcion: '' }; await exito('CUPS creado.'); await cargar(); } catch (e) { await error(e); }
}
async function alternarCups(c: CatalogoCups) { try { await editarCups(c.id, { activo: !c.activo }); await cargar(); } catch (e) { await error(e); } }
async function guardarTipo() {
  try { await crearTipoDocumento(nuevoTipo.value); nuevoTipo.value = { codigo: '', descripcion: '' }; await exito('Tipo de documento creado.'); await cargar(); } catch (e) { await error(e); }
}
async function alternarTipo(t: TipoDocumento) { try { await editarTipoDocumento(t.id, { activo: !t.activo }); await cargar(); } catch (e) { await error(e); } }
onMounted(() => cargar());
</script>

<template>
  <ion-list>
    <ion-list-header><ion-label>Exámenes (CUPS)</ion-label></ion-list-header>
    <Permitido accion="catalogos.gestionar">
      <ion-item>
        <ion-input v-model="nuevoCups.codigo_cups" label="Código CUPS" label-placement="stacked" placeholder="903895" style="max-width: 160px" />
        <ion-input v-model="nuevoCups.descripcion" label="Descripción" label-placement="stacked" placeholder="Hemograma IV" />
        <ion-button slot="end" size="small" @click="guardarCups">Agregar</ion-button>
      </ion-item>
    </Permitido>
    <ion-searchbar placeholder="Buscar CUPS" :debounce="0" @ionInput="buscar" />
    <ion-item v-for="c in cups" :key="c.id">
      <ion-label><h3>{{ c.codigo_cups }} <ion-badge v-if="!c.activo" color="medium">inactivo</ion-badge></h3><p>{{ c.descripcion }}</p></ion-label>
      <Permitido accion="catalogos.gestionar"><ion-toggle slot="end" :checked="c.activo !== false" aria-label="Activo" @ionChange="alternarCups(c)" /></Permitido>
    </ion-item>

    <ion-list-header><ion-label>Tipos de documento del paciente</ion-label></ion-list-header>
    <Permitido accion="catalogos.gestionar">
      <ion-item>
        <ion-input v-model="nuevoTipo.codigo" label="Código" label-placement="stacked" placeholder="PPT" style="max-width: 120px" autocapitalize="characters" />
        <ion-input v-model="nuevoTipo.descripcion" label="Descripción" label-placement="stacked" placeholder="Permiso por protección temporal" />
        <ion-button slot="end" size="small" @click="guardarTipo">Agregar</ion-button>
      </ion-item>
    </Permitido>
    <ion-item v-for="t in tipos" :key="t.id">
      <ion-label><h3>{{ t.codigo }} <ion-badge v-if="!t.activo" color="medium">inactivo</ion-badge></h3><p>{{ t.descripcion }}</p></ion-label>
      <Permitido accion="catalogos.gestionar"><ion-toggle slot="end" :checked="t.activo !== false" aria-label="Activo" @ionChange="alternarTipo(t)" /></Permitido>
    </ion-item>
  </ion-list>
</template>
