import type { MessageTemplate } from './schemas.js';
import { MESSAGE_TEMPLATES } from './templates.js';

const BY_ID = new Map(MESSAGE_TEMPLATES.map((template) => [template.id, template]));

/** Plantilla por su ID (`ON-01`, `PL-03`…). Falla si no existe: un ID mal escrito no llega al usuario. */
export function templateById(id: string): MessageTemplate {
  const template = BY_ID.get(id);
  if (!template) throw new Error(`Plantilla desconocida: ${id}`);
  return template;
}
