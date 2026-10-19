import { PARAMETERS } from '../config/parameters.js';
import type { DayType } from '../day/day.js';
import type { LocalDate } from '../time/zoned.js';

/** Nutrición por porciones con la mano (RN-NUT-001 a 008). Sin calorías (RN-NUT-007). */

/** `HandPortion` del glosario (RN-NUT-001). */
export type HandPortion = 'PALM' | 'CUPPED_HAND' | 'FIST' | 'THUMB';
export type Portions = Partial<Readonly<Record<HandPortion, number>>>;

/** Método de registro, como `meals.method` del modelo de datos. */
export type MealMethod = 'portions' | 'favorite' | 'repeat' | 'photo' | 'text';

/** RN-NUT-001: por defecto se registra con porciones con la mano. */
export const DEFAULT_MEAL_METHOD: MealMethod = 'portions';

export interface Meal {
  readonly date: LocalDate;
  readonly method: MealMethod;
  readonly portions: Portions;
  readonly proteinG: number;
  readonly favoriteMealId?: string;
}

/** RN-NUT-001 y FR-004-04: proteína de las porciones = palmas × P-027 g. */
export function proteinFromPortions(portions: Portions): number {
  if (Object.values(portions).some((count) => count < 0)) {
    throw new Error('RN-NUT-001: las porciones no pueden ser negativas');
  }
  return (portions.PALM ?? 0) * PARAMETERS.nutrition.proteinGPerPalm;
}

/** RN-NUT-008 y FR-004-04: proteína de un alimento del catálogo (proteína aproximada × porciones). */
export function proteinFromCatalogFood(
  food: { readonly proteinG: number },
  servings: number,
): number {
  return food.proteinG * servings;
}

/** Media palma: unidad de redondeo de la meta (RN-NUT-002). */
const PALM_ROUNDING_STEP = 0.5;

/**
 * RN-NUT-002 (`[VALIDAR-PROFESIONAL]`): meta diaria = peso × P-026 g/kg, en palmas
 * de P-027 g redondeadas a la media palma más cercana.
 */
export function proteinTarget(weightKg: number): { grams: number; palms: number } {
  const grams = weightKg * PARAMETERS.nutrition.proteinGPerKg;
  const palms =
    Math.round(grams / PARAMETERS.nutrition.proteinGPerPalm / PALM_ROUNDING_STEP) *
    PALM_ROUNDING_STEP;
  return { grams, palms };
}

/**
 * RN-NUT-003: mitad de comida. Con números: proteína ≥ P-028 % de la meta. En modo
 * sin números: al menos P-072 comidas con una porción de proteína o más.
 */
export function isNutritionHalfMet(
  day:
    | { readonly mode: 'numbers'; readonly proteinG: number; readonly targetG: number }
    | { readonly mode: 'number_free'; readonly meals: readonly Portions[] },
): boolean {
  if (day.mode === 'numbers') {
    return day.proteinG >= (day.targetG * PARAMETERS.nutrition.halfThresholdPct) / 100;
  }
  const withProtein = day.meals.filter((meal) => (meal.PALM ?? 0) > 0).length;
  return withProtein >= PARAMETERS.nutrition.numberFreeMealsWithProtein;
}

/** `FavoriteMeal` del glosario. */
export interface FavoriteMeal {
  readonly id: string;
  readonly name: string;
  readonly portions: Portions;
}

/** RN-NUT-004: registrar una comida frecuente es una sola operación (1 toque). */
export function logFavoriteMeal(favorite: FavoriteMeal, date: LocalDate): Meal {
  return {
    date,
    method: 'favorite',
    favoriteMealId: favorite.id,
    portions: favorite.portions,
    proteinG: proteinFromPortions(favorite.portions),
  };
}

/** `PortionProposal` del glosario: algo que el usuario debe confirmar antes de registrarse. */
export interface PortionProposal {
  readonly source: 'photo' | 'text' | 'repeat';
  readonly portions: Portions;
  /** Confianza de la IA (0–1); null si no viene de la IA. */
  readonly confidence: number | null;
  readonly confirmed: false;
}

/** RN-NUT-004: "repetir ayer" propone las comidas de ayer; no registra nada. */
export function repeatYesterday(yesterday: readonly Meal[]): PortionProposal[] {
  return yesterday.map((meal) => ({
    source: 'repeat',
    portions: meal.portions,
    confidence: null,
    confirmed: false,
  }));
}

/**
 * RN-NUT-005: una propuesta (IA o "repetir ayer") solo se convierte en comida con
 * la confirmación del usuario, con sus ajustes si los hizo.
 */
export function confirmProposal(
  proposal: PortionProposal,
  confirmation: {
    readonly date: LocalDate;
    readonly confirmedByUser: boolean;
    readonly adjustedPortions?: Portions;
  },
): Meal {
  if (!confirmation.confirmedByUser) {
    throw new Error('RN-NUT-005: una propuesta no se registra sin confirmación del usuario');
  }
  const portions = confirmation.adjustedPortions ?? proposal.portions;
  return {
    date: confirmation.date,
    method: proposal.source,
    portions,
    proteinG: proteinFromPortions(portions),
  };
}

/**
 * RN-NUT-006 (`[VALIDAR-PROFESIONAL]`): las sugerencias se orientan a la proteína
 * total que falta en el día (no al horario) y al tipo de día; el adaptador elige
 * los alimentos del catálogo accesible.
 */
export function proteinFocus(day: {
  readonly dayType: DayType;
  readonly consumedG: number;
  readonly targetG: number;
}): { priority: 'daily_protein_total'; remainingG: number; context: 'training_day' | 'rest_day' } {
  return {
    priority: 'daily_protein_total',
    remainingG: Math.max(0, day.targetG - day.consumedG),
    context: day.dayType === 'TRAINING' ? 'training_day' : 'rest_day',
  };
}

/**
 * RN-NUT-007: el conteo de calorías no existe en la Fase 0; ni pedirlo ni una señal
 * de riesgo lo activan.
 */
export function isCalorieCountingEnabled(): false {
  return false;
}
