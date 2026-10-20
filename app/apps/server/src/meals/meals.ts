import {
  FAVORITE_DELETE_PREFIX,
  FAVORITE_EDIT_PREFIX,
  FOODS,
  FREQUENT_MEAL_TEMPLATES,
  proteinBar,
  renderTemplate,
  templateById,
  type Amount,
} from '@gymbro/content';
import {
  PARAMETERS,
  addDays,
  adjustPortion,
  dailyProteinGoal,
  evaluateDay,
  hasPortions,
  isNutritionHalfMet,
  localParts,
  loggingGraceEnd,
  operationalDate,
  palmsFromProtein,
  proteinFromPortions,
  rotatingPick,
  toLocalDate,
  WEEK_DAYS,
  weekdayOf,
  weekStartOf,
  zonedTimeToInstant,
  type DayType,
  type HandPortion,
  type LocalDate,
  type MealMethod,
  type Portions,
} from '@gymbro/domain';
import { mealIdempotencyKey } from '../adapters/mongo/idempotency.js';
import { NUTRITION_HALF_SOURCE, dayInputsFrom, recordDayActivity } from '../days/day-status.js';
import { button, plain, type Button, type Reply } from '../onboarding/replies.js';
import { ensureWeek } from '../plans/weekly-plan.js';
import type {
  BodyMeasurementsRepository,
  FavoriteMealRecord,
  FavoriteMealsRepository,
  MealRecord,
  MealsRepository,
  UserRecord,
} from '../ports/repositories.js';
import type { TrainingDeps } from '../sessions/deps.js';
import {
  EMPTY_DRAFT,
  decodeDraft,
  encodeDraft,
  fromRecordPortions,
  toRecordPortions,
  type MealDraft,
} from './draft.js';

/**
 * `🍽️ Comida` (SPEC-004, T-050 a T-052): registrar por porciones con la mano,
 * frecuentes en 1 toque, plantillas y "repetir ayer"; después, la barra de
 * proteína del día y, si la mitad de comida hace contar o completa el día, el
 * día en vivo (RN-DQC-003/004). Sin calorías (RN-NUT-007).
 */

export interface MealDeps extends TrainingDeps {
  meals: MealsRepository;
  favorites: FavoriteMealsRepository;
  bodyMeasurements: BodyMeasurementsRepository;
}

/** El toque que llega del adaptador: identifica el botón y cuándo se abrió el mensaje. */
export interface MealTap {
  readonly chatId: number;
  readonly messageId: number;
  readonly messageDate: Date;
  readonly data: string;
}

const HANDS: readonly HandPortion[] = ['PALM', 'CUPPED_HAND', 'FIST', 'THUMB'];
/** Letra de cada mano en las operaciones del teclado (`pp` = +palma, `pm` = −palma…). */
const HAND_LETTER: Readonly<Record<HandPortion, string>> = {
  PALM: 'p',
  CUPPED_HAND: 'c',
  FIST: 'f',
  THUMB: 't',
};

const formatNumber = (n: number) => String(n).replace('.', ',');

const mealButton = (label: string, op: string, draft: MealDraft): Button =>
  button(label, { action: 'ml', op, state: encodeDraft(draft) });

function labels(id: string): readonly string[] {
  return templateById(id).buttons;
}

/** Valor bajo de un rango de porciones de una plantilla (decisión del PO, T-051). */
const low = (amount: Amount | undefined) =>
  amount === undefined ? 0 : typeof amount === 'number' ? amount : amount.min;

function templatePortions(index: number): Portions | null {
  const template = FREQUENT_MEAL_TEMPLATES[index];
  if (!template) return null;
  return Object.fromEntries(HANDS.map((h) => [h, low(template.portions[h])])) as Portions;
}

function favoriteName(portions: Portions): string {
  return renderTemplate('CM-17', {
    palma: formatNumber(portions.PALM ?? 0),
    mano: portions.CUPPED_HAND ?? 0,
    puno: portions.FIST ?? 0,
    pulgar: portions.THUMB ?? 0,
  });
}

// ── Fechas y tipo de día ──────────────────────────────────────────────────────

function todayOf(user: UserRecord, deps: MealDeps): LocalDate {
  return operationalDate(deps.clock(), user.timezone);
}

