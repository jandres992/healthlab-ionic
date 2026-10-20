import { http, lista } from '../http';
import type { CatalogoCups, Departamento, Municipio, Parametro, SexoBiologico, TipoDocumento } from '../tipos';

// Catálogos: se cachean en el store (RNF-43); aquí solo la llamada.
export async function listarCups(buscar = ''): Promise<CatalogoCups[]> {
  const { data } = await http.get('/api/v1/catalogo-cups/', { params: buscar ? { search: buscar } : {} });
  return lista<CatalogoCups>(data).results;
}

export async function listarTiposDocumento(): Promise<TipoDocumento[]> {
  const { data } = await http.get('/api/v1/tipos-documento/');
  return lista<TipoDocumento>(data).results.filter((t) => t.activo !== false);
}

export async function listarSexos(): Promise<SexoBiologico[]> {
  const { data } = await http.get('/api/v1/sexos-biologicos/');
  return lista<SexoBiologico>(data).results;
}

export async function listarParametros(cups?: string | number): Promise<Parametro[]> {
  const { data } = await http.get('/api/v1/parametros/', { params: cups ? { cups } : {} });
  return lista<Parametro>(data).results;
}

export async function listarDepartamentos(): Promise<Departamento[]> {
  const { data } = await http.get('/usr/departamentos/');
  return lista<Departamento>(data).results;
}

export async function listarMunicipios(departamento: number): Promise<Municipio[]> {
  const { data } = await http.get('/usr/municipios/', { params: { departamento } });
  return lista<Municipio>(data).results;
}
