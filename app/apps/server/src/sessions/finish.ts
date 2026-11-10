import { SESSION_NAMES, renderTemplate, templateById } from '@gymbro/content';
import {
  addDays,
  isSessionCompleted,
  loggingGraceEnd,
  logSessionAsPlanned,
  operationalDate,
  plannedSetCount,
  weekStartOf,
  type LocalDate,
  type LoggedEntry,
  type SessionExercise,
  type SessionVariant,
} from '@gymbro/domain';
import { recordDayActivity, sessionSource } from '../days/day-status.js';
import { button, plain, type Reply } from '../onboarding/replies.js';
import { ensureWeek } from '../plans/weekly-plan.js';
import type { UserRecord, WorkoutSessionRecord } from '../ports/repositories.js';
import type { TrainingDeps } from './deps.js';
import { checkRecord } from './records.js';

/**
 * Terminar una sesión (T-043, HU-003-2/3): completada si llega a P-023 de sus
 * series (o toda la exprés, RN-ENT-004), parcial si no. Completada, el día se
 * evalúa y el mensaje dice el n.º del día que cuenta y la racha (SE-01/02/03);
 * parcial, se recuerda sin reproche que la exprés también cuenta (SE-04).
 */

/** Texto extra del fin de sesión (récords, T-044). */
export type FinishExtras = (session: WorkoutSessionRecord) => Promise<string>;

const FINISH_TEMPLATE: Readonly<Record<SessionVariant, string>> = {
  GYM: 'SE-01',
  HOME: 'SE-02',
  EXPRESS: 'SE-03',
};

export async function finishSession(
  session: WorkoutSessionRecord,
  user: UserRecord,
  deps: TrainingDeps,
  extras: FinishExtras = () => Promise.resolve(''),
): Promise<Reply[]> {
  const now = deps.clock();
  const planned = plannedSetCount(session.progress);
  const logged = session.progress.logged.length;
  const completed = isSessionCompleted({
    variant: session.variant,
    plannedSets: planned,
    loggedSets: logged,
  });
  const updated = await deps.workouts.update(session.id, session.rev, {
    status: completed ? 'completed' : 'partial',
    endedAt: now,
  });
  if (!updated) return [];
  const subject = { userId: user.id, timezone: user.timezone };

  if (!completed) {
    await deps.events.emit('session_partial', subject, { variant: session.variant, sets: logged });
    return [{ ...plain('SE-04', { series: logged }), edit: true }];
  }
  const result = await recordDayActivity(
    user,
    session.date,
    'TRAINING',
    sessionSource(session.id),
    deps,
  );
  await deps.events.emit('session_completed', subject, {
    variant: session.variant,
    sets: logged,
    durationMin: Math.round((now.getTime() - session.startedAt.getTime()) / 60_000),
  });
  const template = FINISH_TEMPLATE[session.variant];
  const variables: Record<string, string | number> = { n: result.total, racha: result.streak };
  if (template !== 'SE-03') variables['series'] = logged;
  if (template === 'SE-01') variables['record_txt'] = await extras(updated);
  return [{ ...plain(template, variables), edit: true }];
}

/** HU-003-2: "La hice tal cual" registra todas las series como estaban planeadas, en 1 toque. */
export async function logAsPlanned(
  session: WorkoutSessionRecord,
  user: UserRecord,
  deps: TrainingDeps,
  extras?: FinishExtras,
): Promise<Reply[]> {
  if (session.progress.logged.length > 0) return [];
  const planned = session.progress.exercises.flatMap((e: SessionExercise, exerciseIndex) =>
    Array.from({ length: e.sets }, (_, setIndex) => ({
      exerciseIndex,
      exerciseCode: e.exerciseCode,
      setIndex,
      reps: e.targetReps,
      loadKg: e.loadKg,
    })),
  );
  const loggedSets = logSessionAsPlanned(planned);
  const logged: LoggedEntry[] = loggedSets.map((set, i) => ({
    ...set,
    exerciseIndex: planned[i]?.exerciseIndex ?? 0,
  }));
  const updated = await deps.workouts.update(session.id, session.rev, {
    loggedAsPlanned: true,
    progress: { ...session.progress, cursor: null, logged },
  });
  if (!updated) return [];
  const now = deps.clock();
  for (const set of logged) {
    await deps.setEntries.record({
      userId: user.id,
      sessionId: session.id,
      exerciseCode: set.exerciseCode,
      setIndex: set.setIndex,
      reps: set.reps,
      loadKg: set.loadKg,
      edited: false,
      confirmedAt: now,
    });
    await checkRecord(user, updated, set, deps);
  }
  await deps.events.emit(
    'session_logged_as_planned',
    { userId: user.id, timezone: user.timezone },
    { variant: session.variant, sets: logged.length },
  );
  return finishSession(updated, user, deps, extras);
}

// ── Ayer, dentro de la gracia de registro (RN-DQC-005, FR-003-05) ────────────

/** Versión que se registra "tal cual" sin tarjeta: la del lugar habitual. */
function usualVariant(user: UserRecord): SessionVariant {
  return user.profile.place === 'home' ? 'HOME' : 'GYM';
}

/** Sesión planeada de ayer que todavía se puede registrar, si la hay. */
export async function pendingYesterday(user: UserRecord, deps: TrainingDeps) {
  const now = deps.clock();
  const yesterday: LocalDate = addDays(operationalDate(now, user.timezone), -1);
  if (now.getTime() >= loggingGraceEnd(yesterday, user.timezone).getTime()) return null;
  const week = await ensureWeek(user, weekStartOf(yesterday), deps);
  const day = week?.days.find((d) => d.date === yesterday);
  if (!day?.session) return null;
  const sessions = await deps.workouts.onDate(user.id, yesterday);
  if (sessions.some((s) => s.status === 'completed')) return null;
  return { date: yesterday, session: day.session };
}

export async function yesterdayPrompt(user: UserRecord, deps: TrainingDeps): Promise<Reply[]> {
  const pending = await pendingYesterday(user, deps);
  if (!pending) return [];
  const [label = ''] = templateById('HY-04').buttons;
  return [
    {
      text: renderTemplate('HY-04', { sesion: SESSION_NAMES[pending.session.template] }),
      buttons: [button(label, { action: 'td', value: 'asis_yesterday' })],
    },
  ];
}

export async function logYesterdayAsPlanned(
  user: UserRecord,
  deps: TrainingDeps,
  extras?: FinishExtras,
): Promise<Reply[]> {
  const pending = await pendingYesterday(user, deps);
  if (!pending) return [];
  const variant = usualVariant(user);
  const session = await deps.workouts.create({
    userId: user.id,
    date: pending.date,
    plannedSessionId: pending.session.id,
    template: pending.session.template,
    variant,
    status: 'active',
    startedAt: deps.clock(),
    endedAt: null,
    loggedAsPlanned: false,
    progress: {
      exercises: pending.session.versions[variant].exercises.map((e) => ({
        exerciseCode: e.exerciseCode,
        pattern: e.pattern,
        sets: e.sets,
        targetReps: e.targetReps,
        loadKg: e.loadKg,
      })),
      cursor: null,
      pending: { reps: 0, loadKg: 0 },
      logged: [],
    },
    lastConfirmedAt: null,
    pendingTaps: 0,
  });
  return (await logAsPlanned(session, user, deps, extras)).map((r) => ({ ...r, edit: false }));
}
