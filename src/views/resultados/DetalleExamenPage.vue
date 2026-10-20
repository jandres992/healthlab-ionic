<script setup lang="ts">
/**
 * Detalle de examen para el bacteriólogo (RF-32, RF-34, RF-35, RF-50.1, RF-54):
 * resultados con banderas, ingreso manual de los parámetros faltantes, estado del CCI,
 * aprobar (con justificación si la política lo exige), rechazar, anular y acuse de críticos.
 */
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList,
  IonListHeader, IonNote, IonPage, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { estadoCCI, listarEquipos, type Equipo, type EstadoCCI } from '@/api/endpoints/calidad';
import { listarParametros } from '@/api/endpoints/catalogos';
import { anularExamen, aprobarExamen, obtenerExamen, rechazarExamen } from '@/api/endpoints/ordenes';
import { listarResultados, registrarResultado } from '@/api/endpoints/resultados';
import { esApiError } from '@/api/http';
import type { Examen, Parametro, Resultado } from '@/api/tipos';
import EstadoBadge from '@/components/EstadoBadge.vue';
import EstadoLista from '@/components/EstadoLista.vue';
import FormularioAcuse from '@/components/FormularioAcuse.vue';
import Permitido from '@/components/Permitido.vue';
import ValorResultado from '@/components/ValorResultado.vue';
import { useMensajes } from '@/composables/useMensajes';
import { usePermisos } from '@/composables/usePermisos';

const route = useRoute();
const id = String(route.params.id);
const { exito, error, confirmar, pedirTexto } = useMensajes();
const { puede } = usePermisos();

const examen = ref<Examen | null>(null);
const resultados = ref<Resultado[]>([]);
const parametros = ref<Parametro[]>([]);
const equipos = ref<Equipo[]>([]);
const cci = ref<Record<string, EstadoCCI>>({});
const cargando = ref(true);
const error_ = ref<unknown>(null);
const acuseDe = ref<Resultado | null>(null);

// Ingreso manual
const paramSel = ref<number | null>(null);
const valor = ref('');
const comentario = ref('');
const equipoSel = ref<number | null>(null);
const guardando = ref(false);

const nombresConResultado = computed(() => new Set(resultados.value.map((r) => r.parametro_nombre)));
const parametrosFaltantes = computed(() => {
  const vistos = new Set<string>();
  return parametros.value.filter((p) => {
    if (nombresConResultado.value.has(p.nombre_parametro) || vistos.has(p.nombre_parametro)) return false;
    vistos.add(p.nombre_parametro);
    return true;
  });
});
const esFinal = computed(() => !!examen.value?.es_final);
const puedeValidar = computed(() => examen.value && ['En Análisis', 'En Espera'].includes(examen.value.estado_examen ?? ''));
const criticosSinAcuse = computed(() => resultados.value.filter((r) => r.es_critico && !r.tiene_acuse));

async function cargar() {
  cargando.value = true; error_.value = null;
  try {
    examen.value = await obtenerExamen(id);
    const [res, params] = await Promise.all([listarResultados({ examen_solicitado: id }), listarParametros(examen.value.cups)]);
    resultados.value = res.results;
    parametros.value = params.filter((p) => p.activo !== false && !p.vigente_hasta);
    if (puede('examenes.aprobar')) {
      try { equipos.value = await listarEquipos(); } catch { /* sin permiso de equipos */ }
      await cargarCCI();
    }
  } catch (e) { error_.value = e; } finally { cargando.value = false; }
}

/** Estado del CCI por (equipo, analito) de cada resultado, para que el bacteriólogo lo vea antes de validar. */
async function cargarCCI() {
  const pares = new Map<string, { equipo: number; nombre: string }>();
  for (const r of resultados.value) if (r.equipo) pares.set(`${r.equipo}|${r.parametro_nombre}`, { equipo: r.equipo, nombre: r.parametro_nombre ?? '' });
  const entradas = await Promise.all([...pares.entries()].map(async ([k, v]) => [k, await estadoCCI(v.equipo, v.nombre).catch(() => null)] as const));
  cci.value = Object.fromEntries(entradas.filter(([, v]) => v) as [string, EstadoCCI][]);
}

