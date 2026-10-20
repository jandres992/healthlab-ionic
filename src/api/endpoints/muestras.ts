import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { EventoMuestra, Muestra, MuestraCrear } from '../tipos';

export interface FiltroMuestras { search?: string; limit?: number; offset?: number; orden?: string; estado_muestra__nombre?: string }

export async function listarMuestras(f: FiltroMuestras = {}): Promise<Paginado<Muestra>> {
  const { data } = await http.get('/api/v1/muestras/', { params: { limit: 20, ...f } });
  return lista<Muestra>(data);
}

export async function obtenerMuestra(id: string): Promise<Muestra> {
  const { data } = await http.get(`/api/v1/muestras/${id}/`);
  return datos<Muestra>(data);
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

// ── Cadena de custodia (RF-57) ────────────────────────────────────────────────

export async function custodia(id: string): Promise<EventoMuestra[]> {
  const { data } = await http.get(`/api/v1/muestras/${id}/custodia/`);
  return data as EventoMuestra[];
}

export async function anotarEvento(id: string, cuerpo: { tipo: string; ubicacion?: string; observacion?: string; temperatura?: string | null }): Promise<EventoMuestra> {
  const { data } = await http.post(`/api/v1/muestras/${id}/evento/`, cuerpo);
  return datos<EventoMuestra>(data);
}

export async function crearAlicuota(id: string, cuerpo: { tipo_muestra?: string; codigo_barras?: string; ubicacion?: string }): Promise<Muestra> {
  const { data } = await http.post(`/api/v1/muestras/${id}/alicuota/`, cuerpo);
  return datos<Muestra>(data);
}

export async function descartarMuestra(id: string, motivo: string): Promise<void> {
  await http.post(`/api/v1/muestras/${id}/descartar/`, { motivo });
}
