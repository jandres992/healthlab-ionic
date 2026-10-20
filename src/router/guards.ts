/**
 * Guards de navegación (RF-44, RF-44.1).
 * `meta.publica`: sin sesión. `meta.accion`: acción requerida (una o varias, basta una).
 * Si falta la acción, se redirige a /no-autorizado; nunca se muestra una pantalla
 * cuyo backend respondería 403.
 */
import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export const guardSesion: NavigationGuardWithThis<undefined> = async (to) => {
  const auth = useAuthStore();
  if (auth.restaurando) await auth.restaurar();
  await auth.verificarInactividad();
  auth.registrarActividad();

  if (to.meta.publica) {
    return auth.autenticado && to.name === 'login' ? { name: 'inicio' } : true;
  }
  if (!auth.autenticado) {
    return { name: 'login', query: { volver: to.fullPath } };
  }
  const requerida = to.meta.accion as string | string[] | undefined;
  if (requerida) {
    const lista = Array.isArray(requerida) ? requerida : [requerida];
    if (!lista.some((a) => auth.puede(a))) return { name: 'no-autorizado', query: { accion: lista[0] } };
  }
  return true;
};