async function guardarResultado() {
  if (!paramSel.value || !valor.value.trim()) return error(new Error('Selecciona el parámetro e ingresa el valor.'));
  guardando.value = true;
  try {
    await registrarResultado({ examen_solicitado: id, parametro: paramSel.value, valor_resultado: valor.value.trim(),
                               comentario_bacteriologo: comentario.value || null, equipo: equipoSel.value });
    valor.value = ''; comentario.value = ''; paramSel.value = null;
    await exito('Resultado guardado.');
    await cargar();
  } catch (e) { await error(e); } finally { guardando.value = false; }
}

async function aprobar(justificacion?: string) {
  if (!justificacion && !(await confirmar('Validar examen', 'Al validar firmas electrónicamente el resultado; no podrá modificarse.', 'Validar'))) return;
  try {
    const r = await aprobarExamen(id, justificacion);
    await exito(r.orden_finalizada ? 'Examen validado. La orden quedó finalizada.' : 'Examen validado.');
    await cargar();
  } catch (e) {
    if (esApiError(e) && e.estado === 'cci_requiere_justificacion') {
      const j = await pedirTexto('Control de calidad del día: ' + (e.extra?.estado_cci ?? ''), 'Justificación para validar sin CCI aceptado (quedará en el historial)');
      if (j) await aprobar(j);
      return;
    }
    await error(e);
  }
}

async function rechazar() {
  const motivo = await pedirTexto('Rechazar examen', 'Motivo (se notifica al flebotomista y al médico; se requiere nueva toma)');
  if (!motivo) return;
  try { await rechazarExamen(id, motivo); await exito('Examen rechazado.'); await cargar(); } catch (e) { await error(e); }
}

async function anular() {
  const motivo = await pedirTexto('Anular examen', 'Motivo de la anulación');
  if (!motivo) return;
  try { await anularExamen(id, motivo); await exito('Examen anulado.'); await cargar(); } catch (e) { await error(e); }
}

