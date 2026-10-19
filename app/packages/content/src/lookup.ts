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

/**
 * Texto de una plantilla con sus `{variables}` reemplazadas. Falla si falta una
 * variable o sobra una: un mensaje con `{llaves}` sin rellenar no llega al usuario.
 */
export function renderTemplate(
  id: string,
  variables: Readonly<Record<string, string | number>> = {},
): string {
  const { text } = templateById(id);
  const used = new Set<string>();
  const rendered = text.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = variables[name];
    if (value === undefined) throw new Error(`Falta {${name}} en ${id}`);
    used.add(name);
    return String(value);
  });
  const extra = Object.keys(variables).filter((name) => !used.has(name));
  if (extra.length > 0) throw new Error(`Variables que ${id} no usa: ${extra.join(', ')}`);
  return rendered;
}

/** Versión de la política que acepta quien toca [Acepto] (se guarda con cada autorización). */
export const PRIVACY_POLICY_VERSION = 'PV-01@fase0-2026-10-19';