/** RN-DQC-005: ayer se puede registrar hasta el fin de la gracia (P-030). */
function inGrace(user: UserRecord, deps: MealDeps): boolean {
  const yesterday = addDays(todayOf(user, deps), -1);
  return deps.clock().getTime() < loggingGraceEnd(yesterday, user.timezone).getTime();
}

function mealDate(user: UserRecord, draft: MealDraft, deps: MealDeps): LocalDate {
  const today = todayOf(user, deps);
  return draft.yesterday && inGrace(user, deps) ? addDays(today, -1) : today;
}

async function dayTypeOn(user: UserRecord, date: LocalDate, deps: MealDeps): Promise<DayType> {
  const week = await ensureWeek(user, weekStartOf(date), deps);
  return week?.days.find((d) => d.date === date)?.type ?? 'REST';
}

// ── CM-01 / CM-02 ─────────────────────────────────────────────────────────────

/** T-052 · HU-004-6: día de entreno, antes de la hora habitual → CM-15. */
async function preWorkoutSuggestion(user: UserRecord, deps: MealDeps): Promise<Reply[]> {
  const slot = user.profile.timeSlot;
  if (!slot) return [];
  const today = todayOf(user, deps);
  if ((await dayTypeOn(user, today, deps)) !== 'TRAINING') return [];
  const now = deps.clock();
  const local = localParts(now, user.timezone);
  const calendarDate = toLocalDate(local.year, local.month, local.day);
  const start = PARAMETERS.habit.timeSlotStarts[slot];
  if (now.getTime() >= zonedTimeToInstant(calendarDate, start, user.timezone).getTime()) return [];
  const cheapProtein = FOODS.filter((f) => f.countsForProtein && f.relativeCost === '$');
  const foods = rotatingPick(cheapProtein, WEEK_DAYS.indexOf(weekdayOf(today))).map(
    (f) => f.name.charAt(0).toLocaleLowerCase('es') + f.name.slice(1),
  );
  return [plain('CM-15', { alimentos: foods.join(', ') })];
}

async function menu(user: UserRecord, draft: MealDraft, deps: MealDeps): Promise<Reply> {
  const id = draft.yesterday ? 'CM-02' : 'CM-01';
  const favorites = (await deps.favorites.list(user.id)).slice(
    0,
    PARAMETERS.nutrition.maxFavoriteButtons,
  );
  const base = { ...draft, portions: {}, ref: null };
  const favoriteButtons = favorites.map((f) =>
    mealButton(f.name, 'fv', { ...base, ref: `f${f.id}` }),
  );
  const [portionsLabel = '', templatesLabel = '', ...rest] = labels(id);
  const hasYesterdayMeals =
    !draft.yesterday &&
    (await deps.meals.onDate(user.id, addDays(todayOf(user, deps), -1))).length > 0;
  const optional: Button[] = [];
  for (const label of rest) {
    if (label === labels('CM-01')[2] && hasYesterdayMeals) {
      optional.push(mealButton(label, 'ry', base));
    } else if (label === labels('CM-01')[3] && favorites.length > 0) {
      optional.push(mealButton(label, 'ed', base));
    } else if (label === labels('CM-01')[4] && inGrace(user, deps)) {
      optional.push(mealButton(label, 'dy', base));
    } else if (label === labels('CM-02')[3]) {
      optional.push(mealButton(label, 'dt', base));
    }
  }
  const buttons = [
    ...favoriteButtons,
    mealButton(portionsLabel, 'kb', base),
    mealButton(templatesLabel, 'tl', base),
    ...optional,
  ];
  const favoriteRows = Array.from({ length: Math.ceil(favoriteButtons.length / 2) }, (_, i) =>
    Math.min(2, favoriteButtons.length - i * 2),
  );
  return {
    text: renderTemplate(id),
    buttons,
    layout: [...favoriteRows, 2, ...optional.map(() => 1)],
  };
}

/** `🍽️ Comida`: sugerencia antes de entrenar (si toca) y CM-01. */
export async function mealMenu(user: UserRecord, deps: MealDeps): Promise<Reply[]> {
  if (!user.onboarding.completedAt) return [plain('PN-04')];
  return [...(await preWorkoutSuggestion(user, deps)), await menu(user, EMPTY_DRAFT, deps)];
}

