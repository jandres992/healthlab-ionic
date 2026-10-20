<script setup lang="ts">
import {
  IonContent, IonHeader, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList, IonNote,
  IonPage, IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted } from 'vue';
import { listarPacientes, type FiltroPacientes } from '@/api/endpoints/pacientes';
import type { Paciente } from '@/api/tipos';
import EstadoLista from '@/components/EstadoLista.vue';
import { useListaPaginada } from '@/composables/useListaPaginada';

const lista = useListaPaginada<Paciente, FiltroPacientes>(listarPacientes, {});
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

onMounted(() => lista.cargar());
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary"><ion-title>Pacientes</ion-title></ion-toolbar>
      <ion-toolbar><ion-searchbar placeholder="Documento o nombre" :debounce="0" @ionInput="buscar" /></ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="lista.cargando.value" :error="lista.error.value" :vacio="!lista.items.value.length"
                   texto-vacio="No hay pacientes." @reintentar="lista.cargar()" />
      <ion-list v-if="lista.items.value.length">
        <ion-item v-for="p in lista.items.value" :key="p.id" button :detail="true">
          <ion-label>
            <h2>{{ p.nombre_completo }}</h2>
            <p>{{ p.tipo_documento }} {{ p.numero_documento }} · {{ p.sexo_biologico }} · {{ p.fecha_nacimiento }}</p>
          </ion-label>
          <ion-note slot="end">{{ p.regimen_salud }}</ion-note>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll :disabled="!lista.hayMas.value" @ionInfinite="masItems">
        <ion-infinite-scroll-content loading-text="Cargando…" />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>
