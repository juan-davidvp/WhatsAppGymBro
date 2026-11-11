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

/** PA-01: [1 día] y «{n} días» para los demás. */
export function pauseOptionLabel(days: number): string {
  return days === 1 ? '1 día' : `${days} días`;
}
