<script setup lang="ts">
import { IonBadge } from '@ionic/vue';
import { computed } from 'vue';

const props = defineProps<{ estado?: string | null }>();

const COLORES: Record<string, string> = {
  Registrada: 'medium', 'En Proceso': 'primary', 'Resultados Parciales': 'warning', Finalizada: 'success', Anulada: 'dark',
  Pendiente: 'medium', 'Muestra Recolectada': 'tertiary', 'En Análisis': 'primary', 'En Espera': 'warning',
  Repetir: 'danger', Validado: 'success', Anulado: 'dark',
  Recolectada: 'tertiary', 'Recibida en Laboratorio': 'primary', Rechazada: 'danger',
};
const color = computed(() => COLORES[props.estado ?? ''] ?? 'medium');
</script>

<template>
  <ion-badge :color="color">{{ estado ?? '—' }}</ion-badge>
</template>
