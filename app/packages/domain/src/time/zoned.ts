/**
 * Fechas locales y zonas horarias sin E/S (Intl es puro: no lee el reloj).
 * Una `LocalDate` es 'AAAA-MM-DD' en la zona del usuario; una hora local, 'HH:MM'.
 * En la base todo va en UTC (.claude/rules/datos-y-seguridad.md).
 */

export type LocalDate = string;
export type LocalTime = string;

export type Weekday =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const WEEKDAYS: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let result = formatters.get(timeZone);
  if (!result) {
    result = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, result);
  }
  return result;
}

/** Fecha y hora de pared de un instante en una zona. */
export function localParts(instant: Date, timeZone: string): LocalParts {
  const parts = Object.fromEntries(
    formatter(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
  return {
    year: parts['year'] ?? 0,
    month: parts['month'] ?? 0,
    day: parts['day'] ?? 0,
    hour: parts['hour'] ?? 0,
    minute: parts['minute'] ?? 0,
    second: parts['second'] ?? 0,
  };
}

/** Desfase de la zona en ese instante, en milisegundos (hora local − UTC). */
function offsetMs(instant: Date, timeZone: string): number {
  const p = localParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

function parseDate(date: LocalDate): [number, number, number] {
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number);
  return [year, month, day];
}

function parseTime(time: LocalTime): [number, number] {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return [hour, minute];
}

/** Instante UTC de una fecha y hora de pared en una zona (ajusta por horario de verano). */
export function zonedTimeToInstant(date: LocalDate, time: LocalTime, timeZone: string): Date {
  const [year, month, day] = parseDate(date);
  const [hour, minute] = parseTime(time);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const first = wallAsUtc - offsetMs(new Date(wallAsUtc), timeZone);
  const second = wallAsUtc - offsetMs(new Date(first), timeZone);
  return new Date(second);
}

export function toLocalDate(year: number, month: number, day: number): LocalDate {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [year, month, day] = parseDate(date);
  return toLocalDate(year, month, day + days);
}

/** Días de `from` a `to` (positivo si `to` es posterior). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  const [y1, m1, d1] = parseDate(from);
  const [y2, m2, d2] = parseDate(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function weekdayOf(date: LocalDate): Weekday {
  const [year, month, day] = parseDate(date);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? 'sunday';
}

/** Minutos desde la medianoche de una hora 'HH:MM'. */
export function minutesOfDay(time: LocalTime): number {
  const [hour, minute] = parseTime(time);
  return hour * 60 + minute;
}
