import { LEVELS } from '@gymbro/content';
import { awardXp, levelForXp, type LocalDate, type XpEvent } from '@gymbro/domain';
import type { EventEmitter } from '../events/emitter.js';
import type {
  AchievementsRepository,
  NoticesRepository,
  RiskSignalsRepository,
  UserRecord,
  XpLedgerRepository,
} from '../ports/repositories.js';
import { hadRiskSignal } from './risk.js';

/**
 * XP y niveles (T-062, HU-005-3). Cada hecho que da XP tiene una clave (`refId`):
 * el mismo hecho no suma dos veces. El monto sale de la tabla P-038 con el tope
 * diario P-039 del día operativo al que se suma (RN-GAM-005, RN-DQC-006); un día
 * con señal de riesgo no da XP (FR-005-07). El XP nunca baja (RN-GAM-006): solo
 * se insertan movimientos positivos.
 */

export interface XpDeps {
  xp: XpLedgerRepository;
  achievements: AchievementsRepository;
  notices: NoticesRepository;
  riskSignals: RiskSignalsRepository;
  events: EventEmitter;
  clock: () => Date;
}

/** Suma el XP del evento al día `date`; devuelve el monto sumado (0 si no sumó). */
export async function grantXp(
  user: UserRecord,
  date: LocalDate,
  event: XpEvent,
  refId: string,
  deps: XpDeps,
): Promise<number> {
  const paused = await hadRiskSignal(user, date, deps);
  const entry = awardXp(await deps.xp.onDate(user.id, date), { date, event, paused });
  if (entry.amount <= 0) return 0;
  const before = await deps.xp.total(user.id);
  const now = deps.clock();
  const { inserted } = await deps.xp.add(user.id, { ...entry, refId, at: now });
  if (!inserted) return 0;
  const subject = { userId: user.id, timezone: user.timezone };
  await deps.events.emit('xp_awarded', subject, { event: entry.event, amount: entry.amount });
  await levelUp(user, before, before + entry.amount, now, deps);
  return entry.amount;
}

/** RN-GAM-007: al cruzar un umbral de P-040 sube de nivel y se registra el logro. */
async function levelUp(
  user: UserRecord,
  before: number,
  after: number,
  now: Date,
  deps: XpDeps,
): Promise<void> {
  const from = levelForXp(before);
  const to = levelForXp(after);
  if (to <= from) return;
  const level = LEVELS[to - 1];
  if (!level) return;
  const subject = { userId: user.id, timezone: user.timezone };
  await deps.events.emit('level_up', subject, { level: to });
  const { added } = await deps.achievements.appendOnce({
    userId: user.id,
    code: level.code,
    at: now,
    value: to,
    context: null,
  });
  if (added) await deps.events.emit('achievement_unlocked', subject, { code: level.code });
  if (user.settings.gamificationEnabled) {
    await deps.notices.add(user.id, {
      key: `level:${level.code}`,
      templateId: 'RE-02',
      variables: { nivel: to, nombre_nivel: level.name },
      createdAt: now,
    });
  }
}
