import { ALERT_CATEGORIES_CATALOG } from './alerts.js';
import type { AlertCategory, MessageTemplate } from './schemas.js';
import { MESSAGE_TEMPLATES } from './templates.js';

const BY_ID = new Map(MESSAGE_TEMPLATES.map((template) => [template.id, template]));

/** Plantilla por su ID (`ON-01`, `PL-03`…). Falla si no existe: un ID mal escrito no llega al usuario. */
export function templateById(id: string): MessageTemplate {
  const template = BY_ID.get(id);
  if (!template) throw new Error(`Plantilla desconocida: ${id}`);
  return template;
}

/**
 * Texto final de la respuesta de cuidado de una categoría de alerta, con
 * `{recurso_local}` reemplazado por su recurso verificado (expresiones-de-alerta.md §4).
 */
export function renderCareResponse(category: AlertCategory): string {
  const entry = ALERT_CATEGORIES_CATALOG.find((c) => c.category === category);
  if (!entry) throw new Error(`Categoría de alerta desconocida: ${category}`);
  const { text } = templateById(entry.careResponseId);
  return entry.helpResource ? text.replaceAll('{recurso_local}', entry.helpResource) : text;
}
