import { http, lista, type Paginado } from '../http';
import type { Notificacion } from '../tipos';

export async function listarNotificaciones(soloNoLeidas = false, limit = 50): Promise<Paginado<Notificacion>> {
  const { data } = await http.get('/api/v1/notificaciones/', { params: { limit, no_leidas: soloNoLeidas } });
  return lista<Notificacion>(data);
}

export async function marcarLeida(id: string): Promise<void> {
  await http.post(`/api/v1/notificaciones/${id}/marcar-leida/`);
}

export async function marcarTodasLeidas(): Promise<void> {
  await http.post('/api/v1/notificaciones/marcar-todas-leidas/');
}
