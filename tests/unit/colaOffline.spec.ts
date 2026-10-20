import { beforeEach, describe, expect, it, vi } from 'vitest';

const almacen = new Map<string, string>();
vi.mock('@/services/almacenamientoSeguro', () => ({
  leerSecreto: async (k: string) => almacen.get(k) ?? null,
  guardarSecreto: async (k: string, v: string) => { almacen.set(k, v); },
  borrarSecreto: async (k: string) => { almacen.delete(k); },
}));
vi.mock('@capacitor/network', () => ({ Network: { getStatus: async () => ({ connected: true }), addListener: async () => undefined } }));

const peticiones: Array<{ url: string; headers: Record<string, string> }> = [];
let respuesta: () => Promise<unknown> = async () => ({});
vi.mock('@/api/http', async () => {
  const real = await vi.importActual<typeof import('@/api/http')>('@/api/http');
  return {
    ...real,
    http: { request: async (cfg: { url: string; headers: Record<string, string> }) => { peticiones.push(cfg); return respuesta(); } },
  };
});

import { encolar, leerCola, sincronizar } from '@/services/colaOffline';

describe('cola offline (RN-26, RNF-33)', () => {
  beforeEach(() => { almacen.clear(); peticiones.length = 0; respuesta = async () => ({}); });

  it('encola con Idempotency-Key propia y hora declarada', async () => {
    const op = await encolar('muestra.registrar', { orden: 'o1', tipo_muestra: 'Orina' }, 'Toma');
    expect(op.ruta).toBe('/api/v1/muestras/');
    expect(op.cuerpo.fecha_declarada_dispositivo).toBeTruthy();
    expect((await leerCola()).pendientes).toHaveLength(1);
  });

  it('sincroniza en orden y reenvía con la misma clave', async () => {
    const a = await encolar('muestra.registrar', { orden: 'o1', tipo_muestra: 'Orina' }, 'Toma 1');
    const b = await encolar('orden.admitir', { orden: 'o1' }, 'Admitir');
    const r = await sincronizar();
    expect(r.enviadas).toBe(2);
    expect(peticiones.map((p) => p.url)).toEqual(['/api/v1/muestras/', '/api/v1/ordenes/o1/admitir/']);
    expect(peticiones[0].headers['Idempotency-Key']).toBe(a.id);
    expect(peticiones[1].headers['Idempotency-Key']).toBe(b.id);
    expect((await leerCola()).pendientes).toHaveLength(0);
  });

  it('un 409 del servidor pasa a conflictos; sin red se detiene y conserva el resto', async () => {
    await encolar('muestra.registrar', { orden: 'cerrada', tipo_muestra: 'Orina' }, 'Toma A');
    await encolar('muestra.registrar', { orden: 'o2', tipo_muestra: 'Orina' }, 'Toma B');
    let n = 0;
    respuesta = async () => {
      n++;
      if (n === 1) throw { status: 409, estado: 'conflicto', mensaje: 'La orden está cerrada' };
      throw { status: 0, estado: 'sin_conexion', mensaje: 'x', sinConexion: true };
    };
    const r = await sincronizar();
    expect(r.conflictos).toBe(1);
    expect(r.pendientes).toBe(1);
    expect(r.detenidaPorRed).toBe(true);
    const cola = await leerCola();
    expect(cola.conflictos[0].mensaje).toBe('La orden está cerrada');
    expect(cola.pendientes[0].descripcion).toBe('Toma B');
  });
});
