<script setup lang="ts">
/** Valores críticos pendientes de acuse (RF-54, RF-54.1). */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage,
  IonTitle, IonToolbar,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { listarCriticos } from '@/api/endpoints/resultados';
import type { Resultado } from '@/api/tipos';
import EstadoLista from '@/components/EstadoLista.vue';
import FormularioAcuse from '@/components/FormularioAcuse.vue';
import Permitido from '@/components/Permitido.vue';

const items = ref<Resultado[]>([]);
const cargando = ref(false);
const error = ref<unknown>(null);
const acuseDe = ref<Resultado | null>(null);

async function cargar() {
  cargando.value = true; error.value = null;
  try { items.value = await listarCriticos(true); } catch (e) { error.value = e; } finally { cargando.value = false; }
}
function minutos(iso: string) { return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); }
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="danger">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/inicio" text="" /></ion-buttons>
        <ion-title>Valores críticos sin acuse</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!items.length" texto-vacio="No hay valores críticos pendientes." @reintentar="cargar" />
      <ion-list v-if="items.length">
        <ion-item v-for="r in items" :key="r.id" button :router-link="`/examenes/${r.examen_solicitado}`">
          <ion-label class="ion-text-wrap">
            <h3>{{ r.parametro_nombre }}: <strong>{{ r.valor_resultado }} {{ r.unidades_aplicadas ?? '' }}</strong></h3>
            <p>Rango {{ r.rango_min_aplicado ?? '' }} – {{ r.rango_max_aplicado ?? '' }} · hace {{ minutos(r.fecha_procesamiento) }} min
              <ion-note v-if="r.critico_escalado" color="danger"> · ESCALADO</ion-note></p>
          </ion-label>
          <Permitido accion="criticos.acusar">
            <ion-button slot="end" size="small" color="danger" @click.stop="acuseDe = r">Acuse</ion-button>
          </Permitido>
        </ion-item>
      </ion-list>
      <FormularioAcuse :resultado="acuseDe" @cerrado="(ok) => { acuseDe = null; if (ok) cargar(); }" />
    </ion-content>
  </ion-page>
</template>
