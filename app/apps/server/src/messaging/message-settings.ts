import {
  NO_PURPOSES_OFF,
  PURPOSE_NAMES,
  renderTemplate,
  templateById,
  type NamedPurpose,
} from '@gymbro/content';
import { PARAMETERS, type Intensity } from '@gymbro/domain';
import type { CallbackAction } from '../bot/callback-data.js';
import type { EventEmitter } from '../events/emitter.js';
import { quietHoursLabel } from '../onboarding/profile-steps.js';
import { button, type Reply } from '../onboarding/replies.js';
import type { UserRecord, UsersRepository } from '../ports/repositories.js';

/**
 * `/ajustes` de mensajes (T-073, HU-007-4 escenario 2): cantidad (intensidad,
 * RN-MSJ-002), horas de silencio (RN-MSJ-004, P-047 y P-086) y tipos encendidos
 * (RN-MSJ-001). El motor lo respeta desde la siguiente evaluación porque lee los
 * ajustes al enviar. Por ahora `/ajustes` abre directo esta pantalla (PO, 2026-11-11).
 */

export interface MessageSettingsDeps {
  users: UsersRepository;
  events: EventEmitter;
  clock: () => Date;
}

type Settings = UserRecord['settings'];

const aj = (value: string): CallbackAction => ({ action: 'aj', value });
/** En el orden de los botones de ON-22: [Poco] [Normal] [Más]. */
const INTENSITIES: readonly Intensity[] = ['LOW', 'NORMAL', 'HIGH'];
const QUIET_OPTIONS = [PARAMETERS.messages.quietHours, ...PARAMETERS.messages.quietHoursOptions];
const PURPOSES = Object.keys(PURPOSE_NAMES) as NamedPurpose[];
/** [Me sirve] de ON-23 (deja la franja como está), igual que en el onboarding. */
const KEEP_QUIET_HOURS = 'Me sirve';

const isEnabled = (settings: Settings, purpose: NamedPurpose) =>
  settings.purposesEnabled?.[purpose] !== false;

/** AJ-01: cómo están los mensajes, con [Cantidad] [Silencio] [Tipos]. */
export function settingsScreen(settings: Settings, edit = false): Reply {
  const labels = templateById('ON-22').buttons;
  const off = PURPOSES.filter((p) => !isEnabled(settings, p)).map((p) => PURPOSE_NAMES[p]);
  const [amount = '', quiet = '', types = ''] = templateById('AJ-01').buttons;
  return {
    text: renderTemplate('AJ-01', {
      intensidad: labels[INTENSITIES.indexOf(settings.intensity)] ?? '',
      inicio: settings.quietHours.start,
      fin: settings.quietHours.end,
      apagados: off.length > 0 ? off.join(', ') : NO_PURPOSES_OFF,
    }),
    buttons: [button(amount, aj('amount')), button(quiet, aj('quiet')), button(types, aj('types'))],
    rowSize: 3,
    ...(edit ? { edit } : {}),
  };
}

function amountScreen(): Reply {
  const labels = templateById('ON-22').buttons;
  return {
    text: renderTemplate('ON-22'),
    buttons: labels.map((label, i) => button(label, aj(`i${i}`))),
    rowSize: labels.length,
    edit: true,
  };
}

function quietScreen(settings: Settings): Reply {
  const current = quietHoursLabel(settings.quietHours);
  const others = QUIET_OPTIONS.map((range, i) => ({ label: quietHoursLabel(range), i })).filter(
    (o) => o.label !== current,
  );
  return {
    text: renderTemplate('ON-23', {
      inicio: settings.quietHours.start,
      fin: settings.quietHours.end,
    }),
    buttons: [
      button(KEEP_QUIET_HOURS, aj('menu')),
      ...others.map((o) => button(o.label, aj(`q${o.i}`))),
    ],
    edit: true,
  };
}

/** AJ-02: un botón por tipo con ✅ o ⬜, y [Listo]. */
function typesScreen(settings: Settings): Reply {
  const [done = ''] = templateById('AJ-02').buttons;
  return {
    text: renderTemplate('AJ-02'),
    buttons: [
      ...PURPOSES.map((p, i) =>
        button(`${isEnabled(settings, p) ? '✅' : '⬜'} ${PURPOSE_NAMES[p]}`, aj(`t${i}`)),
      ),
      button(done, aj('menu')),
    ],
    edit: true,
  };
}

const saved = (): Reply => ({ text: renderTemplate('AJ-03'), buttons: [], toast: true });

/** `/ajustes`. */
export function settingsCommand(user: UserRecord): Reply[] {
  return [settingsScreen(user.settings)];
}

/** Cambio de un ajuste: lo guarda, registra el campo y devuelve los ajustes nuevos. */
async function change(
  user: UserRecord,
  changes: Partial<Settings>,
  field: 'intensity' | 'quiet_hours' | 'purpose',
  deps: MessageSettingsDeps,
): Promise<Settings> {
  await deps.users.updateSettings(user.id, changes);
  await deps.events.emit(
    'message_settings_changed',
    { userId: user.id, timezone: user.timezone },
    { field },
  );
  return { ...user.settings, ...changes };
}

/** Botones de AJ-01, AJ-02, ON-22 y ON-23 dentro de `/ajustes`. */
export async function answerSettings(
  user: UserRecord,
  value: string,
  deps: MessageSettingsDeps,
): Promise<Reply[]> {
  const settings = user.settings;
  if (value === 'amount') return [amountScreen()];
  if (value === 'quiet') return [quietScreen(settings)];
  if (value === 'types') return [typesScreen(settings)];

  const [kind, index] = [value.charAt(0), Number(value.slice(1))];
  const intensity = kind === 'i' ? INTENSITIES[index] : undefined;
  if (intensity) {
    const next = await change(user, { intensity }, 'intensity', deps);
    return [saved(), settingsScreen(next, true)];
  }
  const quietHours = kind === 'q' ? QUIET_OPTIONS[index] : undefined;
  if (quietHours) {
    const next = await change(user, { quietHours }, 'quiet_hours', deps);
    return [saved(), settingsScreen(next, true)];
  }
  const purpose = kind === 't' ? PURPOSES[index] : undefined;
  if (purpose) {
    const purposesEnabled = {
      ...settings.purposesEnabled,
      [purpose]: !isEnabled(settings, purpose),
    };
    const next = await change(user, { purposesEnabled }, 'purpose', deps);
    return [saved(), typesScreen(next)];
  }
  return [settingsScreen(settings, true)];
}
