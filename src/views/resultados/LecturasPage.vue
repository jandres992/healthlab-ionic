<script setup lang="ts">
/** Lecturas de analizadores recibidas por el middleware (RF-30, RF-31): ver trama y procesar. */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { listarLecturas, procesarLectura, type Lectura } from '@/api/endpoints/resultados';
import EstadoLista from '@/components/EstadoLista.vue';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const items = ref<Lectura[]>([]);
const cargando = ref(false);
const error = ref<unknown>(null);
const filtro = ref<'pendientes' | 'todas'>('pendientes');
const abierta = ref<string | null>(null);
const { exito, error: mostrarError } = useMensajes();

async function cargar() {
  cargando.value = true; error.value = null;
  try { items.value = (await listarLecturas({ procesado: filtro.value === 'pendientes' ? false : undefined, limit: 50 })).results; }
  catch (e) { error.value = e; } finally { cargando.value = false; }
}
async function procesar(l: Lectura) {
  try {
    const r = await procesarLectura(l.id);
    await exito(`Procesada: ${r.resultados_creados} creados, ${r.resultados_actualizados} actualizados, ${r.resultados_omitidos} omitidos, ${r.alertas_criticas} críticos.`);
    await cargar();
  } catch (e) { await mostrarError(e); }
}
function fecha(iso: string) { return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }); }
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/resultados" text="" /></ion-buttons>
        <ion-title>Lecturas de analizadores</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="filtro" @ionChange="cargar">
          <ion-segment-button value="pendientes">Por procesar</ion-segment-button>
          <ion-segment-button value="todas">Todas</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!items.length" texto-vacio="No hay lecturas." @reintentar="cargar" />
      <ion-list v-if="items.length">
        <template v-for="l in items" :key="l.id">
          <ion-item button @click="abierta = abierta === l.id ? null : l.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ l.equipo_origen }} <ion-note>{{ fecha(l.fecha_recepcion) }}</ion-note></h3>
              <p>Código {{ l.codigo_barras_leido ?? '— sin asociar' }} · {{ Object.keys(l.datos_json ?? {}).length }} analito(s)</p>
              <p v-if="l.procesado"><ion-note color="success">Procesada</ion-note></p>
            </ion-label>
            <Permitido accion="lecturas.procesar">
              <ion-button v-if="!l.procesado && l.codigo_barras_leido" slot="end" size="small" @click.stop="procesar(l)">Procesar</ion-button>
            </Permitido>
          </ion-item>
          <ion-item v-if="abierta === l.id" lines="full">
            <ion-label class="ion-text-wrap">
              <p v-for="(v, k) in (l.datos_json as Record<string, unknown>)" :key="String(k)"><strong>{{ k }}</strong>: {{ v }}</p>
              <p><ion-note><code>{{ l.trama_cruda }}</code></ion-note></p>
            </ion-label>
          </ion-item>
        </template>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
