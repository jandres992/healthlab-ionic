import { datos, http, lista, type Paginado } from '../http';
import type { CatalogoCups, Esquemas, TipoDocumento } from '../tipos';

export type Usuario = Esquemas['Usuario'];
export type Permiso = Esquemas['Permiso'];
export type TipoUsuario = Esquemas['TipoUsuario'];
export type UsuarioXPermiso = Esquemas['UsuarioXPermiso'];

// ── Cuentas (RF-05) ───────────────────────────────────────────────────────────

export async function listarUsuarios(f: { search?: string; is_active?: boolean; limit?: number; offset?: number } = {}): Promise<Paginado<Usuario>> {
  const { data } = await http.get('/usr/usuarios/', { params: { limit: 20, ...f } });
  return lista<Usuario>(data);
}

export async function crearUsuario(cuerpo: Esquemas['UsuarioRequest']): Promise<Usuario> {
  const { data } = await http.post('/usr/usuarios/', cuerpo);
  return data as Usuario;
}

export async function editarUsuario(id: number, cambios: Esquemas['PatchedUsuarioRequest']): Promise<Usuario> {
  const { data } = await http.patch(`/usr/usuarios/${id}/`, cambios);
  return data as Usuario;
}

export async function desactivarUsuario(id: number): Promise<void> {
  await http.delete(`/usr/usuarios/${id}/`);
}

// ── Roles (RF-05.1) ───────────────────────────────────────────────────────────

export async function listarPermisos(): Promise<Permiso[]> {
  const { data } = await http.get('/usr/permisos/', { params: { limit: 100 } });
  return lista<Permiso>(data).results;
}

export async function listarAsignaciones(usuario: number): Promise<UsuarioXPermiso[]> {
  const { data } = await http.get('/usr/usuarios-permisos/', { params: { usuario, limit: 100 } });
  return lista<UsuarioXPermiso>(data).results;
}

export async function asignarRol(usuario: number, permiso: number): Promise<UsuarioXPermiso> {
  const { data } = await http.post('/usr/usuarios-permisos/', { usuario, permiso });
  return data as UsuarioXPermiso;
}

export async function quitarRol(asignacionId: number): Promise<void> {
  await http.delete(`/usr/usuarios-permisos/${asignacionId}/`);
}

// ── Catálogos (RF-10, RF-13) ──────────────────────────────────────────────────

export async function listarCupsTodos(search = ''): Promise<CatalogoCups[]> {
  const { data } = await http.get('/api/v1/catalogo-cups/', { params: { limit: 100, incluir_inactivos: true, search: search || undefined } });
  return lista<CatalogoCups>(data).results;
}

export async function crearCups(cuerpo: Esquemas['CatalogoCupsRequest']): Promise<CatalogoCups> {
  const { data } = await http.post('/api/v1/catalogo-cups/', cuerpo);
  return datos<CatalogoCups>(data);
}

export async function editarCups(id: number, cambios: Esquemas['PatchedCatalogoCupsRequest']): Promise<CatalogoCups> {
  const { data } = await http.patch(`/api/v1/catalogo-cups/${id}/`, cambios);
  return datos<CatalogoCups>(data);
}

export async function listarTiposDocumentoTodos(): Promise<TipoDocumento[]> {
  const { data } = await http.get('/api/v1/tipos-documento/', { params: { limit: 100 } });
  return lista<TipoDocumento>(data).results;
}

export async function crearTipoDocumento(cuerpo: Esquemas['TipoDocumentoPacienteRequest']): Promise<TipoDocumento> {
  const { data } = await http.post('/api/v1/tipos-documento/', cuerpo);
  return datos<TipoDocumento>(data);
}

export async function editarTipoDocumento(id: number, cambios: Esquemas['PatchedTipoDocumentoPacienteRequest']): Promise<TipoDocumento> {
  const { data } = await http.patch(`/api/v1/tipos-documento/${id}/`, cambios);
  return datos<TipoDocumento>(data);
}
