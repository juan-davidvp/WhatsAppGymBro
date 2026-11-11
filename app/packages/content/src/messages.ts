/**
 * Nombres de los propósitos proactivos en `/ajustes` (AJ-01, AJ-02) y rótulos de
 * las opciones de `/pausa` (PA-01), transcritos de `plantillas-de-mensajes.md`
 * §2.6. Las claves son los propósitos del catálogo (RN-MSJ-001).
 */
export const PURPOSE_NAMES = {
  plan_listo: 'Plan del día',
  cierre_del_dia: 'Cierre del día',
  recordatorio_contextual: 'Recordatorio',
  regreso: 'Regreso',
  resumen_semanal: 'Resumen de la semana',
} as const;

export type NamedPurpose = keyof typeof PURPOSE_NAMES;

/** `{apagados}` de AJ-01 cuando no hay ningún tipo apagado. */
export const NO_PURPOSES_OFF = 'ninguno';

/** `{mes}` de `{fecha}` en BI-03 a BI-05 ("12-nov"), de enero a diciembre. */
export const MONTH_ABBREVIATIONS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/** PA-01: [1 día] y «{n} días» para los demás. */
export function pauseOptionLabel(days: number): string {
  return days === 1 ? '1 día' : `${days} días`;
}

/** `{e1rm}` de BI-04: " (e1RM {n} kg)" (§2.7). */
export function e1rmSuffix(kg: number): string {
  return ` (e1RM ${kg} kg)`;
}

/** Botones de PG-09: [−{n}] y [+{n}] con coma decimal (§2.7, P-100). */
export function weightStepLabel(deltaKg: number): string {
  return `${deltaKg < 0 ? '−' : '+'}${String(Math.abs(deltaKg)).replace('.', ',')}`;
}
