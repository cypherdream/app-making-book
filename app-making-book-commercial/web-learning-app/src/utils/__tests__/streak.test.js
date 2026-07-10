import { describe, it, expect, vi, afterEach } from 'vitest';
import { bumpStreak } from '../streak';

describe('bumpStreak', () => {
  afterEach(() => vi.useRealTimers());

  it('starts a new streak at 1 for a first-ever visit', () => {
    const result = bumpStreak({ count: 0, lastDate: null });
    expect(result.count).toBe(1);
  });

  it('does not increment twice on the same day', () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const result = bumpStreak({ count: 3, lastDate: todayStr });
    expect(result).toEqual({ count: 3, lastDate: todayStr });
  });

  it('increments when the last visit was exactly yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const result = bumpStreak({ count: 3, lastDate: yesterday });
    expect(result.count).toBe(4);
  });

  it('resets to 1 after a gap of more than one day', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    const result = bumpStreak({ count: 10, lastDate: threeDaysAgo });
    expect(result.count).toBe(1);
  });
});
