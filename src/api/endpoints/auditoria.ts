import { API_URL, http, lista, type Paginado } from '../http';
import type { Esquemas } from '../tipos';

export type RegistroAuditoria = Esquemas['Auditoria'];

export interface FiltroAuditoria { search?: string; accion__startswith?: string; usuario?: number; exito?: boolean; fecha__gte?: string; fecha__lte?: string; limit?: number; offset?: number }

export async function listarAuditoria(f: FiltroAuditoria = {}): Promise<Paginado<RegistroAuditoria>> {
  const { data } = await http.get('/usr/auditoria/', { params: { limit: 50, ...f } });
  return lista<RegistroAuditoria>(data);
}

/** CSV RIPS de órdenes finalizadas (RF-42). */
export async function exportarRips(fecha_inicio?: string, fecha_fin?: string): Promise<Blob> {
  const { data } = await http.get('/api/v1/ordenes/export-rips/', { params: { fecha_inicio, fecha_fin }, responseType: 'blob' });
  return data as Blob;
}

export { API_URL };
