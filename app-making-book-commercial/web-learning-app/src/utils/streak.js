const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

/**
 * Advances a { count, lastDate } streak by at most one day per call.
 * Visiting again on the same day is a no-op; visiting the day right
 * after the last visit increments; any bigger gap resets to 1.
 */
export function bumpStreak(streak) {
  const t = todayStr();
  if (streak.lastDate === t) return streak;
  const count = streak.lastDate === yesterdayStr() ? streak.count + 1 : 1;
  return { count, lastDate: t };
}
