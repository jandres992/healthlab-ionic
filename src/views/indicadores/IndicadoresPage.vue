<script setup lang="ts">
/**
 * Dashboard de análisis exploratorio de la operación del laboratorio (RF-74).
 * Solo datos agregados, sin pacientes; lo ven el Auditor y el Administrador.
 * En pantallas pequeñas se muestra un resumen y se puede abrir el detalle completo.
 */
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonMenuButton, IonPage,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/vue';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement,
  Tooltip,
} from 'chart.js';
import { refreshOutline } from 'ionicons/icons';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import { obtenerIndicadores } from '@/api/endpoints/indicadores';
import type { Indicadores } from '@/api/tipos';
import EstadoLista from '@/components/EstadoLista.vue';
import {
  colorEstado, etiquetaDia, formatoHoras, formatoPorcentaje, rangoUltimosDias,
} from '@/utils/indicadores';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const datos = ref<Indicadores | null>(null);
const cargando = ref(true);
const error = ref<unknown>(null);

const periodo = ref<'7' | '30' | '90' | 'otro'>('30');
const fechaInicio = ref(rangoUltimosDias(30).fecha_inicio);
const fechaFin = ref(rangoUltimosDias(30).fecha_fin);

// Modo resumido en teléfonos (RF-74): menos gráficas, con opción de ver todo.
const ancho = ref(window.innerWidth);
const verTodo = ref(false);
const resumido = computed(() => ancho.value < 768 && !verTodo.value);
function alCambiarTamano() { ancho.value = window.innerWidth; }

async function cargar() {
  cargando.value = true; error.value = null;
  try {
    datos.value = await obtenerIndicadores({ fecha_inicio: fechaInicio.value, fecha_fin: fechaFin.value });
  } catch (e) { error.value = e; } finally { cargando.value = false; }
}

function elegirPeriodo(valor: string) {
  periodo.value = valor as typeof periodo.value;
  if (valor === 'otro') return;
  const r = rangoUltimosDias(Number(valor));
  fechaInicio.value = r.fecha_inicio; fechaFin.value = r.fecha_fin;
  void cargar();
}

const sinDatos = computed(() => !!datos.value && datos.value.totales.ordenes === 0 && datos.value.totales.muestras === 0
  && datos.value.totales.resultados === 0);

const tarjetas = computed(() => {
  const d = datos.value;
  if (!d) return [];
  return [
    { titulo: 'Órdenes', valor: String(d.totales.ordenes), detalle: `${d.totales.examenes} exámenes` },
    { titulo: 'Muestras rechazadas', valor: formatoPorcentaje(d.muestras.porcentaje_rechazo), detalle: `${d.muestras.rechazadas} de ${d.muestras.total} muestras` },
    { titulo: 'Resultados anormales', valor: formatoPorcentaje(d.resultados.porcentaje_anormales), detalle: `${d.resultados.anormales} de ${d.resultados.total} resultados` },
    { titulo: 'Resultados críticos', valor: formatoPorcentaje(d.resultados.porcentaje_criticos), detalle: `${d.resultados.criticos} críticos` },
    { titulo: 'Orden → validación', valor: formatoHoras(d.tiempo_orden_validacion.mediana_horas), detalle: `mediana · P90 ${formatoHoras(d.tiempo_orden_validacion.p90_horas)}` },
  ];
});

const graficaDias = computed(() => ({
  labels: (datos.value?.ordenes_por_dia ?? []).map((f) => etiquetaDia(f.fecha)),
  datasets: [{
    label: 'Órdenes', data: (datos.value?.ordenes_por_dia ?? []).map((f) => f.total),
    borderColor: '#005fb8', backgroundColor: 'rgba(0, 95, 184, 0.15)', fill: true, tension: 0.25, pointRadius: 2,
  }],
}));
const opcionesDias = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { maxTicksLimit: 10 } } },
};

const graficaEstados = computed(() => {
  const filas = datos.value?.ordenes_por_estado ?? [];
  return {
    labels: filas.map((f) => f.estado),
    datasets: [{ data: filas.map((f) => f.total), backgroundColor: filas.map((f, i) => colorEstado(f.estado, i)) }],
  };
});
const opcionesEstados = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } };

const graficaCups = computed(() => {
  const filas = datos.value?.cups_mas_solicitados ?? [];
  return {
    labels: filas.map((f) => (f.descripcion.length > 28 ? `${f.descripcion.slice(0, 27)}…` : f.descripcion)),
    datasets: [{ label: 'Exámenes', data: filas.map((f) => f.total), backgroundColor: '#00b4e1' }],
  };
});
const opcionesCups = {
  indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
};

const graficaMotivos = computed(() => {
  const filas = datos.value?.muestras.motivos ?? [];
  return {
    labels: filas.map((f) => f.motivo),
    datasets: [{ label: 'Muestras', data: filas.map((f) => f.total), backgroundColor: '#c77700' }],
  };
});
const opcionesMotivos = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};

