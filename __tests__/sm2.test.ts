import { applySM2, newSRSState } from '../src/algorithms/sm2';

describe('SM-2 algorithm', () => {
  const cardId = 'test_001';

  it('starts with default state', () => {
    const state = newSRSState(cardId);
    expect(state.efactor).toBe(2.5);
    expect(state.interval).toBe(0);
    expect(state.repetition).toBe(0);
    expect(state.lapses).toBe(0);
  });

  it('again: resets repetition and interval, increments lapses', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'again');
    expect(state.repetition).toBe(0);
    expect(state.interval).toBe(1);
    expect(state.lapses).toBe(1);
    expect(state.efactor).toBeLessThan(2.5);
  });

  it('good: advances interval correctly for first review', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'good');
    expect(state.repetition).toBe(1);
    expect(state.interval).toBe(1);
  });

  it('good: advances interval to 6 on second review', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'good'); // rep 0 → 1, interval 1
    state = applySM2(state, 'good'); // rep 1 → 2, interval 6
    expect(state.repetition).toBe(2);
    expect(state.interval).toBe(6);
  });

  it('good: uses EF multiplier on third review', () => {
    let state = newSRSState(cardId);
    state = applySM2(state, 'good');
    state = applySM2(state, 'good');
    const prevInterval = state.interval;
    const prevEF = state.efactor;
    state = applySM2(state, 'good');
    expect(state.interval).toBe(Math.round(prevInterval * prevEF));
  });

  it('easy: keeps EF above minimum', () => {
    let state = newSRSState(cardId);
    for (let i = 0; i < 10; i++) state = applySM2(state, 'again');
    expect(state.efactor).toBeGreaterThanOrEqual(1.3);
  });

  it('easy: increases EF', () => {
    const state = newSRSState(cardId);
    const result = applySM2(state, 'easy');
    expect(result.efactor).toBeGreaterThan(2.5);
  });

  it('hard: decreases EF', () => {
    const state = newSRSState(cardId);
    const result = applySM2(state, 'hard');
    expect(result.efactor).toBeLessThan(2.5);
  });

  it('dueDate is set correctly after review', () => {
    const state = newSRSState(cardId);
    const result = applySM2(state, 'good');
    expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.dueDate >= result.lastReviewDate).toBe(true);
  });
});
