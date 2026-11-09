import { QUEST_LABELS } from '@gymbro/content';
import {
  addDays,
  generateWeeklyQuests,
  questsReached,
  weekStartOf,
  type LocalDate,
} from '@gymbro/domain';
import { hadRiskSignal } from '../days/risk.js';
import { grantXp } from '../days/xp.js';
import type { QuestsRepository, UserRecord } from '../ports/repositories.js';
import { weekAchieved, type CloseWeekDeps } from './close-week.js';

/**
 * Misiones semanales (T-063, HU-005-6, RN-GAM-008). Al cerrar un día se asegura
 * que la semana del día siguiente tenga sus 3 misiones (la primera semana, con
 * el mínimo; después, P-041 × lo logrado la semana anterior) y se revisan las de
 * la semana del día cerrado. Avisos: MI-01 al generarlas y MI-02 al cumplir una
 * (decisión del PO, 2026-11-09), en la próxima interacción.
 */

export interface QuestDeps extends CloseWeekDeps {
  quests: QuestsRepository;
}

const WEEK_LENGTH = 7;

/** Genera las misiones de la semana `weekStart` si todavía no existen. */
export async function ensureWeekQuests(
  user: UserRecord,
  weekStart: LocalDate,
  deps: QuestDeps,
): Promise<void> {
  if (await deps.quests.get(user.id, weekStart)) return;
  const previousStart = addDays(weekStart, -WEEK_LENGTH);
  const previous = (await deps.weeks.list(user.id)).find((w) => w.weekStart === previousStart);
  const quests = generateWeeklyQuests(
    previous
      ? {
          sessions: previous.completed,
          nutritionHalfDays: previous.nutritionHalfDays,
          countedDays: previous.countedDays,
        }
      : null,
  );
  const { created } = await deps.quests.create(user.id, weekStart, quests);
  if (!created) return;
  const target = (kind: string) => quests.find((q) => q.kind === kind)?.target ?? 0;
  await deps.events.emit(
    'quest_generated',
    { userId: user.id, timezone: user.timezone },
    {
      training: target('TRAINING'),
      nutrition: target('NUTRITION'),
      consistency: target('CONSISTENCY'),
    },
  );
  if (!user.settings.gamificationEnabled) return;
  await deps.notices.add(user.id, {
    key: `MI-01:${weekStart}`,
    templateId: 'MI-01',
    variables: {
      entreno: target('TRAINING'),
      comida: target('NUTRITION'),
      constancia: target('CONSISTENCY'),
    },
    createdAt: deps.clock(),
  });
}

/** Marca cumplidas las misiones de la semana de `date` que ya alcanzaron su meta. */
export async function evaluateQuests(
  user: UserRecord,
  date: LocalDate,
  deps: QuestDeps,
): Promise<void> {
  const weekStart = weekStartOf(date);
  const quests = await deps.quests.get(user.id, weekStart);
  if (!quests) return;
  const pending = quests.filter((q) => !q.done);
  const achieved = await weekAchieved(user, weekStart, date, deps);
  const subject = { userId: user.id, timezone: user.timezone };
  const announce = user.settings.gamificationEnabled && !(await hadRiskSignal(user, date, deps));
  for (const kind of questsReached(pending, achieved)) {
    if (!(await deps.quests.markDone(user.id, weekStart, kind))) continue;
    await grantXp(user, date, { type: 'WEEKLY_QUEST' }, `quest:${weekStart}:${kind}`, deps);
    await deps.events.emit('quest_completed', subject, { kind });
    if (!announce) continue;
    await deps.notices.add(user.id, {
      key: `MI-02:${weekStart}:${kind}`,
      templateId: 'MI-02',
      variables: {
        mision: QUEST_LABELS[kind],
        meta: pending.find((q) => q.kind === kind)?.target ?? 0,
      },
      createdAt: deps.clock(),
    });
  }
}
