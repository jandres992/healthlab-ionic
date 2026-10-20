import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { Examen, Orden, OrdenCrear } from '../tipos';

export interface FiltroOrdenes { search?: string; limit?: number; offset?: number; estado_general__nombre?: string; paciente?: string }

export async function listarOrdenes(f: FiltroOrdenes = {}): Promise<Paginado<Orden>> {
  const { data } = await http.get('/api/v1/ordenes/', { params: { limit: 20, ...f } });
  return lista<Orden>(data);
}

export async function obtenerOrden(id: string): Promise<Orden> {
  const { data } = await http.get(`/api/v1/ordenes/${id}/`);
  return datos<Orden>(data);
}

/** Crea la orden con todos sus exámenes en una sola petición (RNF-29.1). */
export async function crearOrden(cuerpo: OrdenCrear): Promise<Orden> {
  const { data } = await http.post('/api/v1/ordenes/', cuerpo, conIdempotencia());
  return datos<Orden>(data);
}

export async function admitirOrden(id: string): Promise<void> {
  await http.post(`/api/v1/ordenes/${id}/admitir/`, {}, conIdempotencia());
}

export async function finalizarOrden(id: string): Promise<void> {
  await http.post(`/api/v1/ordenes/${id}/finalizar/`);
}

export async function descargarReporte(id: string): Promise<Blob> {
  const { data } = await http.get(`/api/v1/ordenes/${id}/reporte-pdf/`, { responseType: 'blob' });
  return data as Blob;
}

export async function listarExamenes(f: { orden?: string; estado_examen__nombre?: string; limit?: number; offset?: number } = {}): Promise<Paginado<Examen>> {
  const { data } = await http.get('/api/v1/examenes-solicitados/', { params: { limit: 20, ...f } });
  return lista<Examen>(data);
}

export async function aprobarExamen(id: string): Promise<{ orden_finalizada: boolean }> {
  const { data } = await http.post(`/api/v1/examenes-solicitados/${id}/aprobar/`);
  return data;
}

export async function rechazarExamen(id: string, motivo_rechazo: string): Promise<void> {
  await http.post(`/api/v1/examenes-solicitados/${id}/rechazar/`, { motivo_rechazo });
}

export async function anularExamen(id: string, motivo: string): Promise<void> {
  await http.post(`/api/v1/examenes-solicitados/${id}/anular/`, { motivo });
}
