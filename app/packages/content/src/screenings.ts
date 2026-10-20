import { ALERT_CATEGORIES_CATALOG } from './alerts.js';
import { renderTemplate } from './lookup.js';

/**
 * Tamizajes del onboarding (RN-SEG-002, RN-SEG-003, `[VALIDAR-PROFESIONAL]`),
 * transcritos de `vault/output/sdd/contenido/tamizajes.md` (v0.1.0).
 * `screenings.test.ts` falla si este archivo y la bóveda no coinciden.
 */

/** PAR-Q+ oficial en español (F96). El bot no copia sus preguntas (F97): enlaza y pregunta el resultado. */
export const PARQ_FORM_URL = 'https://eparmedx.com/wp-content/uploads/2023/12/Spanish.pdf';

/** Plantillas de las 5 preguntas del SCOFF, en orden (TZ-06 a TZ-10). */
export const SCOFF_QUESTION_TEMPLATE_IDS = ['TZ-06', 'TZ-07', 'TZ-08', 'TZ-09', 'TZ-10'] as const;

/** TZ-01 con el enlace al formulario. */
export function renderPreActivityPrompt(): string {
  return renderTemplate('TZ-01', { enlace_parq: PARQ_FORM_URL });
}

/** TZ-11 con el recurso verificado de la categoría `extreme_restriction` (expresiones de alerta §4). */
export function renderFoodBodyPositive(): string {
  const resource = ALERT_CATEGORIES_CATALOG.find(
    (entry) => entry.category === 'extreme_restriction',
  )?.helpResource;
  if (!resource) throw new Error('Falta el recurso de ayuda de extreme_restriction');
  return renderTemplate('TZ-11', { recurso_local: resource });
}