// ── CM-03 ─────────────────────────────────────────────────────────────────────

function keyboard(draft: MealDraft): Reply {
  const p = draft.portions;
  const [...keys] = labels('CM-03');
  const adjustButtons = HANDS.flatMap((hand, i) => [
    mealButton(keys[i * 2] ?? '', `${HAND_LETTER[hand]}m`, draft),
    mealButton(keys[i * 2 + 1] ?? '', `${HAND_LETTER[hand]}p`, draft),
  ]);
  return {
    text: renderTemplate('CM-03', {
      palma: formatNumber(p.PALM ?? 0),
      mano: p.CUPPED_HAND ?? 0,
      puno: p.FIST ?? 0,
      pulgar: p.THUMB ?? 0,
    }),
    buttons: [
      ...adjustButtons,
      mealButton(keys[8] ?? '', 'sv', draft),
      mealButton(keys[9] ?? '', 'sf', draft),
    ],
    layout: [2, 2, 2, 2, 1, 1],
    edit: true,
  };
}

// ── Guardar y resumen ─────────────────────────────────────────────────────────

/** CM-04 a CM-07 y, si el día cambia, DC-01 o DC-02. */
async function afterMeal(
  user: UserRecord,
  date: LocalDate,
  deps: MealDeps,
  edit = true,
): Promise<Reply[]> {
  const meals = await deps.meals.onDate(user.id, date);
  const proteinG = meals.reduce((sum, m) => sum + m.proteinG, 0);
  const goal = dailyProteinGoal(await deps.bodyMeasurements.latestWeightKg(user.id));
  const numberFree = user.settings.numberFreeMode;
  const halfMet = numberFree
    ? isNutritionHalfMet({
        mode: 'number_free',
        meals: meals.map((m) => fromRecordPortions(m.portions)),
      })
    : isNutritionHalfMet({ mode: 'numbers', proteinG, targetG: goal.grams });

  const summary: Reply = {
    text: numberFree
      ? renderTemplate(halfMet ? 'CM-07' : 'CM-06')
      : renderTemplate(halfMet ? 'CM-05' : 'CM-04', {
          barra: proteinBar(proteinG / goal.grams),
          proteina: Math.round(proteinG),
          meta: Math.round(goal.grams),
          palmas: formatNumber(palmsFromProtein(proteinG)),
          meta_palmas: formatNumber(goal.palms),
        }),
    buttons: [],
    ...(edit ? { edit: true } : {}),
  };
  if (!halfMet) return [summary];

  const type = await dayTypeOn(user, date, deps);
  const sources = await deps.days.sources(user.id, date);
  if (sources.includes(NUTRITION_HALF_SOURCE)) return [summary];
  const before = evaluateDay(dayInputsFrom(type, sources));
  const after = await recordDayActivity(user, date, type, NUTRITION_HALF_SOURCE, deps);
  await deps.events.emit(
    'nutrition_half_completed',
    { userId: user.id, timezone: user.timezone },
    { mode: numberFree ? 'number_free' : 'numbers' },
  );
  const day: Reply[] = [];
  if (!before.counts && after.status.counts && type === 'REST') {
    day.push(plain('DC-01', { n: after.total, racha: after.streak }));
  }
  if (!before.complete && after.status.complete) day.push(plain('DC-02'));
  return [summary, ...day];
}

async function recordMeal(
  user: UserRecord,
  input: {
    date: LocalDate;
    method: MealMethod;
    portions: Portions;
    favoriteMealId: string | null;
    taps: number;
    key: string;
  },
  tap: MealTap,
  deps: MealDeps,
): Promise<boolean> {
  const now = deps.clock();
  const proteinG = proteinFromPortions(input.portions);
  const durationMs = Math.max(0, now.getTime() - tap.messageDate.getTime());
  const meal: MealRecord = {
    userId: user.id,
    date: input.date,
    loggedAt: now,
    method: input.method,
    portions: toRecordPortions(input.portions),
    proteinG,
    favoriteMealId: input.favoriteMealId,
    durationMs,
    taps: input.taps,
    idempotencyKey: input.key,
  };
  const { inserted } = await deps.meals.record(meal);
  if (inserted) {
    await deps.events.emit(
      'meal_logged',
      { userId: user.id, timezone: user.timezone },
      { method: input.method, durationMs, taps: input.taps, proteinG },
    );
  }
  return inserted;
}

