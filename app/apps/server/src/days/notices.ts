import { renderTemplate, templateById } from '@gymbro/content';
import { button, plain, templateReply, type Reply } from '../onboarding/replies.js';
import type {
  NoticeRecord,
  NoticesRepository,
  StreakStatesRepository,
  UserRecord,
} from '../ports/repositories.js';

/**
 * Avisos del cierre para la próxima interacción (T-061; decisión del PO,
 * 2026-11-08): mientras no exista la bandeja de salida (T-070), lo que pasa al
 * cerrar un día (comodín usado, racha reiniciada, reparación) se muestra la
 * próxima vez que el usuario abre 🏋️ Hoy o registra algo. No es un mensaje
 * proactivo: va como respuesta a su interacción (constitución III).
 */

export interface NoticeDeps {
  notices: NoticesRepository;
  streaks: StreakStatesRepository;
  clock: () => Date;
}

/** RA-02 ofrece la reparación (RN-GAM-003): solo se muestra si el plazo sigue abierto. */
const REPAIR_OFFER = 'RA-02';

export async function takeNotices(user: UserRecord, deps: NoticeDeps): Promise<Reply[]> {
  const now = deps.clock();
  const pending = await deps.notices.takePending(user.id, now);
  if (pending.length === 0) return [];
  // Tras varios días sin abrir el bot, de los avisos que se reemplazan (racha y
  // misiones de la semana) solo queda el más reciente; los logros se muestran todos.
  const shown = pending.filter(
    (notice, i) =>
      !LATEST_ONLY.has(notice.templateId) ||
      !pending.slice(i + 1).some((later) => later.templateId === notice.templateId),
  );
  const repair = (await deps.streaks.get(user.id))?.state.streak.repair ?? null;
  const repairOpen = repair !== null && now.getTime() <= Date.parse(repair.offeredUntil);
  return shown
    .filter((notice) => notice.templateId !== REPAIR_OFFER || repairOpen)
    .map(noticeReply);
}

/** Avisos que un aviso posterior de la misma plantilla deja sin vigencia. */
const LATEST_ONLY: ReadonlySet<string> = new Set(['RA-01', 'RA-02', 'MI-01']);

/** T-065 · CU-06 (RN-SEG-008) con [Sí, descanso] y [Ajustar plan]. */
export function overuseCareReply(): Reply {
  return templateReply(OVERUSE_CARE, (value) => ({ action: 'td', value }));
}

const OVERUSE_CARE = 'CU-06';

function noticeReply(notice: NoticeRecord): Reply {
  if (notice.templateId === OVERUSE_CARE) return overuseCareReply();
  if (notice.templateId === REPAIR_OFFER) {
    return templateReply(
      REPAIR_OFFER,
      (value) => ({ action: 'td', value }),
      renderTemplate(REPAIR_OFFER, notice.variables),
    );
  }
  return withLogbookButtons(plain(notice.templateId, notice.variables), notice.templateId);
}

/** [Ver bitácora] y [Ver progreso] de RE-01 a RE-05 (T-081); sin ellos, el aviso va solo. */
const PROGRESS_BUTTONS: Readonly<Record<string, string>> = {
  'Ver bitácora': 'log',
  'Ver progreso': 'p',
};

function withLogbookButtons(reply: Reply, templateId: string): Reply {
  const labels = templateById(templateId).buttons;
  if (labels.length === 0 || !labels.every((label) => PROGRESS_BUTTONS[label])) return reply;
  return {
    ...reply,
    buttons: labels.map((label) =>
      button(label, { action: 'pg', value: PROGRESS_BUTTONS[label] ?? 'p' }),
    ),
  };
}
