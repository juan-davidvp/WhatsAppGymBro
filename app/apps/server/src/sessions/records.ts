import { ACHIEVEMENTS, renderTemplate } from '@gymbro/content';
import { detectPersonalRecord, type LoggedEntry } from '@gymbro/domain';
import type { Reply } from '../onboarding/replies.js';
import type { UserRecord, WorkoutSessionRecord } from '../ports/repositories.js';
import { exerciseName, formatLoad, usesEquipment } from './card.js';
import type { TrainingDeps } from './deps.js';

/**
 * Récords personales (T-044, HU-003-4, RN-ENT-005, RN-GAM-011). Al confirmar una
 * serie se compara con todo lo registrado antes en ese ejercicio; si es récord se
 * guarda (uno por serie), se anotan en la bitácora los logros del catálogo que
 * correspondan y se avisa con PR-01. El XP del récord lo suma T-062.
 */

const FIRST_PR = 'FIRST_PR';
const MANY_PRS = 'PR_10';
/** Récords que pide PR_10, leídos de su condición en el catálogo de logros ("10 récords personales"). */
const MANY_PRS_COUNT = Number(
  /^(\d+)/.exec(ACHIEVEMENTS.find((a) => a.code === MANY_PRS)?.condition ?? '')?.[1] ?? Infinity,
);

export async function checkRecord(
  user: UserRecord,
  session: WorkoutSessionRecord,
  entry: LoggedEntry,
  deps: TrainingDeps,
): Promise<Reply | null> {
  const history = (await deps.setEntries.exerciseHistory(user.id, entry.exerciseCode)).filter(
    (s) => !(s.sessionId === session.id && s.setIndex === entry.setIndex),
  );
  const record = detectPersonalRecord(entry, history);
  if (!record) return null;
  const now = deps.clock();
  const stored = await deps.records.record({
    userId: user.id,
    exerciseCode: entry.exerciseCode,
    type: record.kind,
    value: entry.loadKg > 0 && record.kind === 'e1rm' ? entry.loadKg : entry.reps,
    date: session.date,
    setKey: `set:${session.id}:${entry.exerciseCode}:${entry.setIndex}`,
  });
  if (!stored.inserted) return null;
  const total = await deps.records.count(user.id);
  for (const code of [FIRST_PR, ...(total >= MANY_PRS_COUNT ? [MANY_PRS] : [])]) {
    if (ACHIEVEMENTS.some((a) => a.code === code)) {
      await deps.achievements.appendOnce({
        userId: user.id,
        code,
        at: now,
        value: entry.exerciseCode,
        context: record.kind,
      });
    }
  }
  await deps.events.emit(
    'pr_detected',
    { userId: user.id, timezone: user.timezone },
    { exerciseCode: entry.exerciseCode, kind: record.kind },
  );
  return {
    text: renderTemplate('PR-01', {
      ejercicio: exerciseName(entry.exerciseCode),
      carga: formatLoad(entry.loadKg, usesEquipment(entry.exerciseCode)),
      reps: entry.reps,
    }),
    buttons: [],
    toast: true,
  };
}

/** `{record_txt}` de SE-01: " y 1 récord 🏆", " y 2 récords 🏆" o vacío. */
export async function recordText(
  session: WorkoutSessionRecord,
  deps: TrainingDeps,
): Promise<string> {
  const count = await deps.records.countForSession(session.userId, session.id);
  if (count === 0) return '';
  return ` y ${count} ${count === 1 ? 'récord' : 'récords'} 🏆`;
}
