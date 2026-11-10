import type { Portions } from '@gymbro/domain';
import type { MealPortions } from '../ports/repositories.js';

/**
 * Borrador de la comida en curso, que viaja en los datos de cada botón de
 * `🍽️ Comida` (≤ 64 bytes): porciones, si es de ayer, toques hechos y de dónde
 * viene (plantilla `t<n>` o frecuente `f<id>`). La palma va en cuartos para
 * poder abrir plantillas como 0,75 palma (RN-NUT-008).
 */
export interface MealDraft {
  readonly portions: Portions;
  readonly yesterday: boolean;
  /** FR-004-08: toques desde que se abrió `🍽️ Comida`. */
  readonly taps: number;
  readonly ref: string | null;
}

/** Cuartos de palma por palma (la palma viaja como entero). */
const PALM_QUARTERS = 4;
const REF = /^(t\d{1,2}|f[a-f0-9]{24})$/;
const FIELD = /^\d{1,3}$/;

export const EMPTY_DRAFT: MealDraft = { portions: {}, yesterday: false, taps: 0, ref: null };

export function encodeDraft(draft: MealDraft): string {
  const p = draft.portions;
  return [
    Math.round((p.PALM ?? 0) * PALM_QUARTERS),
    p.CUPPED_HAND ?? 0,
    p.FIST ?? 0,
    p.THUMB ?? 0,
    draft.yesterday ? 1 : 0,
    draft.taps,
    ...(draft.ref ? [draft.ref] : []),
  ].join('_');
}

/** null si los datos no son un borrador válido (botón viejo o ajeno). */
export function decodeDraft(state: string): MealDraft | null {
  const [palm, cup, fist, thumb, yesterday, taps, ref, ...rest] = state.split('_');
  const numbers = [palm, cup, fist, thumb, yesterday, taps];
  if (rest.length > 0 || !numbers.every((n) => n !== undefined && FIELD.test(n))) return null;
  if (ref !== undefined && !REF.test(ref)) return null;
  const [q, c, f, t, y, n] = numbers.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return {
    portions: { PALM: q / PALM_QUARTERS, CUPPED_HAND: c, FIST: f, THUMB: t },
    yesterday: y === 1,
    taps: n,
    ref: ref ?? null,
  };
}

export function toRecordPortions(p: Portions): MealPortions {
  return {
    palm: p.PALM ?? 0,
    cuppedHand: p.CUPPED_HAND ?? 0,
    fist: p.FIST ?? 0,
    thumb: p.THUMB ?? 0,
  };
}

export function fromRecordPortions(p: MealPortions): Portions {
  return { PALM: p.palm, CUPPED_HAND: p.cuppedHand, FIST: p.fist, THUMB: p.thumb };
}