onMounted(() => { window.addEventListener('resize', alCambiarTamano); void cargar(); });
onBeforeUnmount(() => window.removeEventListener('resize', alCambiarTamano));
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Indicadores</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Actualizar" :disabled="cargando" @click="cargar"><ion-icon slot="icon-only" :icon="refreshOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment :value="periodo" @ionChange="elegirPeriodo(String($event.detail.value))">
          <ion-segment-button value="7">7 días</ion-segment-button>
          <ion-segment-button value="30">30 días</ion-segment-button>
          <ion-segment-button value="90">90 días</ion-segment-button>
          <ion-segment-button value="otro">Otro</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar v-if="periodo === 'otro'">
        <div class="rango">
          <ion-item lines="none"><ion-input v-model="fechaInicio" type="date" label="Desde" label-placement="stacked" /></ion-item>
          <ion-item lines="none"><ion-input v-model="fechaFin" type="date" label="Hasta" label-placement="stacked" /></ion-item>
          <ion-button size="small" @click="cargar">Aplicar</ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <EstadoLista :cargando="cargando && !datos" :error="error" :vacio="false" @reintentar="cargar" />
      <template v-if="datos">
        <p class="periodo">
          Del {{ datos.periodo.fecha_inicio }} al {{ datos.periodo.fecha_fin }} ({{ datos.periodo.dias }} días).
          Datos agregados, sin información de pacientes.
        </p>

        <p v-if="sinDatos" class="vacio">No hay órdenes, muestras ni resultados en este periodo.</p>

        <section class="kpis">
          <div v-for="t in tarjetas" :key="t.titulo" class="kpi">
            <span class="kpi-titulo">{{ t.titulo }}</span>
            <strong class="kpi-valor">{{ t.valor }}</strong>
            <span class="kpi-detalle">{{ t.detalle }}</span>
          </div>
        </section>

        <section class="graficas">
          <article class="panel ancho">
            <h2>Órdenes por día</h2>
            <div class="lienzo"><Line :data="graficaDias" :options="opcionesDias" /></div>
          </article>
          <article class="panel">
            <h2>Órdenes por estado</h2>
            <div class="lienzo"><Doughnut v-if="datos.ordenes_por_estado.length" :data="graficaEstados" :options="opcionesEstados" /><p v-else class="vacio">Sin órdenes.</p></div>
          </article>

          <template v-if="!resumido">
            <article class="panel">
              <h2>Exámenes más solicitados (CUPS)</h2>
              <div class="lienzo"><Bar v-if="datos.cups_mas_solicitados.length" :data="graficaCups" :options="opcionesCups" /><p v-else class="vacio">Sin exámenes.</p></div>
            </article>
            <article class="panel">
              <h2>Motivos de rechazo de muestras</h2>
              <div class="lienzo"><Bar v-if="datos.muestras.motivos.length" :data="graficaMotivos" :options="opcionesMotivos" /><p v-else class="vacio">No hubo muestras rechazadas.</p></div>
            </article>
            <article class="panel ancho">
              <h2>Tiempo desde la orden hasta la validación, por examen</h2>
              <table v-if="datos.tiempo_orden_validacion.por_examen.length" class="tabla">
                <thead><tr><th>CUPS</th><th>Examen</th><th>Validados</th><th>Mediana</th><th>P90</th></tr></thead>
                <tbody>
                  <tr v-for="f in datos.tiempo_orden_validacion.por_examen" :key="f.codigo">
                    <td>{{ f.codigo }}</td><td>{{ f.descripcion }}</td><td>{{ f.total }}</td>
                    <td>{{ formatoHoras(f.mediana_horas) }}</td><td>{{ formatoHoras(f.p90_horas) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="vacio">No hay exámenes validados en este periodo.</p>
            </article>
          </template>
        </section>

        <ion-button v-if="ancho < 768" expand="block" fill="outline" @click="verTodo = !verTodo">
          {{ verTodo ? 'Ver resumen' : 'Ver todas las gráficas' }}
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.rango { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; padding: 0 8px 8px; }
.rango ion-item { flex: 1; min-width: 150px; --background: transparent; }
.periodo { margin: 0 0 12px; color: var(--hl-on-surface-variant, #607793); font-size: 0.9rem; }
.vacio { color: var(--hl-on-surface-variant, #607793); text-align: center; margin: 12px 0; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi {
  display: flex; flex-direction: column; gap: 2px; padding: 14px 16px;
  background: var(--hl-surface-lowest, #fff); border-radius: var(--hl-radius-md, 16px); box-shadow: var(--hl-sombra, 0 2px 8px rgba(0,0,0,.08));
}
.kpi-titulo { font-size: 0.8rem; color: var(--hl-on-surface-variant, #607793); }
.kpi-valor { font-size: 1.6rem; color: var(--hl-primary, #00488d); }
.kpi-detalle { font-size: 0.75rem; color: var(--hl-on-surface-variant, #607793); }
.graficas { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-bottom: 12px; }
.panel {
  padding: 12px 14px; background: var(--hl-surface-lowest, #fff); border-radius: var(--hl-radius-md, 16px);
  box-shadow: var(--hl-sombra, 0 2px 8px rgba(0,0,0,.08)); min-width: 0;
}
.panel.ancho { grid-column: 1 / -1; }
.panel h2 { font-size: 0.95rem; margin: 0 0 8px; color: var(--hl-on-surface, #002d58); }
.lienzo { position: relative; height: 240px; }
.tabla { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.tabla th, .tabla td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--hl-surface-container, #e4ebf6); }
.tabla th { color: var(--hl-on-surface-variant, #607793); font-weight: 600; }
</style>
