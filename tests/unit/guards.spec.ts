import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';
import { guardSesion } from '@/router/guards';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/services/almacenamientoSeguro', () => ({
  leerSecreto: async () => null,
  guardarSecreto: async () => undefined,
  borrarSecreto: async () => undefined,
}));

function ruta(extra: Partial<RouteLocationNormalized>): RouteLocationNormalized {
  return { name: 'x', fullPath: '/x', meta: {}, ...extra } as RouteLocationNormalized;
}

describe('guard de sesión y acciones (RF-44.1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sin sesión redirige a login conservando la ruta', async () => {
    const auth = useAuthStore();
    auth.restaurando = false;
    const r = await guardSesion(ruta({ fullPath: '/tabs/ordenes', meta: { accion: 'ordenes.ver' } }), ruta({}), () => undefined);
    expect(r).toEqual({ name: 'login', query: { volver: '/tabs/ordenes' } });
  });

  it('con sesión pero sin la acción redirige a no-autorizado', async () => {
    const auth = useAuthStore();
    auth.restaurando = false;
    auth.access = 't';
    auth.perfil = { username: 'tec', acciones: ['muestras.registrar'] } as never;
    auth.acciones = ['muestras.registrar'];
    const r = await guardSesion(ruta({ meta: { accion: 'ordenes.finalizar' } }), ruta({}), () => undefined);
    expect(r).toEqual({ name: 'no-autorizado', query: { accion: 'ordenes.finalizar' } });
  });

  it('basta con una de varias acciones', async () => {
    const auth = useAuthStore();
    auth.restaurando = false;
    auth.access = 't';
    auth.perfil = { username: 'med' } as never;
    auth.acciones = ['examenes.ver'];
    const r = await guardSesion(ruta({ meta: { accion: ['resultados.ver', 'examenes.ver'] } }), ruta({}), () => undefined);
    expect(r).toBe(true);
  });
});
