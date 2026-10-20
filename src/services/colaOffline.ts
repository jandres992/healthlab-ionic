/**
 * Cola offline (RN-26, RNF-33, RNF-33.1).
 * Solo se encolan operaciones seguras sin conexión: registrar toma de muestra y admitir
 * orden. Cada elemento lleva su propia Idempotency-Key, así un reenvío nunca duplica.
 * La cola se guarda en el almacenamiento seguro del dispositivo (Keychain/Keystore en
 * nativo; Preferences en web) y se sincroniza al volver la red.
 */
import { Network } from '@capacitor/network';
import { esApiError, http, type ApiError } from '@/api/http';
import { borrarSecreto, guardarSecreto, leerSecreto } from '@/services/almacenamientoSeguro';

const CLAVE = 'healthlab.cola_offline';

export type TipoOperacion = 'muestra.registrar' | 'orden.admitir';

export interface OperacionPendiente {
  id: string;                 // también es la Idempotency-Key
  tipo: TipoOperacion;
  metodo: 'POST';
  ruta: string;
  cuerpo: Record<string, unknown>;
  creadoEn: string;           // ISO, hora del dispositivo (fecha declarada)
  descripcion: string;        // para mostrar en la lista
  intentos: number;
}

export interface Conflicto extends OperacionPendiente {
  estado: string;
  mensaje: string;
  status: number;
}

export interface EstadoCola { pendientes: OperacionPendiente[]; conflictos: Conflicto[] }

const RUTAS_PERMITIDAS: Record<TipoOperacion, (c: Record<string, unknown>) => string> = {
  'muestra.registrar': () => '/api/v1/muestras/',
  'orden.admitir': (c) => `/api/v1/ordenes/${c.orden}/admitir/`,
};

function nuevoId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function leerCola(): Promise<EstadoCola> {
  try {
    const raw = await leerSecreto(CLAVE);
    if (!raw) return { pendientes: [], conflictos: [] };
    const d = JSON.parse(raw) as Partial<EstadoCola>;
    return { pendientes: d.pendientes ?? [], conflictos: d.conflictos ?? [] };
  } catch {
    return { pendientes: [], conflictos: [] };
  }
}

async function guardarCola(estado: EstadoCola): Promise<void> {
  if (!estado.pendientes.length && !estado.conflictos.length) {
    await borrarSecreto(CLAVE);
    return;
  }
  await guardarSecreto(CLAVE, JSON.stringify(estado));
}

/** Encola una operación permitida sin conexión. Devuelve el elemento creado. */
export async function encolar(tipo: TipoOperacion, cuerpo: Record<string, unknown>, descripcion: string): Promise<OperacionPendiente> {
  const estado = await leerCola();
  const op: OperacionPendiente = {
    id: nuevoId(), tipo, metodo: 'POST', ruta: RUTAS_PERMITIDAS[tipo](cuerpo),
    cuerpo: { ...cuerpo, fecha_declarada_dispositivo: new Date().toISOString() },
    creadoEn: new Date().toISOString(), descripcion, intentos: 0,
  };
  estado.pendientes.push(op);
  await guardarCola(estado);
  return op;
}

export async function hayConexion(): Promise<boolean> {
  try {
    return (await Network.getStatus()).connected;
  } catch {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}

export interface ResultadoSincronizacion { enviadas: number; conflictos: number; pendientes: number; detenidaPorRed: boolean }

/**
 * Envía la cola en orden. 2xx → sale de la cola; 4xx → pasa a conflictos (el servidor
 * revalidó el estado y la rechazó, RN-26); sin red o 5xx → se detiene y se reintenta luego.
 */
export async function sincronizar(): Promise<ResultadoSincronizacion> {
  const estado = await leerCola();
  let enviadas = 0;
  let detenidaPorRed = false;
  const restantes: OperacionPendiente[] = [];

  for (let i = 0; i < estado.pendientes.length; i++) {
    const op = estado.pendientes[i];
    if (detenidaPorRed) { restantes.push(op); continue; }
    try {
      await http.request({ method: op.metodo, url: op.ruta, data: op.cuerpo, headers: { 'Idempotency-Key': op.id } });
      enviadas++;
    } catch (e) {
      const err = esApiError(e) ? e : ({ status: 0, estado: 'error', mensaje: String(e), sinConexion: true } as ApiError);
      if (err.sinConexion || err.status >= 500) {
        detenidaPorRed = true;
        restantes.push({ ...op, intentos: op.intentos + 1 });
      } else {
        estado.conflictos.push({ ...op, estado: err.estado, mensaje: err.mensaje, status: err.status });
      }
    }
  }
  estado.pendientes = restantes;
  await guardarCola(estado);
  return { enviadas, conflictos: estado.conflictos.length, pendientes: restantes.length, detenidaPorRed };
}

export async function descartarConflicto(id: string): Promise<void> {
  const estado = await leerCola();
  estado.conflictos = estado.conflictos.filter((c) => c.id !== id);
  await guardarCola(estado);
}

export async function reintentarConflicto(id: string): Promise<void> {
  const estado = await leerCola();
  const c = estado.conflictos.find((x) => x.id === id);
  if (!c) return;
  estado.conflictos = estado.conflictos.filter((x) => x.id !== id);
  const { estado: _e, mensaje: _m, status: _s, ...op } = c;
  estado.pendientes.push({ ...op, id: nuevoId(), intentos: 0 });   // clave nueva: la anterior pudo quedar consumida
  await guardarCola(estado);
}