const tapKey = (tap: MealTap) => mealIdempotencyKey(tap.chatId, tap.messageId, tap.data);

async function save(
  user: UserRecord,
  draft: MealDraft,
  asFavorite: boolean,
  tap: MealTap,
  deps: MealDeps,
): Promise<Reply[]> {
  if (!hasPortions(draft.portions)) return [{ ...plain('CM-14'), toast: true }];
  const date = mealDate(user, draft, deps);
  const inserted = await recordMeal(
    user,
    {
      date,
      method: 'portions',
      portions: draft.portions,
      favoriteMealId: null,
      taps: draft.taps,
      key: tapKey(tap),
    },
    tap,
    deps,
  );
  const extra: Reply[] = [];
  if (asFavorite && inserted) {
    const name = await saveFavorite(user, draft, deps);
    extra.push({ ...plain('CM-08', { nombre: name }), toast: true });
  }
  return [...(await afterMeal(user, date, deps)), ...extra];
}

/** RN-NUT-004: guarda la frecuente (o actualiza la que se estaba ajustando). */
async function saveFavorite(user: UserRecord, draft: MealDraft, deps: MealDeps): Promise<string> {
  const portions = toRecordPortions(draft.portions);
  const editing = draft.ref?.startsWith('f')
    ? await deps.favorites.byId(user.id, draft.ref.slice(1))
    : null;
  if (editing) {
    await deps.favorites.updatePortions(user.id, editing.id, portions);
    return editing.name;
  }
  const template = draft.ref?.startsWith('t')
    ? FREQUENT_MEAL_TEMPLATES[Number(draft.ref.slice(1))]
    : undefined;
  const name = template?.shortName ?? favoriteName(draft.portions);
  await deps.favorites.create({
    userId: user.id,
    name,
    portions,
    foodCodes: template ? [template.code] : [],
  });
  await deps.events.emit(
    'favorite_meal_saved',
    { userId: user.id, timezone: user.timezone },
    { fromTemplate: template !== undefined },
  );
  return name;
}

async function logFavorite(
  user: UserRecord,
  draft: MealDraft,
  tap: MealTap,
  deps: MealDeps,
): Promise<Reply[]> {
  const favorite = draft.ref?.startsWith('f')
    ? await deps.favorites.byId(user.id, draft.ref.slice(1))
    : null;
  if (!favorite) return [{ ...(await menu(user, draft, deps)), edit: true }];
  const date = mealDate(user, draft, deps);
  await recordMeal(
    user,
    {
      date,
      method: 'favorite',
      portions: fromRecordPortions(favorite.portions),
      favoriteMealId: favorite.id,
      taps: draft.taps,
      key: tapKey(tap),
    },
    tap,
    deps,
  );
  return afterMeal(user, date, deps);
}

// ── Plantillas, repetir ayer y frecuentes ─────────────────────────────────────

function templateList(draft: MealDraft): Reply {
  return {
    text: renderTemplate('CM-09'),
    buttons: FREQUENT_MEAL_TEMPLATES.map((t, i) =>
      mealButton(t.shortName, 'kb', {
        ...draft,
        portions: templatePortions(i) ?? {},
        ref: `t${String(i)}`,
      }),
    ),
    rowSize: 2,
    edit: true,
  };
}

function nameOf(meal: MealRecord, favorites: readonly FavoriteMealRecord[]): string {
  const favorite = favorites.find((f) => f.id === meal.favoriteMealId);
  return favorite?.name ?? favoriteName(fromRecordPortions(meal.portions));
}

async function repeatProposal(user: UserRecord, draft: MealDraft, deps: MealDeps) {
  const yesterday = addDays(todayOf(user, deps), -1);
  const meals = await deps.meals.onDate(user.id, yesterday);
  if (meals.length === 0) return [{ ...plain('CM-11'), edit: true }];
  const favorites = await deps.favorites.list(user.id);
  const names = meals.map((m) => nameOf(m, favorites));
  const [confirmLabel = '', cancelLabel = ''] = labels('CM-10');
  return [
    {
      text: renderTemplate('CM-10', { lista: names.join(' · ') }),
      buttons: [mealButton(confirmLabel, 'rk', draft), mealButton(cancelLabel, 'cx', draft)],
      rowSize: 2,
      edit: true,
    },
  ];
}

