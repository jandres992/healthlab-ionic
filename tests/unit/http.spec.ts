import { describe, expect, it } from 'vitest';
import { conIdempotencia, datos, esApiError, lista } from '@/api/http';

describe('cliente http', () => {
  it('desenvuelve {estado, datos} y deja pasar cuerpos planos', () => {
    expect(datos({ estado: 'exito', datos: { id: 1 } })).toEqual({ id: 1 });
    expect(datos({ id: 2 })).toEqual({ id: 2 });
  });

  it('normaliza listados paginados y arreglos (transición app Expo)', () => {
    expect(lista([1, 2, 3])).toEqual({ count: 3, next: null, previous: null, results: [1, 2, 3] });
    const paginado = { count: 40, next: 'x', previous: null, results: [1] };
    expect(lista(paginado)).toBe(paginado);
  });

  it('genera una Idempotency-Key distinta por llamada y respeta la provista', () => {
    const a = conIdempotencia().headers['Idempotency-Key'];
    const b = conIdempotencia().headers['Idempotency-Key'];
    expect(a).not.toEqual(b);
    expect(conIdempotencia('fija').headers['Idempotency-Key']).toBe('fija');
  });

  it('reconoce errores de la API', () => {
    expect(esApiError({ status: 409, estado: 'conflicto', mensaje: 'x' })).toBe(true);
    expect(esApiError(new Error('x'))).toBe(false);
  });
});
