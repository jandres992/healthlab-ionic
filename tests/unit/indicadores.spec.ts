import { describe, expect, it } from 'vitest';
import {
  colorEstado, etiquetaDia, fechaISO, formatoHoras, formatoPorcentaje, rangoUltimosDias,
} from '@/utils/indicadores';

describe('utilidades del dashboard de indicadores (RF-74)', () => {
  it('arma el rango de los últimos días con fechas locales', () => {
    const hoy = new Date(2026, 9, 23, 23, 30); // 23 de octubre de 2026, de noche
    expect(fechaISO(hoy)).toBe('2026-10-23');
    expect(rangoUltimosDias(7, hoy)).toEqual({ fecha_inicio: '2026-10-17', fecha_fin: '2026-10-23' });
    expect(rangoUltimosDias(30, hoy)).toEqual({ fecha_inicio: '2026-09-24', fecha_fin: '2026-10-23' });
    expect(rangoUltimosDias(1, hoy).fecha_inicio).toBe('2026-10-23');
  });

  it('muestra las horas en minutos, horas o días', () => {
    expect(formatoHoras(null)).toBe('—');
    expect(formatoHoras(0.5)).toBe('30 min');
    expect(formatoHoras(3)).toBe('3 h');
    expect(formatoHoras(72)).toBe('3 días');
  });

  it('formatea porcentajes y días', () => {
    expect(formatoPorcentaje(undefined)).toBe('—');
    expect(formatoPorcentaje(50)).toBe('50 %');
    expect(etiquetaDia('2026-10-05')).toBe('05/10');
  });

  it('asigna colores fijos a los estados conocidos', () => {
    expect(colorEstado('Finalizada')).toBe('#1b7f3b');
    expect(colorEstado('Otro', 0)).toBe(colorEstado('Otro', 5));
  });
});
