/** Funciones puras del dashboard de indicadores (RF-74): fechas, formatos y colores. */

/** Fecha local en formato AAAA-MM-DD (sin pasar por UTC, para no cambiar de día). */
export function fechaISO(fecha: Date = new Date()): string {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Rango de los últimos `dias` días, incluido hoy. */
export function rangoUltimosDias(dias: number, hoy: Date = new Date()): { fecha_inicio: string; fecha_fin: string } {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1));
  return { fecha_inicio: fechaISO(inicio), fecha_fin: fechaISO(hoy) };
}

/** Horas en texto corto: minutos si es menos de una hora y días si pasa de 48 horas. */
export function formatoHoras(horas: number | null | undefined): string {
  if (horas === null || horas === undefined || Number.isNaN(horas)) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`;
  return `${(horas / 24).toLocaleString('es-CO', { maximumFractionDigits: 1 })} días`;
}

export function formatoPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  return `${valor.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
}

/** Etiqueta corta del eje de días: DD/MM. */
export function etiquetaDia(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const COLORES_ESTADO: Record<string, string> = {
  Registrada: '#607793',
  'En Proceso': '#005fb8',
  'Resultados Parciales': '#00b4e1',
  Finalizada: '#1b7f3b',
  Anulada: '#b03030',
};
const COLORES_RESERVA = ['#00488d', '#0090b4', '#c77700', '#7b4fa0', '#4d6b8a'];

export function colorEstado(estado: string, indice = 0): string {
  return COLORES_ESTADO[estado] ?? COLORES_RESERVA[indice % COLORES_RESERVA.length];
}
