import { http } from '../http';
import type { Indicadores } from '../tipos';

export interface FiltroIndicadores { fecha_inicio?: string; fecha_fin?: string }

/** Indicadores agregados de operación del laboratorio (RF-74.1). Solo Auditor y Administrador. */
export async function obtenerIndicadores(f: FiltroIndicadores = {}): Promise<Indicadores> {
  const { data } = await http.get('/api/v1/indicadores/', { params: f });
  return data as Indicadores;
}
