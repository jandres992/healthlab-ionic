import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { Esquemas, Resultado, ResultadoRegistrar } from '../tipos';

export type Lectura = Esquemas['LecturaEquipoSerial'];

export async function listarResultados(f: { examen_solicitado?: string; examen_solicitado__orden?: string; es_critico?: boolean; limit?: number; offset?: number } = {}): Promise<Paginado<Resultado>> {
  const { data } = await http.get('/api/v1/resultados/', { params: { limit: 50, ...f } });
  return lista<Resultado>(data);
}

/** Ingreso manual por el bacteriólogo (RF-32). `equipo` opcional para trazabilidad de CCI y lotes. */
export async function registrarResultado(cuerpo: ResultadoRegistrar & { equipo?: number | null }): Promise<Resultado> {
  const { data } = await http.post('/api/v1/resultados/', cuerpo, conIdempotencia());
  return datos<Resultado>(data);
}

export async function listarLecturas(f: { procesado?: boolean; equipo_origen?: string; limit?: number; offset?: number } = {}): Promise<Paginado<Lectura>> {
  const { data } = await http.get('/api/v1/lecturas-serial/', { params: { limit: 20, ...f } });
  return lista<Lectura>(data);
}

export interface ResumenProcesamiento { resultados_creados: number; resultados_actualizados: number; resultados_omitidos: number; alertas_criticas: number }

export async function procesarLectura(id: string): Promise<ResumenProcesamiento> {
  const { data } = await http.post(`/api/v1/lecturas-serial/${id}/procesar/`);
  return data;
}

// ── Críticos (RF-54) ─────────────────────────────────────────────────────────

export type Acuse = Esquemas['AcuseValorCritico'];

export async function listarCriticos(pendientes = true, orden?: string): Promise<Resultado[]> {
  const { data } = await http.get('/api/v1/criticos/', { params: { pendientes, examen_solicitado__orden: orden } });
  return lista<Resultado>(data).results;
}

export async function registrarAcuse(resultadoId: string, cuerpo: Esquemas['AcuseRegistrarRequest']): Promise<Acuse> {
  const { data } = await http.post(`/api/v1/criticos/${resultadoId}/acusar/`, cuerpo);
  return datos<Acuse>(data);
}

export async function obtenerAcuse(resultadoId: string): Promise<Acuse> {
  const { data } = await http.get(`/api/v1/criticos/${resultadoId}/acuse/`);
  return data as Acuse;
}
