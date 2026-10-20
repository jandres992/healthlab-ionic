<script setup lang="ts">
/** Detalle de orden: exámenes, muestras, admisión (offline), anulación, informe y toma de muestra. */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader,
  IonNote, IonPage, IonTitle, IonToolbar,
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { esApiError } from '@/api/http';
import { admitirOrden, anularExamen, descargarReporte, obtenerOrden } from '@/api/endpoints/ordenes';
import { listarMuestras } from '@/api/endpoints/muestras';
import type { Muestra, Orden } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';
import { usePermisos } from '@/composables/usePermisos';
import { useColaOfflineStore } from '@/stores/colaOffline';

const route = useRoute();
const id = String(route.params.id);
const orden = ref<Orden | null>(null);
const muestras = ref<Muestra[]>([]);
const cargando = ref(true);
const error = ref<unknown>(null);
const { exito, error: mostrarError, confirmar, pedirTexto } = useMensajes();
const { puede } = usePermisos();
const cola = useColaOfflineStore();

async function cargar() {
  cargando.value = true; error.value = null;
  try {
    orden.value = await obtenerOrden(id);
    muestras.value = (await listarMuestras({ orden: id, limit: 50 })).results;
  } catch (e) { error.value = e; } finally { cargando.value = false; }
}

async function admitir() {
  if (!orden.value) return;
  try {
    await admitirOrden(id);
    await exito('Admisión registrada.');
    await cargar();
  } catch (e) {
    if (esApiError(e) && e.sinConexion) {
      // RN-26: la admisión puede quedar en cola y se revalida en el servidor al sincronizar.
      await cola.encolar('orden.admitir', { orden: id }, `Admitir orden ${orden.value.numero_orden}`);
      await exito('Sin conexión: la admisión quedó en cola y se enviará al volver la red.');
    } else {
      await mostrarError(e);
    }
  }
}

async function anular(examenId: string, nombre: string) {
  const motivo = await pedirTexto(`Anular ${nombre}`, 'Motivo de la anulación');
  if (!motivo) return;
  try { await anularExamen(examenId, motivo); await exito('Examen anulado.'); await cargar(); } catch (e) { await mostrarError(e); }
}

async function verInforme() {
  if (!orden.value) return;
  try {
    const blob = await descargarReporte(id);
    const nombre = `informe_${orden.value.numero_orden}.pdf`;
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const base64 = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
      const f = await Filesystem.writeFile({ path: nombre, data: base64, directory: Directory.Cache });
      await Share.share({ title: nombre, url: f.uri });
    } else {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch (e) { await mostrarError(e, 'No se pudo obtener el informe.'); }
}

function fecha(iso?: string | null) { return iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/ordenes" text="" /></ion-buttons>
        <ion-title>{{ orden?.numero_orden ?? 'Orden' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!orden" @reintentar="cargar" />
      <template v-if="orden">
        <ion-list>
          <ion-item lines="none">
            <ion-label>
              <h2>{{ orden.paciente_nombre }} <EstadoBadge :estado="orden.estado_general" /></h2>
              <p>Documento {{ orden.paciente_documento }} · Médico {{ orden.medico_nombre ?? '—' }}</p>
              <p>Orden {{ fecha(orden.fecha_orden) }} · Admisión {{ fecha(orden.fecha_admision) }}</p>
              <p v-if="orden.codigo_cie10">CIE-10 {{ orden.codigo_cie10 }}<span v-if="orden.convenio"> · {{ orden.convenio }}</span></p>
              <p v-if="orden.observaciones_clinicas">{{ orden.observaciones_clinicas }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="acciones ion-padding-horizontal">
          <Permitido accion="ordenes.admitir">
            <ion-button v-if="!orden.fecha_admision && orden.estado_general !== 'Finalizada'" size="small" @click="admitir">Admitir</ion-button>
          </Permitido>
          <Permitido accion="muestras.registrar">
            <ion-button v-if="orden.estado_general !== 'Finalizada' && orden.estado_general !== 'Anulada'" size="small" fill="outline"
                        :router-link="`/muestras/nueva?orden=${orden.id}`">Registrar muestra</ion-button>
          </Permitido>
          <Permitido accion="ordenes.reporte_pdf">
            <ion-button size="small" fill="outline" @click="verInforme">
              {{ orden.estado_general === 'Finalizada' ? 'Informe final' : orden.estado_general === 'Resultados Parciales' ? 'Informe parcial' : 'Vista preliminar' }}
            </ion-button>
          </Permitido>
        </div>

        <ion-list>
          <ion-list-header><ion-label>Exámenes</ion-label></ion-list-header>
          <ion-item v-for="e in orden.examenes" :key="e.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ e.cups_descripcion }} <EstadoBadge :estado="e.estado_examen" /></h3>
              <p>CUPS {{ e.cups_codigo }}<span v-if="e.codigo_barras"> · Muestra {{ e.codigo_barras }}</span></p>
              <p v-if="e.motivo_rechazo"><ion-note color="danger">Rechazo: {{ e.motivo_rechazo }}</ion-note></p>
              <p v-if="e.motivo_anulacion"><ion-note>Anulado: {{ e.motivo_anulacion }}</ion-note></p>
            </ion-label>
            <ion-button v-if="puede('examenes.anular') && !e.es_final" slot="end" size="small" fill="clear" color="danger"
                        @click="anular(e.id, e.cups_descripcion ?? '')">Anular</ion-button>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header><ion-label>Muestras</ion-label></ion-list-header>
          <ion-item v-for="m in muestras" :key="m.id" button :router-link="`/muestras/${m.id}`">
            <ion-label>
              <h3>{{ m.codigo_barras }} <EstadoBadge :estado="m.estado_muestra" /></h3>
              <p>{{ m.tipo_muestra }} · {{ fecha(m.fecha_recoleccion) }}</p>
            </ion-label>
          </ion-item>
          <ion-item v-if="!muestras.length" lines="none"><ion-label color="medium">Sin muestras registradas.</ion-label></ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.acciones { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
