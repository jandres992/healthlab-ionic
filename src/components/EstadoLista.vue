<script setup lang="ts">
/** Estados de carga, error y vacío de un listado (RNF-13, RNF-15). */
import { IonButton, IonSkeletonText, IonText } from '@ionic/vue';
import { esApiError } from '@/api/http';

defineProps<{ cargando: boolean; error: unknown; vacio: boolean; textoVacio?: string }>();
const emit = defineEmits<{ reintentar: [] }>();
function mensaje(e: unknown) { return esApiError(e) ? e.mensaje : 'No se pudo cargar la información.'; }
</script>

<template>
  <div v-if="cargando && vacio" class="ion-padding">
    <ion-skeleton-text v-for="i in 5" :key="i" animated style="height: 44px; margin-bottom: 8px" />
  </div>
  <div v-else-if="error" class="ion-padding ion-text-center">
    <ion-text color="danger"><p>{{ mensaje(error) }}</p></ion-text>
    <ion-button fill="outline" size="small" @click="emit('reintentar')">Reintentar</ion-button>
  </div>
  <p v-else-if="vacio" class="ion-padding ion-text-center" style="color: var(--ion-color-medium)">
    {{ textoVacio ?? 'No hay registros.' }}
  </p>
</template>
