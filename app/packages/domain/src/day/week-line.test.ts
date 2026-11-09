import { describe, expect, it } from 'vitest';
import { zonedTimeToInstant } from '../time/zoned.js';
import { weekMarks } from './week-line.js';

const TZ = 'America/Bogota';
const MONDAY = '2026-11-02';

describe('RN-DQC-004 · semana en una línea (HU-005-1)', () => {
  it('marca ⭐ el día completo, ✅ el que cuenta y deja el futuro sin marcar', () => {
    const now = zonedTimeToInstant('2026-11-04', '20:00', TZ); // miércoles
    const marks = weekMarks(
      MONDAY,
      [
        { date: '2026-11-02', counted: true, complete: false },
        { date: '2026-11-03', counted: true, complete: true },
      ],
      '2026-11-04',
      now,
      TZ,
    );
    expect(marks).toEqual([
      'COUNTED',
      'COMPLETE',
      'PENDING',
      'FUTURE',
      'FUTURE',
      'FUTURE',
      'FUTURE',
    ]);
  });
});

describe('RN-DQC-005 · línea de la semana durante la gracia', () => {
  it('ayer sin contar sigue pendiente hasta el fin de la gracia y luego queda neutro', () => {
    const days = [{ date: '2026-11-02', counted: false, complete: false }];
    const inGrace = zonedTimeToInstant('2026-11-03', '11:59', TZ);
    const afterGrace = zonedTimeToInstant('2026-11-03', '12:00', TZ);
    expect(weekMarks(MONDAY, days, '2026-11-03', inGrace, TZ)[0]).toBe('PENDING');
    expect(weekMarks(MONDAY, days, '2026-11-03', afterGrace, TZ)[0]).toBe('MISSED');
  });

  it('un día pasado sin ningún registro tampoco cuenta', () => {
    const now = zonedTimeToInstant('2026-11-08', '09:00', TZ); // domingo
    const marks = weekMarks(MONDAY, [], '2026-11-08', now, TZ);
    expect(marks.slice(0, 5)).toEqual(['MISSED', 'MISSED', 'MISSED', 'MISSED', 'MISSED']);
    expect(marks.slice(5)).toEqual(['PENDING', 'PENDING']);
  });
});
