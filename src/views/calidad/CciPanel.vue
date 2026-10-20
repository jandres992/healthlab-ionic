<script setup lang="ts">
/** CCI por equipo y analito: estado del día, política, corridas, Levey-Jennings, acción correctiva (RF-50, RF-50.1). */
import {
  IonBadge, IonButton, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSelect, IonSelectOption,
} from '@ionic/vue';
import { computed, onMounted, ref, watch } from 'vue';
import {
  accionCorrectiva, crearLoteControl, definirPolitica, estadoCCI, listarCorridas, listarEquipos, listarLotesControl,
  registrarCorrida, type CorridaCCI, type Equipo, type EstadoCCI, type LoteControl,
} from '@/api/endpoints/calidad';
import GraficaLeveyJennings from '@/components/GraficaLeveyJennings.vue';
import Permitido from '@/components/Permitido.vue';
import { useMensajes } from '@/composables/useMensajes';

const { exito, error, pedirTexto, confirmar } = useMensajes();
const equipos = ref<Equipo[]>([]);
const lotes = ref<LoteControl[]>([]);
const equipoSel = ref<number | null>(null);
const analitoSel = ref('');
const estado = ref<EstadoCCI | null>(null);
const corridas = ref<CorridaCCI[]>([]);
const loteSel = ref<number | null>(null);
const valor = ref('');
const nuevoLote = ref({ nombre_parametro: '', nivel: 1, lote: '', fecha_vencimiento: '', media_objetivo: '', desviacion_objetivo: '', unidades: '' });
const mostrarNuevoLote = ref(false);

const analitos = computed(() => [...new Set(lotes.value.filter((l) => l.equipo === equipoSel.value).map((l) => l.nombre_parametro))]);
const lotesDelAnalito = computed(() => lotes.value.filter((l) => l.equipo === equipoSel.value && l.nombre_parametro === analitoSel.value && l.activo !== false));

async function cargarBase() {
  try {
    [equipos.value, lotes.value] = await Promise.all([listarEquipos(), listarLotesControl()]);
    if (!equipoSel.value && equipos.value.length) equipoSel.value = equipos.value[0].id;
  } catch (e) { await error(e); }
}
async function cargarAnalito() {
  if (!equipoSel.value || !analitoSel.value) { estado.value = null; corridas.value = []; return; }
  try {
    [estado.value, corridas.value] = await Promise.all([
      estadoCCI(equipoSel.value, analitoSel.value),
      listarCorridas({ lote_control__equipo: equipoSel.value, lote_control__nombre_parametro: analitoSel.value, limit: 60 }).then((p) => p.results),
    ]);
    if (!loteSel.value && lotesDelAnalito.value.length) loteSel.value = lotesDelAnalito.value[0].id;
  } catch (e) { await error(e); }
}
watch(equipoSel, () => { analitoSel.value = analitos.value[0] ?? ''; loteSel.value = null; });
watch(analitoSel, () => { loteSel.value = null; cargarAnalito(); });

async function correr() {
  if (!loteSel.value || !valor.value.trim()) return error(new Error('Selecciona el lote e ingresa el valor.'));
  try {
    const c = await registrarCorrida(loteSel.value, valor.value.trim());
    valor.value = '';
    const reglas = (c.reglas_violadas as string[] | undefined) ?? [];
    await exito(`Corrida ${c.resultado}${reglas.length ? ' (' + reglas.join(', ') + ')' : ''}.`);
    await cargarAnalito();
  } catch (e) { await error(e); }
}
async function corregir(c: CorridaCCI) {
  const texto = await pedirTexto('Acción correctiva', 'Qué se hizo para corregir el rechazo (libera el bloqueo)');
  if (!texto) return;
  try { await accionCorrectiva(c.id, texto); await exito('Acción correctiva registrada.'); await cargarAnalito(); } catch (e) { await error(e); }
}
async function cambiarModo(modo: string) {
  if (!equipoSel.value || !analitoSel.value || !estado.value || modo === estado.value.modo) return;
  if (!(await confirmar('Cambiar política de CCI', `Pasar "${analitoSel.value}" a modo ${modo}. ${modo === 'bloqueante' ? 'No se podrá validar sin CCI aceptado del día.' : modo === 'advertencia' ? 'Validar sin CCI exigirá justificación.' : 'El CCI solo se mostrará.'}`, 'Cambiar'))) return;
  try { await definirPolitica(equipoSel.value, analitoSel.value, modo); await exito('Política actualizada.'); await cargarAnalito(); } catch (e) { await error(e); }
}
async function guardarLote() {
  if (!equipoSel.value) return;
  try {
    await crearLoteControl({ ...nuevoLote.value, equipo: equipoSel.value, media_objetivo: nuevoLote.value.media_objetivo, desviacion_objetivo: nuevoLote.value.desviacion_objetivo } as never);
    mostrarNuevoLote.value = false;
    await exito('Lote de control creado.');
    await cargarBase();
    analitoSel.value = nuevoLote.value.nombre_parametro;
  } catch (e) { await error(e); }
}
function colorEstado(e: string) { return e === 'aceptado' ? 'success' : e === 'rechazado' ? 'danger' : e === 'no_corrido' ? 'warning' : 'medium'; }
onMounted(cargarBase);
</script>

