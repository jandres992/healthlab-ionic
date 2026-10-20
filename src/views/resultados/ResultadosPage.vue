<script setup lang="ts">
/** Bandeja de exámenes (fase 3: listado; la validación y el ingreso llegan en la fase 5). */
import {
  IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { listarExamenes } from '@/api/endpoints/ordenes';
import type { Examen } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import { useListaPaginada } from '@/composables/useListaPaginada';
import { usePermisos } from '@/composables/usePermisos';

const { puede } = usePermisos();
type Filtro = { estado_examen__nombre?: string; limit?: number; offset?: number };
const lista = useListaPaginada<Examen, Filtro>(listarExamenes, {});
const estado = ref(puede('examenes.aprobar') ? 'En Análisis' : '');

function recargar() { lista.cargar({ estado_examen__nombre: estado.value || undefined }); }
async function masItems(ev: CustomEvent) {
  await lista.siguiente();
  (ev.target as HTMLIonInfiniteScrollElement).complete();
}
onMounted(recargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"><ion-title>Resultados</ion-title></ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="estado" scrollable @ionChange="recargar">
          <ion-segment-button value="">Todos</ion-segment-button>
          <ion-segment-button value="En Análisis">En análisis</ion-segment-button>
          <ion-segment-button value="Repetir">Repetir</ion-segment-button>
          <ion-segment-button value="Validado">Validados</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="lista.cargando.value" :error="lista.error.value" :vacio="!lista.items.value.length"
                   texto-vacio="No hay exámenes en este estado." @reintentar="recargar" />
      <ion-list v-if="lista.items.value.length">
        <ion-item v-for="e in lista.items.value" :key="e.id" button :detail="true">
          <ion-label>
            <h2>{{ e.cups_descripcion }} <EstadoBadge :estado="e.estado_examen" /></h2>
            <p>Orden {{ e.orden_numero }} · {{ e.paciente_nombre }} · {{ e.paciente_documento }}</p>
            <p v-if="e.codigo_barras">Muestra {{ e.codigo_barras }}</p>
            <p v-if="e.validado_por_nombre">Validado por {{ e.validado_por_nombre }} ({{ e.validado_por_registro || 'sin registro' }})</p>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll :disabled="!lista.hayMas.value" @ionInfinite="masItems">
        <ion-infinite-scroll-content loading-text="Cargando…" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>
