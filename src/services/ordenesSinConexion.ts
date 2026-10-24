/**
 * Órdenes abiertas del día para registrar tomas sin conexión (RN-26, defecto D-02).
 * Al cargar el formulario de toma con red se guardan, cifradas como la cola offline (RNF-33.1),
 * las órdenes que todavía admiten muestras. Sin red, el formulario las ofrece desde aquí.
 * Solo valen el mismo día y se borran al cerrar sesión; el servidor revalida la toma al sincronizar.
 */
import type { Orden } from '@/api/tipos';
import { borrarSecreto, guardarSecreto, leerSecreto } from '@/services/almacenamientoSeguro';

const CLAVE = 'healthlab.ordenes_sin_conexion';
const ESTADOS_CERRADOS = ['Finalizada', 'Anulada'];

interface Guardadas { dia: string; ordenes: Orden[] }

function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ordenesAbiertas(ordenes: Orden[]): Orden[] {
  return ordenes.filter((o) => !ESTADOS_CERRADOS.includes(String(o.estado_general)));
}

export async function guardarOrdenesDelDia(ordenes: Orden[]): Promise<void> {
  const abiertas = ordenesAbiertas(ordenes);
  if (!abiertas.length) return;
  await guardarSecreto(CLAVE, JSON.stringify({ dia: hoy(), ordenes: abiertas } satisfies Guardadas));
}

export async function leerOrdenesDelDia(): Promise<Orden[]> {
  try {
    const raw = await leerSecreto(CLAVE);
    if (!raw) return [];
    const g = JSON.parse(raw) as Guardadas;
    if (g.dia !== hoy()) {
      await borrarSecreto(CLAVE);
      return [];
    }
    return g.ordenes ?? [];
  } catch {
    return [];
  }
}

export function filtrarOrdenes(ordenes: Orden[], texto: string): Orden[] {
  const t = texto.trim().toLowerCase();
  if (!t) return ordenes;
  return ordenes.filter((o) => [o.numero_orden, o.paciente_nombre, o.paciente_documento]
    .some((v) => String(v ?? '').toLowerCase().includes(t)));
}

export async function olvidarOrdenesDelDia(): Promise<void> {
  await borrarSecreto(CLAVE);
}
