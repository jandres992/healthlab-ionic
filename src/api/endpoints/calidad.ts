import { datos, http, lista, type Paginado } from '../http';
import type { Esquemas, Informe } from '../tipos';

export type Equipo = Esquemas['ConfiguracionEquipo'];
export type EstadoCCI = Esquemas['EstadoCCI'];
export type LoteControl = Esquemas['LoteControl'];
export type LoteReactivo = Esquemas['LoteReactivo'];
export type CorridaCCI = Esquemas['CorridaCCI'];
export type PoliticaCCI = Esquemas['PoliticaCCI'];
export type Calibracion = Esquemas['CalibracionEquipo'];
export type Mantenimiento = Esquemas['MantenimientoEquipo'];

// ── Equipos (RF-51) ───────────────────────────────────────────────────────────

export async function listarEquipos(): Promise<Equipo[]> {
  const { data } = await http.get('/api/v1/equipos/', { params: { limit: 100 } });
  return lista<Equipo>(data).results;
}

export async function obtenerEquipo(id: number): Promise<Equipo> {
  const { data } = await http.get(`/api/v1/equipos/${id}/`);
  return datos<Equipo>(data);
}

export async function cambiarEstadoEquipo(id: number, estado: string, motivo = ''): Promise<void> {
  await http.post(`/api/v1/equipos/${id}/cambiar-estado/`, { estado, motivo });
}

export async function registrarCalibracion(id: number, cuerpo: Esquemas['CalibracionEquipoRequest']): Promise<Calibracion> {
  const { data } = await http.post(`/api/v1/equipos/${id}/calibracion/`, cuerpo);
  return datos<Calibracion>(data);
}

export async function listarCalibraciones(id: number): Promise<Calibracion[]> {
  const { data } = await http.get(`/api/v1/equipos/${id}/calibraciones/`);
  return data as Calibracion[];
}

export async function registrarMantenimiento(id: number, cuerpo: Esquemas['MantenimientoEquipoRequest']): Promise<Mantenimiento> {
  const { data } = await http.post(`/api/v1/equipos/${id}/mantenimiento/`, cuerpo);
  return datos<Mantenimiento>(data);
}

export async function listarMantenimientos(id: number): Promise<Mantenimiento[]> {
  const { data } = await http.get(`/api/v1/equipos/${id}/mantenimientos/`);
  return data as Mantenimiento[];
}

export async function regenerarToken(id: number): Promise<string> {
  const { data } = await http.post(`/api/v1/equipos/${id}/regenerar-token/`);
  return data.token_middleware as string;
}

export async function crearEquipo(cuerpo: Esquemas['ConfiguracionEquipoRequest']): Promise<Equipo> {
  const { data } = await http.post('/api/v1/equipos/', cuerpo);
  return datos<Equipo>(data);
}

// ── Lotes (RF-52) ─────────────────────────────────────────────────────────────

export async function listarLotesReactivo(equipo?: number): Promise<LoteReactivo[]> {
  const { data } = await http.get('/api/v1/lotes-reactivo/', { params: { limit: 100, equipo } });
  return lista<LoteReactivo>(data).results;
}

export async function crearLoteReactivo(cuerpo: Esquemas['LoteReactivoRequest']): Promise<LoteReactivo> {
  const { data } = await http.post('/api/v1/lotes-reactivo/', cuerpo);
  return datos<LoteReactivo>(data);
}

export async function editarLoteReactivo(id: number, cambios: Esquemas['PatchedLoteReactivoRequest']): Promise<LoteReactivo> {
  const { data } = await http.patch(`/api/v1/lotes-reactivo/${id}/`, cambios);
  return datos<LoteReactivo>(data);
}

// ── Control de calidad (RF-50) ────────────────────────────────────────────────

export async function listarLotesControl(equipo?: number): Promise<LoteControl[]> {
  const { data } = await http.get('/api/v1/lotes-control/', { params: { limit: 100, equipo } });
  return lista<LoteControl>(data).results;
}

export async function crearLoteControl(cuerpo: Esquemas['LoteControlRequest']): Promise<LoteControl> {
  const { data } = await http.post('/api/v1/lotes-control/', cuerpo);
  return datos<LoteControl>(data);
}

export async function listarCorridas(f: { lote_control?: number; lote_control__equipo?: number; lote_control__nombre_parametro?: string; limit?: number } = {}): Promise<Paginado<CorridaCCI>> {
  const { data } = await http.get('/api/v1/cci/', { params: { limit: 50, ...f } });
  return lista<CorridaCCI>(data);
}

export async function registrarCorrida(lote_control: number, valor: string): Promise<CorridaCCI> {
  const { data } = await http.post('/api/v1/cci/', { lote_control, valor });
  return datos<CorridaCCI>(data);
}

export async function accionCorrectiva(id: number, accion_correctiva: string): Promise<CorridaCCI> {
  const { data } = await http.post(`/api/v1/cci/${id}/accion-correctiva/`, { accion_correctiva });
  return datos<CorridaCCI>(data);
}

/** Estado del CCI del día, modo de la política y propuesta de endurecimiento (RF-50.1). */
export async function estadoCCI(equipo: number, nombre_parametro: string): Promise<EstadoCCI> {
  const { data } = await http.get('/api/v1/cci/estado/', { params: { equipo, nombre_parametro } });
  return data as EstadoCCI;
}

export async function definirPolitica(equipo: number, nombre_parametro: string, modo: string): Promise<PoliticaCCI> {
  const { data } = await http.post('/api/v1/cci/politica/', { equipo, nombre_parametro, modo });
  return datos<PoliticaCCI>(data);
}

export async function listarPoliticas(): Promise<PoliticaCCI[]> {
  const { data } = await http.get('/api/v1/cci/politicas/');
  return data as PoliticaCCI[];
}

// ── Informes ──────────────────────────────────────────────────────────────────

export async function listarInformes(orden: string): Promise<Paginado<Informe>> {
  const { data } = await http.get('/api/v1/informes/', { params: { orden, limit: 20 } });
  return lista<Informe>(data);
}
