import { conIdempotencia, datos, http, lista, type Paginado } from '../http';
import type { Esquemas, Resultado, ResultadoRegistrar } from '../tipos';

export async function listarResultados(f: { examen_solicitado?: string; examen_solicitado__orden?: string; limit?: number; offset?: number } = {}): Promise<Paginado<Resultado>> {
  const { data } = await http.get('/api/v1/resultados/', { params: { limit: 50, ...f } });
  return lista<Resultado>(data);
}

export async function registrarResultado(cuerpo: ResultadoRegistrar): Promise<Resultado> {
  const { data } = await http.post('/api/v1/resultados/', cuerpo, conIdempotencia());
  return datos<Resultado>(data);
}

export async function listarLecturas(f: { procesado?: boolean; limit?: number; offset?: number } = {}): Promise<Paginado<Esquemas['LecturaEquipoSerial']>> {
  const { data } = await http.get('/api/v1/lecturas-serial/', { params: { limit: 20, ...f } });
  return lista<Esquemas['LecturaEquipoSerial']>(data);
}

export async function procesarLectura(id: string): Promise<Record<string, number | string>> {
  const { data } = await http.post(`/api/v1/lecturas-serial/${id}/procesar/`);
  return data;
}
