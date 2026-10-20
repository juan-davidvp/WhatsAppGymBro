/**
 * @gymbro/content — textos y catálogos versionados, transcritos de
 * `vault/output/sdd/contenido/`. Ninguna cadena para el usuario vive fuera de aquí.
 */
export * from './schemas.js';
export { MESSAGE_TEMPLATES, WEEKLY_PHRASES, PROHIBITED_EXPRESSIONS } from './templates.js';
export { LEVELS, ACHIEVEMENTS } from './achievements.js';
export { EXERCISES, EXPRESS_EXCEPTIONS } from './exercises.js';
export { FOODS, FREQUENT_MEAL_TEMPLATES } from './foods.js';
export { ALERT_CATEGORIES_CATALOG, ALERT_EXPRESSIONS_VALIDATED } from './alerts.js';
export {
  PRIVACY_POLICY_VERSION,
  renderCareResponse,
  renderTemplate,
  templateById,
} from './lookup.js';
export {
  PARQ_FORM_URL,
  SCOFF_QUESTION_TEMPLATE_IDS,
  renderFoodBodyPositive,
  renderPreActivityPrompt,
} from './screenings.js';
export {
  HOME_EQUIPMENT_OPTIONS,
  SESSION_NAMES,
  WEEKDAY_BUTTON_LABELS,
  WEEKDAY_NAMES,
} from './onboarding.js';
