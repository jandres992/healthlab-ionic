<script setup lang="ts">
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader,
  IonPage, IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { listarOrdenes } from '@/api/endpoints/ordenes';
import { obtenerPaciente } from '@/api/endpoints/pacientes';
import type { Orden, Paciente } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import Permitido from '@/components/Permitido.vue';

const route = useRoute();
const id = String(route.params.id);
const paciente = ref<Paciente | null>(null);
const ordenes = ref<Orden[]>([]);
const cargando = ref(true);
const error = ref<unknown>(null);

async function cargar() {
  cargando.value = true; error.value = null;
  try {
    paciente.value = await obtenerPaciente(id);
    ordenes.value = (await listarOrdenes({ paciente: id, limit: 20 })).results;
  } catch (e) { error.value = e; } finally { cargando.value = false; }
}
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/pacientes" text="" /></ion-buttons>
        <ion-title>Paciente</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!paciente" @reintentar="cargar" />
      <template v-if="paciente">
        <ion-list>
          <ion-list-header><ion-label>{{ paciente.nombre_completo }}</ion-label></ion-list-header>
          <ion-item><ion-label>Documento</ion-label><ion-label slot="end">{{ paciente.tipo_documento }} {{ paciente.numero_documento }}</ion-label></ion-item>
          <ion-item><ion-label>Nacimiento</ion-label><ion-label slot="end">{{ paciente.fecha_nacimiento }} · {{ paciente.sexo_biologico }}</ion-label></ion-item>
          <ion-item><ion-label>Régimen</ion-label><ion-label slot="end">{{ paciente.regimen_salud }}</ion-label></ion-item>
          <ion-item v-if="paciente.telefono"><ion-label>Teléfono</ion-label><ion-label slot="end">{{ paciente.telefono }}</ion-label></ion-item>
          <ion-item><ion-label>Habeas Data</ion-label><ion-label slot="end">{{ paciente.consentimiento_habeas_data ? 'Aceptado' : 'Sin registrar' }}</ion-label></ion-item>
        </ion-list>

        <Permitido accion="ordenes.crear">
          <ion-button expand="block" class="ion-margin" :router-link="`/ordenes/nueva?paciente=${paciente.id}`">Nueva orden</ion-button>
        </Permitido>

        <ion-list>
          <ion-list-header><ion-label>Órdenes</ion-label></ion-list-header>
          <ion-item v-for="o in ordenes" :key="o.id" button :router-link="`/ordenes/${o.id}`">
            <ion-label>
              <h3>{{ o.numero_orden }} <EstadoBadge :estado="o.estado_general" /></h3>
              <p>{{ o.examenes?.length ?? 0 }} examen(es) · {{ new Date(o.fecha_orden!).toLocaleDateString('es-CO') }}</p>
            </ion-label>
          </ion-item>
          <ion-item v-if="!ordenes.length" lines="none"><ion-label color="medium">Sin órdenes.</ion-label></ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>
