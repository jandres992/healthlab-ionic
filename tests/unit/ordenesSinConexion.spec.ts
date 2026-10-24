import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const almacen = new Map<string, string>();
vi.mock('@/services/almacenamientoSeguro', () => ({
  leerSecreto: async (k: string) => almacen.get(k) ?? null,
  guardarSecreto: async (k: string, v: string) => { almacen.set(k, v); },
  borrarSecreto: async (k: string) => { almacen.delete(k); },
}));

import type { Orden } from '@/api/tipos';
import {
  filtrarOrdenes, guardarOrdenesDelDia, leerOrdenesDelDia, olvidarOrdenesDelDia,
} from '@/services/ordenesSinConexion';

const orden = (numero: string, paciente: string, estado: string) => ({
  id: numero, numero_orden: numero, paciente_nombre: paciente, paciente_documento: `9${numero.slice(-3)}`, estado_general: estado,
}) as unknown as Orden;

describe('órdenes del día sin conexión (RN-26, D-02)', () => {
  beforeEach(() => { almacen.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 24, 9, 0)); });
  afterEach(() => { vi.useRealTimers(); });

  it('guarda solo las órdenes que admiten muestras y las devuelve el mismo día', async () => {
    await guardarOrdenesDelDia([orden('LAB-1', 'Ana Pérez', 'Registrada'), orden('LAB-2', 'Luis Díaz', 'Finalizada'),
      orden('LAB-3', 'Eva Ruiz', 'Anulada'), orden('LAB-4', 'Iván Mora', 'Resultados Parciales')]);
    expect((await leerOrdenesDelDia()).map((o) => o.numero_orden)).toEqual(['LAB-1', 'LAB-4']);
  });

  it('descarta las órdenes guardadas otro día', async () => {
    await guardarOrdenesDelDia([orden('LAB-1', 'Ana Pérez', 'Registrada')]);
    vi.setSystemTime(new Date(2026, 9, 25, 7, 0));
    expect(await leerOrdenesDelDia()).toEqual([]);
    expect(almacen.size).toBe(0);
  });

  it('busca por número, paciente o documento y se borra al cerrar sesión', async () => {
    const lista = [orden('LAB-101', 'Ana Pérez', 'Registrada'), orden('LAB-202', 'Luis Díaz', 'Admitida')];
    expect(filtrarOrdenes(lista, 'díaz').map((o) => o.id)).toEqual(['LAB-202']);
    expect(filtrarOrdenes(lista, '9101').map((o) => o.id)).toEqual(['LAB-101']);
    expect(filtrarOrdenes(lista, '  ')).toHaveLength(2);
    await guardarOrdenesDelDia(lista);
    await olvidarOrdenesDelDia();
    expect(await leerOrdenesDelDia()).toEqual([]);
  });
});
