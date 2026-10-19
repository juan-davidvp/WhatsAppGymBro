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
export { templateById } from './lookup.js';
