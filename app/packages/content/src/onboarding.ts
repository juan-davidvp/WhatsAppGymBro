/**
 * Catálogos que usa el onboarding (SPEC-001), transcritos de la bóveda:
 * `catalogo-de-ejercicios-base.md` §5 y §6 y la nota de botones generados de
 * `plantillas-de-mensajes.md` §3. `onboarding.test.ts` compara ambos lados.
 */

/** Equipamiento de casa que se pregunta (catálogo de ejercicios §6), en orden. */
export const HOME_EQUIPMENT_OPTIONS = [
  'Mancuernas',
  'Kettlebell',
  'Mochila',
  'Banda elástica',
  'Banco',
  'Silla firme',
  'Mesa estable',
] as const;

/** Nombre de cada sesión para el usuario (catálogo de ejercicios §5). */
export const SESSION_NAMES = {
  FULL_A: 'Cuerpo completo A',
  FULL_B: 'Cuerpo completo B',
  FULL_C: 'Cuerpo completo C',
  UPPER: 'Torso',
  LOWER: 'Pierna',
  PUSH: 'Empuje',
  PULL: 'Tirón',
  LEGS: 'Pierna (PPL)',
} as const;

/** Botones de días de ON-10, de lunes a domingo. */
export const WEEKDAY_BUTTON_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/** Nombre de cada día en los resúmenes, de lunes a domingo. */
export const WEEKDAY_NAMES = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;
