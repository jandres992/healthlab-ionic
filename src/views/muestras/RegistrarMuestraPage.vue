<script setup lang="ts">
/**
 * Toma de muestra (RF-24, RF-25, RF-27, RF-59, RN-26): orden, tipo, código escaneado o generado,
 * confirmación de dos identificadores, checklist preanalítico; funciona sin conexión (cola).
 */
import {
  IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonInput, IonItem, IonLabel,
  IonList, IonListHeader, IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { esApiError } from '@/api/http';
import { listarOrdenes, obtenerOrden } from '@/api/endpoints/ordenes';
import { registrarMuestra } from '@/api/endpoints/muestras';
import type { Orden } from '@/api/tipos';
import CampoCodigoBarras from '@/components/CampoCodigoBarras.vue';
import SelectorBusqueda from '@/components/SelectorBusqueda.vue';
import { useMensajes } from '@/composables/useMensajes';
import { useColaOfflineStore } from '@/stores/colaOffline';
import { filtrarOrdenes, guardarOrdenesDelDia, leerOrdenesDelDia } from '@/services/ordenesSinConexion';

const route = useRoute();
const router = useRouter();
const { exito, error } = useMensajes();
const cola = useColaOfflineStore();

const ordenes = ref<Orden[]>([]);
const ordenSel = ref<Array<string | number>>(route.query.orden ? [String(route.query.orden)] : []);
const tipoMuestra = ref('Sangre Total');
const codigo = ref('');
const condicion = ref('Normal');
const ubicacion = ref('');
const identidadConfirmada = ref(false);
const checklist = ref({ ayuno: false, tubo: false, volumen: false, integridad: false });
const guardando = ref(false);
const ordenesGuardadas = ref(false);   // sin red: la lista viene de las órdenes guardadas del día (D-02)

const TIPOS = ['Sangre Total', 'Suero', 'Plasma', 'Orina', 'Heces', 'Hisopado', 'Otro'];
const CONDICIONES = ['Normal', 'Hemolizada', 'Lipemica', 'Icterica', 'Insuficiente', 'Coagulada', 'Contaminada'];

const orden = computed(() => ordenes.value.find((o) => o.id === ordenSel.value[0]));
const puntaje = computed(() => Math.round((Object.values(checklist.value).filter(Boolean).length / 4) * 100));
const riesgo = computed(() => (puntaje.value < 50 ? 'Alto' : puntaje.value < 100 ? 'Medio' : 'Bajo'));

async function buscarOrdenes(texto: string) {
  try {
    return (await listarOrdenes({ search: texto, limit: 20 })).results;
  } catch (e) {
    if (esApiError(e) && e.sinConexion) return filtrarOrdenes(await leerOrdenesDelDia(), texto);
    throw e;
  }
}

async function guardar() {
  if (!orden.value) return error(new Error('Selecciona la orden.'));
  if (!identidadConfirmada.value) return error(new Error('Confirma los dos identificadores del paciente (nombre y documento).'));
  const cuerpo = {
    orden: orden.value.id, tipo_muestra: tipoMuestra.value, codigo_barras: codigo.value.trim() || undefined,
    condicion_muestra: condicion.value as never, ubicacion: ubicacion.value || undefined,
    observacion: `Checklist preanalítico ${puntaje.value}% (riesgo ${riesgo.value})`,
  };
  guardando.value = true;
  try {
    const m = await registrarMuestra(cuerpo);
    await exito(`Muestra ${m.codigo_barras} registrada.`);
    // El detalle invita a imprimir la etiqueta del tubo (RF-60.2).
    await router.replace(`/muestras/${m.id}?nueva=1`);
  } catch (e) {
    if (esApiError(e) && e.sinConexion) {
      await cola.encolar('muestra.registrar', cuerpo as Record<string, unknown>,
        `Toma ${tipoMuestra.value} para orden ${orden.value.numero_orden}`);
      await exito('Sin conexión: la toma quedó en cola y se enviará al volver la red.');
      await router.replace('/tabs/muestras');
    } else {
      await error(e, 'No se pudo registrar la muestra.');
    }
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  try {
    ordenes.value = (await listarOrdenes({ limit: 20 })).results;
    if (route.query.orden && !ordenes.value.some((o) => o.id === route.query.orden)) {
      ordenes.value.unshift(await obtenerOrden(String(route.query.orden)));
    }
    await guardarOrdenesDelDia(ordenes.value);
  } catch (e) {
    if (esApiError(e) && e.sinConexion) {
      ordenes.value = await leerOrdenesDelDia();
      ordenesGuardadas.value = true;
    } else {
      await error(e);
    }
  }
});
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/muestras" text="" /></ion-buttons>
        <ion-title>Registrar muestra</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-list-header><ion-label>Orden</ion-label></ion-list-header>
        <ion-item v-if="ordenesGuardadas" lines="none">
          <ion-note color="warning">
            {{ ordenes.length
              ? `Sin conexión: se muestran las ${ordenes.length} órdenes abiertas guardadas hoy en este equipo.`
              : 'Sin conexión y sin órdenes guardadas hoy: abre este formulario una vez con red para guardarlas.' }}
          </ion-note>
        </ion-item>
        <SelectorBusqueda v-model="ordenSel" titulo="Orden" :items="ordenes" :buscar-remoto="buscarOrdenes"
                          :etiqueta="(o) => `${o.numero_orden} · ${o.paciente_nombre}`" :detalle="(o) => `Doc. ${o.paciente_documento} · ${o.estado_general}`" />

        <template v-if="orden">
          <ion-list-header><ion-label>Identificación del paciente (RF-59)</ion-label></ion-list-header>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h2>{{ orden.paciente_nombre }}</h2>
              <p>Documento {{ orden.paciente_documento }}</p>
            </ion-label>
          </ion-item>
          <ion-item>
            <ion-checkbox v-model="identidadConfirmada" label-placement="end" justify="start">
              Verifiqué nombre completo y documento con el paciente
            </ion-checkbox>
          </ion-item>

          <ion-list-header><ion-label>Muestra</ion-label></ion-list-header>
          <ion-item>
            <ion-select v-model="tipoMuestra" label="Tipo de muestra" label-placement="stacked" interface="popover">
              <ion-select-option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</ion-select-option>
            </ion-select>
          </ion-item>
          <CampoCodigoBarras v-model="codigo" label="Código de barras (vacío = lo genera el sistema)" />
          <ion-item>
            <ion-select v-model="condicion" label="Condición" label-placement="stacked" interface="popover">
              <ion-select-option v-for="c in CONDICIONES" :key="c" :value="c">{{ c }}</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item><ion-input v-model="ubicacion" label="Ubicación / sala" label-placement="stacked" placeholder="Toma de muestras 1" /></ion-item>

          <ion-list-header><ion-label>Checklist preanalítico (RF-27)</ion-label></ion-list-header>
          <ion-item><ion-checkbox v-model="checklist.ayuno" label-placement="end" justify="start">Ayuno verificado (si aplica)</ion-checkbox></ion-item>
          <ion-item><ion-checkbox v-model="checklist.tubo" label-placement="end" justify="start">Tubo correcto</ion-checkbox></ion-item>
          <ion-item><ion-checkbox v-model="checklist.volumen" label-placement="end" justify="start">Volumen suficiente</ion-checkbox></ion-item>
          <ion-item><ion-checkbox v-model="checklist.integridad" label-placement="end" justify="start">Sin hemólisis ni coágulos visibles</ion-checkbox></ion-item>
          <ion-item lines="none">
            <ion-note :color="riesgo === 'Bajo' ? 'success' : riesgo === 'Medio' ? 'warning' : 'danger'">
              Puntaje {{ puntaje }} % · riesgo preanalítico {{ riesgo }}
            </ion-note>
          </ion-item>
        </template>
      </ion-list>
      <ion-button expand="block" class="ion-margin" :disabled="guardando || !orden" @click="guardar">Registrar toma</ion-button>
      <p v-if="!cola.conectado" class="ion-padding-horizontal"><ion-note color="warning">Sin conexión: la toma quedará en cola.</ion-note></p>
    </ion-content>
  </ion-page>
</template>
