import { datos, http, lista, type Paginado } from '../http';
import type { Esquemas, Informe } from '../tipos';

export type Equipo = Esquemas['ConfiguracionEquipo'];
export type EstadoCCI = Esquemas['EstadoCCI'];

export async function listarEquipos(): Promise<Equipo[]> {
  const { data } = await http.get('/api/v1/equipos/', { params: { limit: 100 } });
  return lista<Equipo>(data).results;
}

/** Estado del CCI del día, modo de la política y propuesta de endurecimiento (RF-50.1). */
export async function estadoCCI(equipo: number, nombre_parametro: string): Promise<EstadoCCI> {
  const { data } = await http.get('/api/v1/cci/estado/', { params: { equipo, nombre_parametro } });
  return data as EstadoCCI;
}

export async function listarInformes(orden: string): Promise<Paginado<Informe>> {
  const { data } = await http.get('/api/v1/informes/', { params: { orden, limit: 20 } });
  return lista<Informe>(data);
}

export async function obtenerEquipo(id: number): Promise<Equipo> {
  const { data } = await http.get(`/api/v1/equipos/${id}/`);
  return datos<Equipo>(data);
}
