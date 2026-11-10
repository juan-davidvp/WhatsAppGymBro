import { addDays, operationalDayStart, type LocalDate } from '@gymbro/domain';
import type { RiskSignalsRepository, UserRecord } from '../ports/repositories.js';

/** RN-SEG-007 y FR-005-07: ¿hubo una señal de riesgo en el día operativo `date`? */
export async function hadRiskSignal(
  user: UserRecord,
  date: LocalDate,
  deps: { riskSignals: RiskSignalsRepository },
): Promise<boolean> {
  const from = operationalDayStart(date, user.timezone);
  const to = operationalDayStart(addDays(date, 1), user.timezone);
  return (await deps.riskSignals.instantsBetween(user.id, from, to)).length > 0;
}
