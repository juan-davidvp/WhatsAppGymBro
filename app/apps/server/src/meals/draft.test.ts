import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeDraft, encodeDraft, type MealDraft } from './draft.js';

describe('T-050 · el borrador de la comida viaja en el botón sin perder nada', () => {
  it('ida y vuelta para cualquier borrador (palma en cuartos)', () => {
    const draft: fc.Arbitrary<MealDraft> = fc.record({
      portions: fc.record({
        PALM: fc.integer({ min: 0, max: 99 }).map((q) => q / 4),
        CUPPED_HAND: fc.integer({ min: 0, max: 99 }),
        FIST: fc.integer({ min: 0, max: 99 }),
        THUMB: fc.integer({ min: 0, max: 99 }),
      }),
      yesterday: fc.boolean(),
      taps: fc.integer({ min: 0, max: 999 }),
      ref: fc.option(
        fc.oneof(
          fc.integer({ min: 0, max: 9 }).map((i) => `t${String(i)}`),
          fc.stringMatching(/^[a-f0-9]{24}$/).map((id) => `f${id}`),
        ),
      ),
    });
    fc.assert(
      fc.property(draft, (d) => {
        expect(decodeDraft(encodeDraft(d))).toEqual(d);
      }),
    );
  });

  it('rechaza datos que no son un borrador', () => {
    for (const bad of ['', 'x', '1_2_3', '1_2_3_4_5_6_zz', '1_2_3_4_5_6_t1_extra']) {
      expect(decodeDraft(bad)).toBeNull();
    }
  });
});
