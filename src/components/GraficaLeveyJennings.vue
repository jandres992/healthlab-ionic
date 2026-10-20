<script setup lang="ts">
/** Levey-Jennings (RF-50): z-scores de las corridas con bandas ±1, ±2 y ±3 DE. */
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import type { CorridaCCI } from '@/api/endpoints/calidad';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{ corridas: CorridaCCI[]; titulo?: string }>();

const ordenadas = computed(() => [...props.corridas].sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-30));
const etiquetas = computed(() => ordenadas.value.map((c) => new Date(c.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })));
const banda = (v: number) => ({ data: ordenadas.value.map(() => v), borderColor: Math.abs(v) === 3 ? '#b3261e' : Math.abs(v) === 2 ? '#c77700' : '#9aa0a6', borderDash: [6, 4], pointRadius: 0, borderWidth: 1, label: `${v > 0 ? '+' : ''}${v} DE` });

const datos = computed(() => ({
  labels: etiquetas.value,
  datasets: [
    {
      label: 'z-score', data: ordenadas.value.map((c) => Number(c.z_score)), borderColor: '#135ae0', backgroundColor: '#135ae0', tension: 0.1,
      pointRadius: 5,
      pointBackgroundColor: ordenadas.value.map((c) => (c.resultado === 'rechazada' ? '#b3261e' : c.resultado === 'advertencia' ? '#c77700' : '#1b7f3b')),
    },
    banda(3), banda(2), banda(1), banda(-1), banda(-2), banda(-3),
  ],
}));

const opciones = {
  responsive: true, maintainAspectRatio: false,
  scales: { y: { min: -4, max: 4, title: { display: true, text: 'Desviaciones estándar' } } },
  plugins: { legend: { display: false }, title: { display: !!props.titulo, text: props.titulo ?? '' } },
};
</script>

<template>
  <div class="grafica"><Line :data="datos" :options="opciones" /></div>
</template>

<style scoped>
.grafica { height: 260px; padding: 8px; }
</style>
