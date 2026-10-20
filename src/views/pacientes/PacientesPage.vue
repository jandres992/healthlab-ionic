<script setup lang="ts">
import {
  IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel,
  IonList, IonNote, IonPage, IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/vue';
import { addOutline } from 'ionicons/icons';
import Permitido from '@/components/Permitido.vue';
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
        <ion-item v-for="p in lista.items.value" :key="p.id" button :detail="true" :router-link="`/pacientes/${p.id}`">
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
      <Permitido accion="pacientes.crear">
        <ion-fab slot="fixed" vertical="bottom" horizontal="end">
          <ion-fab-button router-link="/pacientes/nuevo" aria-label="Nuevo paciente"><ion-icon :icon="addOutline" /></ion-fab-button>
        </ion-fab>
      </Permitido>
    </ion-content>
  </ion-page>
</template>
