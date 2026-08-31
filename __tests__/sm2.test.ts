import { applySM2, newSRSState, isMastered, MASTERY_INTERVAL } from '../src/algorithms/sm2';

describe('SM-2 algorithm', () => {
  const cardId = 'test_001';

  it('starts with default state', () => {
    const state = newSRSState(cardId);
    expect(state.cardId).toBe(cardId);
    expect(state.efactor).toBe(2.5);
    expect(state.interval).toBe(0);
    expect(state.repetition).toBe(0);
    expect(state.lapses).toBe(0);
    expect(state.dueDate).toBe(state.firstSeenDate);
    expect(state.dueDate).toBe(state.lastReviewDate);
  });

  it('unknown: resets repetition, sets interval to 1, increments lapses', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'known'); // build up some progress first
    state = applySM2(state, 'unknown');
    expect(state.repetition).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.lapses).toBe(1);
    expect(state.efactor).toBeLessThan(2.5);
  });

  it('in_progress: also counts as a lapse (grade < 3) and lowers EF', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'in_progress');
    expect(state.repetition).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.lapses).toBe(1);
    expect(state.efactor).toBeLessThan(2.5);
  });

  it('known: advances interval and raises EF on first review', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'known');
    expect(state.repetition).toBe(1);
    expect(state.interval).toBe(1);
    expect(state.efactor).toBeGreaterThan(2.5);
  });

  it('known: advances interval to 6 on second review', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'known'); // rep 0 → 1, interval 1
    state = applySM2(state, 'known'); // rep 1 → 2, interval 6
    expect(state.repetition).toBe(2);
    expect(state.interval).toBe(6);
  });

  it('known: uses EF multiplier from the third review onward', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'known');
    state = applySM2(state, 'known');
    const prevInterval = state.interval;
    const prevEF = state.efactor;
    state = applySM2(state, 'known');
    expect(state.interval).toBe(Math.round(prevInterval * prevEF));
  });

  it('EF never drops below the 1.3 floor', () => {
    let state = newSRSState(cardId);
    for (let i = 0; i < 10; i++) state = applySM2(state, 'unknown');
    expect(state.efactor).toBeGreaterThanOrEqual(1.3);
  });

  it('first-seen "known" instantly masters the card', () => {
    const state = newSRSState(cardId);
    const result = applySM2(state, 'known', /* isFirstSeen */ true);
    expect(result.interval).toBe(MASTERY_INTERVAL);
    expect(result.repetition).toBe(3);
    expect(result.efactor).toBe(2.5);
    expect(result.lapses).toBe(0);
    expect(isMastered(result)).toBe(true);
  });

  it('isMastered reflects the mastery interval threshold', () => {
    const fresh = newSRSState(cardId);
    expect(isMastered(fresh)).toBe(false);
    expect(isMastered({ ...fresh, interval: MASTERY_INTERVAL })).toBe(true);
    expect(isMastered({ ...fresh, interval: MASTERY_INTERVAL - 1 })).toBe(false);
  });

  it('dueDate is a valid date on or after the review date', () => {
    const state = newSRSState(cardId);
    const result = applySM2(state, 'known');
    expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.dueDate >= result.lastReviewDate).toBe(true);
  });
});
