<script setup lang="ts">
/** Renderiza el contenido solo si el backend concede la acción. <Permitido accion="examenes.aprobar"> */
import { computed } from 'vue';
import { usePermisos } from '@/composables/usePermisos';

const props = defineProps<{ accion: string | string[] }>();
const { puede } = usePermisos();
const ok = computed(() => (Array.isArray(props.accion) ? props.accion.some(puede) : puede(props.accion)));
</script>

<template>
  <slot v-if="ok" />
  <slot v-else name="negado" />
</template>
