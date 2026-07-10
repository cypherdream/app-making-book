import { describe, it, expect } from 'vitest';
import { LESSONS, ACHIEVEMENTS } from '../lessons';

describe('lesson data integrity', () => {
  it('every lesson has a unique id', () => {
    const ids = LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every lesson belongs to a known track', () => {
    LESSONS.forEach((l) => expect(['android', 'backend']).toContain(l.track));
  });

  it('every quiz correct-answer index is within its options range', () => {
    LESSONS.filter((l) => l.quiz).forEach((l) => {
      expect(l.quiz.correct).toBeGreaterThanOrEqual(0);
      expect(l.quiz.correct).toBeLessThan(l.quiz.options.length);
    });
  });
});

describe('achievements', () => {
  it('"Full Repo Mastered" only unlocks when every lesson is done', () => {
    const allButOne = Object.fromEntries(LESSONS.slice(0, -1).map((l) => [l.id, true]));
    const fullMastery = ACHIEVEMENTS.find((a) => a.id === 'all');
    expect(fullMastery.test(allButOne)).toBe(false);

    const all = Object.fromEntries(LESSONS.map((l) => [l.id, true]));
    expect(fullMastery.test(all)).toBe(true);
  });
});
