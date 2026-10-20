import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { Muestra, MuestraCrear } from '../tipos';

export interface FiltroMuestras { search?: string; limit?: number; offset?: number; orden?: string; estado_muestra__nombre?: string }

export async function listarMuestras(f: FiltroMuestras = {}): Promise<Paginado<Muestra>> {
  const { data } = await http.get('/api/v1/muestras/', { params: { limit: 20, ...f } });
  return lista<Muestra>(data);
}

export async function buscarPorCodigo(codigo_barras: string): Promise<Muestra> {
  const { data } = await http.get('/api/v1/muestras/buscar/', { params: { codigo_barras } });
  return datos<Muestra>(data);
}

/** Toma de muestra: idempotente para poder reintentarse sin duplicar (RN-26). */
export async function registrarMuestra(cuerpo: MuestraCrear, claveIdempotencia?: string): Promise<Muestra> {
  const { data } = await http.post('/api/v1/muestras/', cuerpo, conIdempotencia(claveIdempotencia));
  return datos<Muestra>(data);
}

export async function recibirMuestra(id: string): Promise<{ examenes_actualizados: number }> {
  const { data } = await http.post(`/api/v1/muestras/${id}/recibir-laboratorio/`);
  return data;
}

export async function rechazarMuestra(id: string, motivo_rechazo: string, condicion_muestra?: string): Promise<void> {
  await http.post(`/api/v1/muestras/${id}/rechazar/`, { motivo_rechazo, condicion_muestra });
}
