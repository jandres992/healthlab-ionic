<script setup lang="ts">
import {
  IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel,
  IonList, IonPage, IonSearchbar, IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
import Permitido from '@/components/Permitido.vue';
import { onMounted, ref } from 'vue';
import { listarOrdenes, type FiltroOrdenes } from '@/api/endpoints/ordenes';
import type { Orden } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import { useListaPaginada } from '@/composables/useListaPaginada';

const lista = useListaPaginada<Orden, FiltroOrdenes>(listarOrdenes, {});
const estado = ref('');
const texto = ref('');
let temporizador: ReturnType<typeof setTimeout> | undefined;

function recargar() {
  lista.cargar({ search: texto.value || undefined, estado_general__nombre: estado.value || undefined });
}
function buscar(ev: CustomEvent) {
  clearTimeout(temporizador);
  texto.value = String((ev.target as HTMLIonSearchbarElement).value ?? '').trim();
  temporizador = setTimeout(recargar, 300);
}
async function masItems(ev: CustomEvent) {
  await lista.siguiente();
  (ev.target as HTMLIonInfiniteScrollElement).complete();
}
function fecha(iso?: string | null) { return iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''; }

onMounted(recargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"><ion-title>Órdenes</ion-title></ion-toolbar>
      <ion-toolbar><ion-searchbar placeholder="Número de orden o documento" :debounce="0" @ionInput="buscar" /></ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="estado" scrollable @ionChange="recargar">
          <ion-segment-button value="">Todas</ion-segment-button>
          <ion-segment-button value="Registrada">Registradas</ion-segment-button>
          <ion-segment-button value="En Proceso">En proceso</ion-segment-button>
          <ion-segment-button value="Resultados Parciales">Parciales</ion-segment-button>
          <ion-segment-button value="Finalizada">Finalizadas</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="lista.cargando.value" :error="lista.error.value" :vacio="!lista.items.value.length"
                   texto-vacio="No hay órdenes." @reintentar="recargar" />
      <ion-list v-if="lista.items.value.length">
        <ion-item v-for="o in lista.items.value" :key="o.id" button :detail="true" :router-link="`/ordenes/${o.id}`">
          <ion-label>
            <h2>{{ o.numero_orden }} <EstadoBadge :estado="o.estado_general" /></h2>
            <p>{{ o.paciente_nombre }} · {{ o.paciente_documento }}</p>
            <p>{{ o.examenes?.length ?? 0 }} examen(es) · {{ fecha(o.fecha_orden) }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll :disabled="!lista.hayMas.value" @ionInfinite="masItems">
        <ion-infinite-scroll-content loading-text="Cargando…" />
      </ion-infinite-scroll>
      <Permitido accion="ordenes.crear">
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button router-link="/ordenes/nueva" aria-label="Nueva orden"><ion-icon :icon="addOutline" /></ion-fab-button>
        </ion-fab>
      </Permitido>
    </ion-content>
  </ion-page>
</template>
