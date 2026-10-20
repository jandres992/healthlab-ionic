/**
 * Cliente HTTP central (RNF-08, RNF-13, RNF-33).
 * - Añade el JWT; ante 401 renueva una vez y reintenta; si no puede, cierra sesión.
 * - Convierte toda respuesta de error al tipo ApiError {estado, mensaje, errores}.
 * - `conIdempotencia()` genera la cabecera Idempotency-Key para escrituras reintentables.
 * Las vistas nunca usan axios directamente: pasan por api/endpoints/*.
 */
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? 'http://localhost:8000';

export interface ApiError {
  status: number;
  estado: string;
  mensaje: string;
  errores?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  sinConexion?: boolean;
}

export function esApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'estado' in e && 'mensaje' in e;
}

type Proveedor = {
  obtenerAccess: () => string | null;
  renovar: () => Promise<string | null>;
  cerrarSesion: () => Promise<void>;
};

let proveedor: Proveedor = {
  obtenerAccess: () => null,
  renovar: async () => null,
  cerrarSesion: async () => undefined,
};

/** El store de autenticación se registra aquí para evitar importaciones circulares. */
export function registrarProveedorSesion(p: Proveedor) {
  proveedor = p;
}

export const http = axios.create({ baseURL: API_URL, timeout: 20000 });

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = proveedor.obtenerAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let renovando: Promise<string | null> | null = null;

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<Record<string, unknown>>) => {
    const config = error.config as (AxiosRequestConfig & { _reintentado?: boolean }) | undefined;

    if (!error.response) {
      const err: ApiError = {
        status: 0, estado: 'sin_conexion', sinConexion: true,
        mensaje: `No se pudo conectar al servidor (${API_URL}). Verifica la red.`,
      };
      return Promise.reject(err);
    }

    const { status, data } = error.response;
    const esRutaAuth = (config?.url ?? '').includes('/usr/login/') || (config?.url ?? '').includes('/usr/token/refresh/');

    if (status === 401 && config && !config._reintentado && !esRutaAuth) {
      config._reintentado = true;
      renovando = renovando ?? proveedor.renovar().finally(() => { renovando = null; });
      const nuevo = await renovando;
      if (nuevo) {
        config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${nuevo}` };
        return http.request(config);
      }
      await proveedor.cerrarSesion();
    }

    const { estado, mensaje, errores, detail, ...extra } = (data ?? {}) as Record<string, unknown>;
    const err: ApiError = {
      status,
      estado: (estado as string) ?? (status === 403 ? 'no_autorizado' : status === 404 ? 'no_encontrado' : 'error'),
      mensaje: (mensaje as string) ?? (detail as string) ?? `Error ${status}`,
      errores: errores as Record<string, unknown> | undefined,
      extra,
    };
    return Promise.reject(err);
  },
);

/** Cabecera de idempotencia para escrituras que la app puede reintentar (RNF-33). */
export function conIdempotencia(clave?: string): { headers: Record<string, string> } {
  const id = clave ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return { headers: { 'Idempotency-Key': id } };
}

/** Desenvuelve {estado, datos} del backend cuando viene así; si no, devuelve el cuerpo. */
export function datos<T>(cuerpo: unknown): T {
  if (cuerpo && typeof cuerpo === 'object' && 'datos' in (cuerpo as Record<string, unknown>)) {
    return (cuerpo as { datos: T }).datos;
  }
  return cuerpo as T;
}

export interface Paginado<T> { count: number; next: string | null; previous: string | null; results: T[] }

/** Normaliza listados: el backend devuelve arreglo sin `limit` y paginado con `limit`. */
export function lista<T>(cuerpo: unknown): Paginado<T> {
  if (Array.isArray(cuerpo)) return { count: cuerpo.length, next: null, previous: null, results: cuerpo as T[] };
  return cuerpo as Paginado<T>;
}
