import { z } from 'zod';
import { alertCategoryEntrySchema } from './schemas.js';

/**
 * Expresiones de alerta por categoría (RN-SEG-007, `[VALIDAR-PROFESIONAL]`).
 *
 * Las categorías y su respuesta de cuidado salen de
 * `vault/wiki/conceptos/seguridad-y-cumplimiento.md` §4 y de
 * `plantillas-de-mensajes.md` §4 (CU-01 a CU-05).
 *
 * `[NEEDS CLARIFICATION: Q4]` La lista de expresiones no existe todavía en la bóveda:
 * la define y valida un profesional (spec-009 §10). No se inventa aquí
 * (CLAUDE.md, "Nunca"). Las listas quedan vacías y `ALERT_EXPRESSIONS_VALIDATED`
 * en false; el detector de SPEC-009 no se puede dar por terminado así.
 */
export const ALERT_EXPRESSIONS_VALIDATED = false;

export const ALERT_CATEGORIES_CATALOG = z.array(alertCategoryEntrySchema).parse([
  { category: 'extreme_restriction', careResponseId: 'CU-01', expressions: [] },
  { category: 'purge', careResponseId: 'CU-02', expressions: [] },
  { category: 'substances', careResponseId: 'CU-03', expressions: [] },
  { category: 'pain', careResponseId: 'CU-04', expressions: [] },
  { category: 'distress', careResponseId: 'CU-05', expressions: [] },
]);
