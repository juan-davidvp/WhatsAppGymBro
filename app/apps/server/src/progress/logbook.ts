import { ACHIEVEMENTS, MONTH_ABBREVIATIONS, e1rmSuffix, renderTemplate } from '@gymbro/content';
import { PARAMETERS, estimated1RM, operationalDate, type LocalDate } from '@gymbro/domain';
import type { Reply } from '../onboarding/replies.js';
import type { UserRecord } from '../ports/repositories.js';
import { exerciseName, formatLoad, usesEquipment } from '../sessions/card.js';
import type { ProgressDeps } from './progress-screen.js';

/**
 * `/logros` y [Ver bitácora] (T-081, HU-006-3, RN-GAM-011): logros del catálogo y
 * récords, de los más viejos a los más recientes, con las últimas P-101 entradas.
 * Solo lectura: la bitácora no se edita (FR-006-03).
 */

interface LogbookLine {
  readonly date: LocalDate;
  readonly text: string;
}

/** `{fecha}` de BI-03 a BI-05: "12-nov". */
function shortDate(date: LocalDate): string {
  const [, month = 1, day = 1] = date.split('-').map(Number);
  return `${day}-${MONTH_ABBREVIATIONS[month - 1] ?? ''}`;
}

const achievementName = (code: string) => ACHIEVEMENTS.find((a) => a.code === code)?.name ?? code;

export async function logbookScreen(user: UserRecord, deps: ProgressDeps): Promise<Reply[]> {
  const achievements: LogbookLine[] = (await deps.achievements.list(user.id)).map((a) => {
    const date = operationalDate(a.at, user.timezone);
    return {
      date,
      text: renderTemplate('BI-03', { fecha: shortDate(date), nombre: achievementName(a.code) }),
    };
  });
  const records: LogbookLine[] = (await deps.records.list(user.id)).map((r) => {
    const base = { fecha: shortDate(r.date), ejercicio: exerciseName(r.exerciseCode) };
    if (r.loadKg === null || r.reps === null) {
      return { date: r.date, text: renderTemplate('BI-05', base) };
    }
    const e1rm = estimated1RM(r.loadKg, r.reps);
    return {
      date: r.date,
      text: renderTemplate('BI-04', {
        ...base,
        carga: formatLoad(r.loadKg, usesEquipment(r.exerciseCode)),
        reps: r.reps,
        e1rm: e1rm === null ? '' : e1rmSuffix(Math.round(e1rm)),
      }),
    };
  });
  await deps.events.emit(
    'achievement_log_viewed',
    { userId: user.id, timezone: user.timezone },
    {},
  );
  const all = [...achievements, ...records];
  if (all.length === 0) return [{ text: renderTemplate('BI-02'), buttons: [] }];
  // Orden estable: a la misma fecha, los logros antes que los récords.
  const shown = [...all]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-PARAMETERS.progress.logbookEntriesShown);
  return [
    {
      text: [renderTemplate('BI-01', { total: all.length }), ...shown.map((l) => l.text)].join(
        '\n',
      ),
      buttons: [],
    },
  ];
}