function colorCCI(e?: EstadoCCI) {
  return !e ? 'medium' : e.estado === 'aceptado' ? 'success' : e.estado === 'no_aplica' ? 'medium' : e.modo === 'bloqueante' ? 'danger' : 'warning';
}
onMounted(cargar);
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/resultados" text="" /></ion-buttons>
        <ion-title>{{ examen?.cups_descripcion ?? 'Examen' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <EstadoLista :cargando="cargando" :error="error_" :vacio="!examen" @reintentar="cargar" />
      <template v-if="examen">
        <ion-list>
          <ion-item lines="none">
            <ion-label class="ion-text-wrap">
              <h2>{{ examen.cups_descripcion }} <EstadoBadge :estado="examen.estado_examen" /></h2>
              <p>CUPS {{ examen.cups_codigo }} · Orden <router-link :to="`/ordenes/${examen.orden}`">{{ examen.orden_numero }}</router-link></p>
              <p>{{ examen.paciente_nombre }} · Doc. {{ examen.paciente_documento }}<span v-if="examen.codigo_barras"> · Muestra {{ examen.codigo_barras }}</span></p>
              <p v-if="examen.validado_por_nombre"><ion-note color="success">Validado por {{ examen.validado_por_nombre }} (reg. {{ examen.validado_por_registro ?? 'N/A' }}) el {{ new Date(examen.fecha_validacion!).toLocaleString('es-CO') }}</ion-note></p>
              <p v-if="examen.estado_cci_validacion"><ion-note>CCI al validar: {{ examen.estado_cci_validacion }}<span v-if="examen.justificacion_cci"> — {{ examen.justificacion_cci }}</span></ion-note></p>
              <p v-if="examen.motivo_rechazo"><ion-note color="danger">Rechazo: {{ examen.motivo_rechazo }}</ion-note></p>
              <p v-if="examen.motivo_anulacion"><ion-note>Anulado: {{ examen.motivo_anulacion }}</ion-note></p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header><ion-label>Resultados ({{ resultados.length }}/{{ resultados.length + parametrosFaltantes.length }})</ion-label></ion-list-header>
          <template v-for="r in resultados" :key="r.id">
            <ValorResultado :resultado="r" />
            <ion-item v-if="r.es_critico && !r.tiene_acuse && puede('criticos.acusar')" lines="full">
              <ion-button slot="end" size="small" color="danger" @click="acuseDe = r">Registrar acuse</ion-button>
              <ion-label color="danger"><small>Comunicar al médico y registrar read-back (RF-54)</small></ion-label>
            </ion-item>
            <ion-item v-if="r.equipo && cci[`${r.equipo}|${r.parametro_nombre}`]" lines="full">
              <ion-label><small>CCI hoy ({{ r.parametro_nombre }}): </small></ion-label>
              <ion-note slot="end" :color="colorCCI(cci[`${r.equipo}|${r.parametro_nombre}`])">
                {{ cci[`${r.equipo}|${r.parametro_nombre}`].estado }} · política {{ cci[`${r.equipo}|${r.parametro_nombre}`].modo }}
              </ion-note>
            </ion-item>
          </template>
          <ion-item v-if="!resultados.length" lines="none"><ion-label color="medium">Sin resultados aún.</ion-label></ion-item>
        </ion-list>

        <Permitido accion="resultados.registrar">
          <ion-list v-if="!esFinal && parametrosFaltantes.length">
            <ion-list-header><ion-label>Ingreso manual (contingencia)</ion-label></ion-list-header>
            <ion-item>
              <ion-select v-model="paramSel" label="Parámetro" label-placement="stacked" interface="popover" placeholder="Seleccionar">
                <ion-select-option v-for="p in parametrosFaltantes" :key="p.id" :value="p.id">{{ p.nombre_parametro }} ({{ p.unidades_medida ?? 'sin unidad' }})</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item><ion-input v-model="valor" label="Valor" label-placement="stacked" inputmode="decimal" placeholder="12.5 o NEG" /></ion-item>
            <ion-item v-if="equipos.length">
              <ion-select v-model="equipoSel" label="Equipo (opcional)" label-placement="stacked" interface="popover" placeholder="Manual">
                <ion-select-option :value="null">Manual / sin equipo</ion-select-option>
                <ion-select-option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.nombre }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item><ion-textarea v-model="comentario" label="Comentario" label-placement="stacked" auto-grow /></ion-item>
            <ion-button expand="block" fill="outline" class="ion-margin" :disabled="guardando" @click="guardarResultado">Guardar resultado</ion-button>
          </ion-list>
        </Permitido>

        <Permitido accion="examenes.aprobar">
          <div v-if="!esFinal" class="acciones ion-padding">
            <ion-button :disabled="!puedeValidar || !resultados.length" @click="aprobar()">Validar (firmar)</ion-button>
            <ion-button color="danger" fill="outline" :disabled="!puedeValidar" @click="rechazar">Rechazar</ion-button>
            <ion-button color="medium" fill="clear" @click="anular">Anular</ion-button>
            <ion-note v-if="criticosSinAcuse.length" color="danger" class="ion-text-wrap">
              Hay {{ criticosSinAcuse.length }} valor(es) crítico(s) sin acuse: la orden no cerrará hasta registrarlo (RN-25).
            </ion-note>
          </div>
        </Permitido>
      </template>
      <FormularioAcuse :resultado="acuseDe" @cerrado="(ok) => { acuseDe = null; if (ok) cargar(); }" />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.acciones { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
</style>
