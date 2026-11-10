import { addDays, type LocalDate } from '../time/zoned.js';
import { isDayClosable } from './day.js';

/**
 * Marca de cada día en la semana en una línea (HU-005-1, DC-03). El símbolo de
 * cada marca vive en el paquete `content`; aquí solo se decide cuál toca.
 *
 * - `COMPLETE`: el día cuenta y es completo (RN-DQC-004).
 * - `COUNTED`: el día cuenta (RN-DQC-002, RN-DQC-003).
 * - `PENDING`: hoy, o un día pasado que no cuenta pero sigue en su gracia (RN-DQC-005).
 * - `MISSED`: día pasado, ya sin gracia, que no contó (o que salvó un comodín).
 *   Es una marca neutra: fallar no castiga (constitución I).
 * - `FUTURE`: todavía no llega.
 */
export const WEEK_MARKS = ['COMPLETE', 'COUNTED', 'PENDING', 'MISSED', 'FUTURE'] as const;
export type WeekMark = (typeof WEEK_MARKS)[number];

export interface WeekLineDay {
  readonly date: LocalDate;
  readonly counted: boolean;
  readonly complete: boolean;
}

const WEEK_LENGTH = 7;

/**
 * RN-DQC-002 a RN-DQC-005: marcas de los 7 días de la semana que empieza en
 * `weekStart`, con lo registrado en `days` (un día sin registro no cuenta).
 */
export function weekMarks(
  weekStart: LocalDate,
  days: readonly WeekLineDay[],
  today: LocalDate,
  now: Date,
  timeZone: string,
): WeekMark[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return Array.from({ length: WEEK_LENGTH }, (_, offset) => {
    const date = addDays(weekStart, offset);
    if (date > today) return 'FUTURE';
    const day = byDate.get(date);
    if (day?.counted) return day.complete ? 'COMPLETE' : 'COUNTED';
    if (date === today || !isDayClosable(date, now, timeZone)) return 'PENDING';
    return 'MISSED';
  });
}
