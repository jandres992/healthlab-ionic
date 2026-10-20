import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

/** `puede('ordenes.finalizar')` — única forma de decidir qué muestra la interfaz (RF-44.1). */
export function usePermisos() {
  const auth = useAuthStore();
  return {
    puede: (accion: string) => auth.puede(accion),
    acciones: computed(() => auth.acciones),
    roles: computed(() => auth.roles),
  };
}
