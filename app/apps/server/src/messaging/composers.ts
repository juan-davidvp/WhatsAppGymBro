import type { MessagePurpose } from '@gymbro/domain';
import type { Composer } from './compose.js';
import { dayClosing, planReady } from './compose-day.js';
import { maintenanceAlert } from './compose-goal.js';
import { comeback, contextualReminder, weeklySummary } from './compose-week.js';

/**
 * Compositor de cada propósito proactivo de M7 (T-070, T-071). `reconocimiento`
 * sigue como aviso en la próxima interacción y `mantenimiento` pasa a M8 (PO,
 * 2026-11-10): sin compositor, una salida de esos propósitos se suprime.
 */
export const COMPOSERS: Partial<Record<MessagePurpose, Composer>> = {
  plan_listo: planReady,
  cierre_del_dia: dayClosing,
  regreso: comeback,
  recordatorio_contextual: contextualReminder,
  resumen_semanal: weeklySummary,
  mantenimiento: maintenanceAlert,
};
