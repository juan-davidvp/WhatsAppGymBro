import {
  addDays,
  closePlayerDay,
  evaluateDay,
  initialPlayerState,
  lastClosableDate,
  loggingGraceEnd,
  nextWeekStreak,
  operationalDate,
  weekStartOf,
  type DayStatus,
  type DayType,
  type LocalDate,
  type PlayerDayResult,
  type PlayerState,
} from '@gymbro/domain';
import { MOBILITY_SOURCE, NUTRITION_HALF_SOURCE, dayInputsFrom } from '../days/day-status.js';
import { hadRiskSignal } from '../days/risk.js';
import { grantXp } from '../days/xp.js';
import type { DaySource } from '../events/schema.js';
import { plannedDayType } from '../plans/weekly-plan.js';
import type { StreakStatesRepository, UserRecord, UsersRepository } from '../ports/repositories.js';
import { closeDayAchievements } from '../days/achievements.js';
import { announceWeek, evaluateClosedWeek } from './close-week.js';
import { ensureWeekQuests, evaluateQuests, type QuestDeps } from './quests.js';

/**
 * Cierre programado del día (T-060, T-061, FR-005-02). Cada ciclo cierra, en
 * orden, los días de cada usuario cuya gracia terminó (RN-DQC-005): evalúa el
 * día con lo registrado, lo guarda cerrado y aplica el juego en el dominio
 * (total, racha, comodines, reparación y regreso: `closePlayerDay`). El estado
 * se guarda con su versión, así que cerrar dos veces no cambia nada. Un día sin
 * registros también se cierra: no cuenta, pero no resta.
 */

export interface CloseDaysDeps extends QuestDeps {
  users: UsersRepository;
  streaks: StreakStatesRepository;
}

/** Cierra los días vencidos de todos los usuarios activos; devuelve cuántos cerró. */
export async function closeDueDays(deps: CloseDaysDeps): Promise<number> {
  const now = deps.clock();
  let closed = 0;
  for (const user of await deps.users.listActive()) {
    closed += await closeUserDays(user, now, deps);
  }
  return closed;
}

/** Días por cerrar: desde el siguiente al último cerrado (o el día del onboarding) hasta el último vencido. */
export async function closeUserDays(
  user: UserRecord,
  now: Date,
  deps: CloseDaysDeps,
): Promise<number> {
  const completedAt = user.onboarding.completedAt;
  if (!completedAt) return 0;
  const stored = await deps.streaks.get(user.id);
  let state: PlayerState = stored?.state ?? initialPlayerState();
  let rev = stored?.rev ?? 0;
  const lastClosed = state.counted.lastClosedDate;
  const first = lastClosed ? addDays(lastClosed, 1) : operationalDate(completedAt, user.timezone);
  const until = lastClosableDate(now, user.timezone);
  let closed = 0;
  for (let date = first; date <= until; date = addDays(date, 1)) {
    const day = await finalDay(user, date, now, deps);
    const result = closePlayerDay(state, {
      date,
      type: day.type,
      counted: day.status.counts,
      closedAt: loggingGraceEnd(date, user.timezone),
      riskPaused: day.riskPaused,
    });
    if (!result.applied) continue;
    // RN-GAM-004: el domingo cierra también la semana; su racha se guarda con el día.
    const week = await evaluateClosedWeek(user, date, deps);
    const next: PlayerState = week
      ? {
          ...result.state,
          weekStreak: nextWeekStreak(result.state.weekStreak, week.result, day.riskPaused),
        }
      : result.state;
    // Si otro proceso guardó antes (cambió `rev`), este ciclo se detiene; el siguiente sigue.
    if (!(await deps.streaks.save(user.id, rev, next))) return closed;
    const before = state;
    state = next;
    rev += 1;
    closed += 1;
    await announce(user, date, day, result, now, deps);
    // T-063: misiones de la semana del día, cierre de la semana, logros y misiones de la siguiente.
    await evaluateQuests(user, date, deps);
    if (week) await announceWeek(user, date, week, day.riskPaused, deps);
    await closeDayAchievements(user, date, before, next, deps);
    await ensureWeekQuests(user, weekStartOf(addDays(date, 1)), deps);
  }
  return closed;
}

interface FinalDay {
  readonly type: DayType;
  readonly status: DayStatus;
  readonly sources: readonly string[];
  readonly riskPaused: boolean;
}

/** Evalúa el día con lo registrado y lo guarda cerrado (RN-DQC-002 a 005). */
async function finalDay(
  user: UserRecord,
  date: LocalDate,
  now: Date,
  deps: CloseDaysDeps,
): Promise<FinalDay> {
  // El tipo con el que se registró manda (lo que vio el usuario); si no hay registro, el del plan.
  const type: DayType =
    (await deps.days.dayType(user.id, date)) ?? (await plannedDayType(user, date, deps));
  const sources = await deps.days.sources(user.id, date);
  const status = evaluateDay(dayInputsFrom(type, sources));
  await deps.days.close(user.id, date, type, status, now);
  return { type, status, sources, riskPaused: await hadRiskSignal(user, date, deps) };
}

/** Eventos de medición del cierre y avisos para la próxima interacción. */
async function announce(
  user: UserRecord,
  date: LocalDate,
  day: FinalDay,
  result: PlayerDayResult,
  now: Date,
  deps: CloseDaysDeps,
): Promise<void> {
  const subject = { userId: user.id, timezone: user.timezone };
  const { streak, counted } = result.state;
  await deps.events.emit('day_closed', subject, {
    date,
    dayType: day.type,
    counted: day.status.counts,
    complete: day.status.complete,
    source: countingSource(day.status, day.sources),
  });
  const props = {
    streak_extended: { streak: streak.current },
    freeze_earned: { freezes: streak.freezes },
    freeze_used: { freezes: streak.freezes, streak: streak.current },
    streak_reset: {},
    streak_repair_offered: {},
    streak_repaired: { streak: streak.current },
  } as const;
  for (const event of result.events) await deps.events.emit(event, subject, props[event]);
  // RN-GAM-013 (HU-005-4): el primer día que cuenta tras un día de entreno no cumplido.
  const comebackXp = result.comebackBonus
    ? await grantXp(user, date, { type: 'COMEBACK' }, `comeback:${date}`, deps)
    : 0;

  // FR-005-06 y FR-005-07: sin juego desactivado ni señal de riesgo ese día.
  if (!user.settings.gamificationEnabled || day.riskPaused) return;
  const notice = (templateId: string, variables: Record<string, number>) =>
    deps.notices.add(user.id, {
      key: `${templateId}:${date}`,
      templateId,
      variables,
      createdAt: now,
    });
  if (result.events.includes('freeze_used')) {
    await notice('RA-01', { racha: streak.current, comodines: streak.freezes });
  }
  if (result.events.includes('streak_repair_offered')) {
    await notice('RA-02', { total: counted.total });
  }
  if (comebackXp > 0) await notice('BR-01', { xp: comebackXp });
}

/** Qué hizo contar el día, para `day_closed.source` (RN-DQC-002, RN-DQC-003). */
function countingSource(status: DayStatus, sources: readonly string[]): DaySource {
  if (!status.counts) return 'none';
  if (status.trainingHalf) return 'session';
  if (sources.includes(NUTRITION_HALF_SOURCE)) return 'nutrition';
  if (sources.includes(MOBILITY_SOURCE)) return 'mobility';
  return 'none';
}
