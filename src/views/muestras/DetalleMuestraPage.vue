<script setup lang="ts">
/** Detalle de muestra: recepción y rechazo (bacteriólogo), cadena de custodia y eventos. */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader,
  IonNote, IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, alertController,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  anotarEvento, crearAlicuota, custodia, descartarMuestra, obtenerMuestra, rechazarMuestra, recibirMuestra,
} from '@/api/endpoints/muestras';
import type { EventoMuestra, Muestra } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const route = useRoute();
const id = String(route.params.id);
const muestra = ref<Muestra | null>(null);
const eventos = ref<EventoMuestra[]>([]);
const cargando = ref(true);
const error = ref<unknown>(null);
const { exito, error: mostrarError, confirmar, pedirTexto } = useMensajes();

const CONDICIONES = ['Hemolizada', 'Lipemica', 'Icterica', 'Insuficiente', 'Coagulada', 'Contaminada'];
const condicionRechazo = ref('Hemolizada');

async function cargar() {
  cargando.value = true; error.value = null;
  try {
    muestra.value = await obtenerMuestra(id);
    eventos.value = await custodia(id);
  } catch (e) { error.value = e; } finally { cargando.value = false; }
}

async function recibir() {
  try {
    const r = await recibirMuestra(id);
    await exito(`Muestra recibida. ${r.examenes_actualizados} examen(es) en análisis.`);
    await cargar();
  } catch (e) { await mostrarError(e); }
}

async function rechazar() {
  const motivo = await pedirTexto('Rechazar muestra', `Motivo (condición: ${condicionRechazo.value})`);
  if (!motivo) return;
  try { await rechazarMuestra(id, motivo, condicionRechazo.value); await exito('Muestra rechazada; se avisó al flebotomista y al médico.'); await cargar(); }
  catch (e) { await mostrarError(e); }
}

async function anotar(tipo: 'transporte' | 'almacenamiento' | 'analisis' | 'nota') {
  const a = await alertController.create({
    header: `Registrar ${tipo}`,
    inputs: [
      { name: 'ubicacion', type: 'text', placeholder: 'Ubicación (nevera, gradilla, sala)' },
      { name: 'temperatura', type: 'number', placeholder: 'Temperatura °C (opcional)' },
      { name: 'observacion', type: 'textarea', placeholder: 'Observación' },
    ],
    buttons: ['Cancelar', { text: 'Guardar', role: 'confirm' }],
  });
  await a.present();
  const { role, data } = await a.onDidDismiss();
  if (role !== 'confirm') return;
  const v = data?.values ?? {};
  try {
    await anotarEvento(id, { tipo, ubicacion: v.ubicacion, observacion: v.observacion, temperatura: v.temperatura || null });
    await exito('Evento registrado.'); await cargar();
  } catch (e) { await mostrarError(e); }
}

async function alicuota() {
  if (!(await confirmar('Crear alícuota', 'Se creará una muestra hija vinculada a esta.', 'Crear'))) return;
  try { const h = await crearAlicuota(id, {}); await exito(`Alícuota ${h.codigo_barras} creada.`); await cargar(); } catch (e) { await mostrarError(e); }
}

async function descartar() {
  const motivo = await pedirTexto('Descartar muestra', 'Protocolo o motivo de descarte');
  if (!motivo) return;
  try { await descartarMuestra(id, motivo); await exito('Muestra descartada.'); await cargar(); } catch (e) { await mostrarError(e); }
}

function fecha(iso?: string | null) { return iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/muestras" text="" /></ion-buttons>
        <ion-title>{{ muestra?.codigo_barras ?? 'Muestra' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error" :vacio="!muestra" @reintentar="cargar" />
      <template v-if="muestra">
        <ion-list>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h2>{{ muestra.tipo_muestra }} <EstadoBadge :estado="muestra.estado_muestra" /></h2>
              <p>Orden <router-link :to="`/ordenes/${muestra.orden}`">{{ muestra.orden_numero }}</router-link> · {{ muestra.paciente_nombre }}</p>
              <p>Tomada {{ fecha(muestra.fecha_recoleccion) }} por {{ muestra.usuario_recolecta_username ?? '—' }}</p>
              <p v-if="muestra.fecha_declarada_dispositivo"><ion-note>Hora declarada por el dispositivo: {{ fecha(muestra.fecha_declarada_dispositivo) }}</ion-note></p>
              <p>Condición {{ muestra.condicion_muestra }}<span v-if="muestra.ubicacion_actual"> · {{ muestra.ubicacion_actual }}</span></p>
              <p v-if="muestra.muestra_madre"><ion-note>Alícuota de otra muestra</ion-note></p>
              <p v-if="muestra.motivo_rechazo"><ion-note color="danger">Rechazo: {{ muestra.motivo_rechazo }}</ion-note></p>
            </ion-label>
          </ion-item>
        </ion-list>

        <Permitido accion="muestras.recibir">
          <div class="acciones ion-padding-horizontal" v-if="muestra.estado_muestra === 'Recolectada'">
            <ion-button size="small" @click="recibir">Recibir en laboratorio</ion-button>
          </div>
          <div class="acciones ion-padding-horizontal" v-if="muestra.estado_muestra === 'Recolectada' || muestra.estado_muestra === 'Recibida en Laboratorio'">
            <ion-item lines="none" class="condicion">
              <ion-select v-model="condicionRechazo" label="Condición" interface="popover">
                <ion-select-option v-for="c in CONDICIONES" :key="c" :value="c">{{ c }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-button size="small" color="danger" fill="outline" @click="rechazar">Rechazar</ion-button>
          </div>
          <div class="acciones ion-padding-horizontal" v-if="muestra.estado_muestra === 'Recibida en Laboratorio'">
            <ion-button size="small" fill="outline" @click="alicuota">Alícuota</ion-button>
            <ion-button size="small" fill="clear" color="medium" @click="descartar">Descartar</ion-button>
          </div>
        </Permitido>

        <Permitido accion="custodia.registrar">
          <div class="acciones ion-padding-horizontal" v-if="muestra.estado_muestra !== 'Descartada'">
            <ion-button size="small" fill="clear" @click="anotar('transporte')">+ Transporte</ion-button>
            <ion-button size="small" fill="clear" @click="anotar('almacenamiento')">+ Almacenamiento</ion-button>
            <ion-button size="small" fill="clear" @click="anotar('nota')">+ Nota</ion-button>
          </div>
        </Permitido>

        <ion-list>
          <ion-list-header><ion-label>Cadena de custodia</ion-label></ion-list-header>
          <ion-item v-for="e in eventos" :key="e.id">
            <ion-label class="ion-text-wrap">
              <h3>{{ e.tipo }} <ion-note>{{ fecha(e.fecha) }}</ion-note></h3>
              <p>{{ e.usuario_username ?? 'sistema' }}<span v-if="e.rol"> ({{ e.rol }})</span><span v-if="e.ubicacion"> · {{ e.ubicacion }}</span><span v-if="e.temperatura"> · {{ e.temperatura }} °C</span></p>
              <p v-if="e.observacion">{{ e.observacion }}</p>
              <p v-if="e.fecha_declarada_dispositivo"><ion-note>Declarada: {{ fecha(e.fecha_declarada_dispositivo) }}</ion-note></p>
            </ion-label>
          </ion-item>
        </ion-list>
      </template>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.acciones { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px; }
.condicion { --padding-start: 0; flex: 1; min-width: 160px; }
</style>
