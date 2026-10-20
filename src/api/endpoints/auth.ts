import { Device } from '@capacitor/device';
import { http } from '../http';
import type { PerfilPropio, RespuestaLogin } from '../tipos';

export async function login(username: string, password: string): Promise<RespuestaLogin> {
  let dispositivo: Record<string, string> = {};
  try {
    const [id, info] = await Promise.all([Device.getId(), Device.getInfo()]);
    dispositivo = {
      device_id: id.identifier,
      nombre_dispositivo: `${info.manufacturer ?? ''} ${info.model ?? info.platform}`.trim(),
      user_agent: `HealthLabIonic/${info.platform} ${info.osVersion ?? ''}`.trim(),
    };
  } catch { /* sin datos de dispositivo */ }
  const { data } = await http.post<RespuestaLogin>('/usr/login/', { username, password, ...dispositivo, es_confiable: true });
  return data;
}

export async function renovarToken(refresh: string): Promise<{ access: string; refresh?: string }> {
  const { data } = await http.post('/usr/token/refresh/', { refresh });
  return data;
}

export async function logout(refresh: string | null): Promise<void> {
  await http.post('/usr/logout/', { refresh });
}

export async function perfil(): Promise<PerfilPropio> {
  const { data } = await http.get<PerfilPropio>('/usr/me/');
  return data;
}

export async function actualizarPerfil(cambios: Partial<PerfilPropio>): Promise<PerfilPropio> {
  const { data } = await http.patch<PerfilPropio>('/usr/me/', cambios);
  return data;
}

export async function cambiarContrasena(password_actual: string, password_nueva: string): Promise<void> {
  await http.post('/usr/me/password/', { password_actual, password_nueva });
}
