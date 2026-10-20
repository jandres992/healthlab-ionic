<script setup lang="ts">
import {
  IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonPage,
  IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted } from 'vue';
import { listarMuestras, type FiltroMuestras } from '@/api/endpoints/muestras';
import type { Muestra } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import { useListaPaginada } from '@/composables/useListaPaginada';

const lista = useListaPaginada<Muestra, FiltroMuestras>(listarMuestras, {});
let temporizador: ReturnType<typeof setTimeout> | undefined;

function buscar(ev: CustomEvent) {
  clearTimeout(temporizador);
  const texto = String((ev.target as HTMLIonSearchbarElement).value ?? '').trim();
  temporizador = setTimeout(() => lista.cargar({ search: texto || undefined }), 300);
}
async function masItems(ev: CustomEvent) {
  await lista.siguiente();
  (ev.target as HTMLIonInfiniteScrollElement).complete();
}
function fecha(iso?: string | null) { return iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : ''; }

onMounted(() => lista.cargar());
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"><ion-title>Muestras</ion-title></ion-toolbar>
      <ion-toolbar><ion-searchbar placeholder="Código de barras u orden" :debounce="0" @ionInput="buscar" /></ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="lista.cargando.value" :error="lista.error.value" :vacio="!lista.items.value.length"
                   texto-vacio="No hay muestras." @reintentar="lista.cargar()" />
      <ion-list v-if="lista.items.value.length">
        <ion-item v-for="m in lista.items.value" :key="m.id" button :detail="true">
          <ion-label>
            <h2>{{ m.codigo_barras }} <EstadoBadge :estado="m.estado_muestra" /></h2>
            <p>{{ m.tipo_muestra }} · Orden {{ m.orden_numero }} · {{ m.paciente_nombre }}</p>
            <p>Tomada {{ fecha(m.fecha_recoleccion) }}<span v-if="m.condicion_muestra !== 'Normal'"> · {{ m.condicion_muestra }}</span></p>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll :disabled="!lista.hayMas.value" @ionInfinite="masItems">
        <ion-infinite-scroll-content loading-text="Cargando…" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>