<template>
  <ion-list>
    <ion-item>
      <ion-select v-model="equipoSel" label="Equipo" label-placement="stacked" interface="popover">
        <ion-select-option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.nombre }} ({{ e.estado }})</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-select v-model="analitoSel" label="Analito" label-placement="stacked" interface="popover" placeholder="Sin materiales de control">
        <ion-select-option v-for="a in analitos" :key="a" :value="a">{{ a }}</ion-select-option>
      </ion-select>
      <Permitido accion="calidad.gestionar"><ion-button slot="end" fill="clear" size="small" @click="mostrarNuevoLote = !mostrarNuevoLote">+ Lote de control</ion-button></Permitido>
    </ion-item>

    <template v-if="mostrarNuevoLote">
      <ion-list-header><ion-label>Nuevo lote de control</ion-label></ion-list-header>
      <ion-item><ion-input v-model="nuevoLote.nombre_parametro" label="Analito (igual al nombre del parámetro)" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.nivel" type="number" label="Nivel (1 normal, 2 patológico)" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.lote" label="Lote" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.fecha_vencimiento" type="date" label="Vence" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.media_objetivo" inputmode="decimal" label="Media objetivo" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.desviacion_objetivo" inputmode="decimal" label="Desviación estándar objetivo" label-placement="stacked" /></ion-item>
      <ion-item><ion-input v-model="nuevoLote.unidades" label="Unidades" label-placement="stacked" /></ion-item>
      <ion-button expand="block" fill="outline" class="ion-margin" @click="guardarLote">Guardar lote</ion-button>
    </template>

    <template v-if="estado">
      <ion-list-header><ion-label>Estado de hoy</ion-label></ion-list-header>
      <ion-item lines="none">
        <ion-label>
          <h2><ion-badge :color="colorEstado(estado.estado)">{{ estado.estado }}</ion-badge> · política <strong>{{ estado.modo }}</strong></h2>
          <p>{{ estado.propuesta.corridas_aceptadas }} corridas aceptadas · {{ estado.propuesta.dias_con_cci }} días con CCI
            <ion-note v-if="estado.propuesta.modo_sugerido !== estado.modo" color="primary"> · sugerido: {{ estado.propuesta.modo_sugerido }}</ion-note></p>
        </ion-label>
      </ion-item>
      <Permitido accion="calidad.gestionar">
        <ion-item>
          <ion-select :value="estado.modo" label="Modo de la política (RF-50.1)" label-placement="stacked" interface="popover" @ionChange="cambiarModo(String($event.detail.value))">
            <ion-select-option value="informativo">Informativo (solo muestra)</ion-select-option>
            <ion-select-option value="advertencia">Advertencia (exige justificación)</ion-select-option>
            <ion-select-option value="bloqueante">Bloqueante (impide validar)</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-list-header><ion-label>Registrar corrida</ion-label></ion-list-header>
        <ion-item>
          <ion-select v-model="loteSel" label="Lote / nivel" label-placement="stacked" interface="popover">
            <ion-select-option v-for="l in lotesDelAnalito" :key="l.id" :value="l.id">N{{ l.nivel }} lote {{ l.lote }} (media {{ l.media_objetivo }} ± {{ l.desviacion_objetivo }})</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input v-model="valor" inputmode="decimal" label="Valor medido" label-placement="stacked" @keyup.enter="correr" />
          <ion-button slot="end" @click="correr">Evaluar</ion-button>
        </ion-item>
      </Permitido>

      <GraficaLeveyJennings v-if="corridas.length" :corridas="corridas" :titulo="`Levey-Jennings · ${analitoSel}`" />

      <ion-list-header><ion-label>Corridas recientes</ion-label></ion-list-header>
      <ion-item v-for="c in corridas.slice(0, 20)" :key="c.id">
        <ion-label class="ion-text-wrap">
          <h3>N{{ c.nivel }} · {{ c.valor }} <ion-badge :color="c.resultado === 'aceptada' ? 'success' : c.resultado === 'advertencia' ? 'warning' : 'danger'">{{ c.resultado }}</ion-badge>
            <ion-note v-if="(c.reglas_violadas as string[])?.length"> {{ (c.reglas_violadas as string[]).join(', ') }}</ion-note></h3>
          <p>z = {{ c.z_score }} · {{ new Date(c.fecha).toLocaleString('es-CO') }} · {{ c.registrada_por_username }}</p>
          <p v-if="c.accion_correctiva"><ion-note color="success">Acción correctiva: {{ c.accion_correctiva }}</ion-note></p>
        </ion-label>
        <Permitido accion="calidad.gestionar">
          <ion-button v-if="c.resultado === 'rechazada' && !c.accion_correctiva" slot="end" size="small" fill="outline" @click="corregir(c)">Acción correctiva</ion-button>
        </Permitido>
      </ion-item>
      <ion-item v-if="!corridas.length" lines="none"><ion-label color="medium">Sin corridas para este analito.</ion-label></ion-item>
    </template>
  </ion-list>
</template>