/** HU-004-2: las comidas de ayer, confirmadas con 1 toque, cuentan para hoy. */
async function repeatYesterdayMeals(
  user: UserRecord,
  draft: MealDraft,
  tap: MealTap,
  deps: MealDeps,
): Promise<Reply[]> {
  const today = todayOf(user, deps);
  const meals = await deps.meals.onDate(user.id, addDays(today, -1));
  let repeated = 0;
  for (const [i, meal] of meals.entries()) {
    const inserted = await recordMeal(
      user,
      {
        date: today,
        method: 'repeat',
        portions: fromRecordPortions(meal.portions),
        favoriteMealId: meal.favoriteMealId,
        taps: draft.taps,
        key: `${tapKey(tap)}:${String(i)}`,
      },
      tap,
      deps,
    );
    if (inserted) repeated += 1;
  }
  if (repeated > 0) {
    await deps.events.emit(
      'meal_repeated',
      { userId: user.id, timezone: user.timezone },
      { meals: repeated },
    );
  }
  return afterMeal(user, today, deps);
}

async function manageFavorites(user: UserRecord, draft: MealDraft, deps: MealDeps) {
  const favorites = await deps.favorites.list(user.id);
  if (favorites.length === 0) return [{ ...(await menu(user, draft, deps)), edit: true }];
  return [
    {
      text: renderTemplate('CM-12'),
      buttons: favorites.flatMap((f) => [
        mealButton(`${FAVORITE_EDIT_PREFIX} ${f.name}`, 'kb', {
          ...draft,
          portions: fromRecordPortions(f.portions),
          ref: `f${f.id}`,
        }),
        mealButton(`${FAVORITE_DELETE_PREFIX} ${f.name}`, 'dl', { ...draft, ref: `f${f.id}` }),
      ]),
      rowSize: 2,
      edit: true,
    },
  ];
}

async function deleteFavorite(user: UserRecord, draft: MealDraft, deps: MealDeps) {
  const favorite = draft.ref?.startsWith('f')
    ? await deps.favorites.byId(user.id, draft.ref.slice(1))
    : null;
  if (!favorite) return manageFavorites(user, draft, deps);
  await deps.favorites.remove(user.id, favorite.id);
  return [{ ...plain('CM-13', { nombre: favorite.name }), edit: true }];
}

// ── Enrutador de los botones de comida ────────────────────────────────────────

export async function answerMeal(
  user: UserRecord,
  op: string,
  state: string,
  tap: MealTap,
  deps: MealDeps,
): Promise<Reply[]> {
  const decoded = decodeDraft(state);
  if (!decoded) return mealMenu(user, deps);
  const draft: MealDraft = { ...decoded, taps: decoded.taps + 1 };
  const hand = HANDS.find((h) => op === `${HAND_LETTER[h]}p` || op === `${HAND_LETTER[h]}m`);
  if (hand) {
    const direction = op.endsWith('p') ? 1 : -1;
    return [keyboard({ ...draft, portions: adjustPortion(draft.portions, hand, direction) })];
  }
  switch (op) {
    case 'kb':
      return [keyboard(draft)];
    case 'sv':
      return save(user, draft, false, tap, deps);
    case 'sf':
      return save(user, draft, true, tap, deps);
    case 'fv':
      return logFavorite(user, draft, tap, deps);
    case 'tl':
      return [templateList(draft)];
    case 'ry':
      return repeatProposal(user, draft, deps);
    case 'rk':
      return repeatYesterdayMeals(user, draft, tap, deps);
    case 'cx':
      return [
        { ...plain('CM-16'), toast: true },
        { ...(await menu(user, EMPTY_DRAFT, deps)), edit: true },
      ];
    case 'ed':
      return manageFavorites(user, draft, deps);
    case 'dl':
      return deleteFavorite(user, draft, deps);
    case 'dy':
      return [{ ...(await menu(user, { ...draft, yesterday: true }, deps)), edit: true }];
    case 'dt':
      return [{ ...(await menu(user, { ...draft, yesterday: false }, deps)), edit: true }];
    default:
      return mealMenu(user, deps);
  }
}
