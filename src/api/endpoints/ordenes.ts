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

/** PDF guardado de un informe ya emitido: imprimirlo no genera un informe nuevo (RF-37.6). */
export async function descargarInformeGuardado(informeId: string): Promise<Blob> {
  const { data } = await http.get(`/api/v1/informes/${informeId}/pdf/`, { responseType: 'blob' });
  return data as Blob;
}

export async function listarExamenes(f: { orden?: string; estado_examen__nombre?: string; limit?: number; offset?: number } = {}): Promise<Paginado<Examen>> {
  const { data } = await http.get('/api/v1/examenes-solicitados/', { params: { limit: 20, ...f } });
  return lista<Examen>(data);
}

export async function obtenerExamen(id: string): Promise<Examen> {
  const { data } = await http.get(`/api/v1/examenes-solicitados/${id}/`);
  return datos<Examen>(data);
}

/** Validación (firma) del bacteriólogo. `justificacion_cci` solo cuando la política está en Advertencia (RF-50.1). */
export async function aprobarExamen(id: string, justificacion_cci?: string): Promise<{ orden_finalizada: boolean }> {
  const { data } = await http.post(`/api/v1/examenes-solicitados/${id}/aprobar/`, justificacion_cci ? { justificacion_cci } : {});
  return data;
}

export async function rechazarExamen(id: string, motivo_rechazo: string): Promise<void> {
  await http.post(`/api/v1/examenes-solicitados/${id}/rechazar/`, { motivo_rechazo });
}

export async function anularExamen(id: string, motivo: string): Promise<void> {
  await http.post(`/api/v1/examenes-solicitados/${id}/anular/`, { motivo });
}
