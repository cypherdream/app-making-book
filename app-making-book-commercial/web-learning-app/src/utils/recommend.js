// Rule-based "what to learn next" — not a machine-learning
// recommender. With 8 lessons and no meaningful usage data yet, an ML
// model would have nothing to learn from; a simple rule captures the
// same intent honestly: finish your current track before switching,
// and never re-suggest something already done.
export function recommendNext(lessons, done, activeId) {
  const current = lessons.find((l) => l.id === activeId);
  if (!current) return null;

  const sameTrackUnfinished = lessons.filter((l) => l.track === current.track && !done[l.id] && l.id !== activeId);
  if (sameTrackUnfinished.length > 0) return sameTrackUnfinished[0];

  const otherTrackUnfinished = lessons.filter((l) => l.track !== current.track && !done[l.id]);
  if (otherTrackUnfinished.length > 0) return otherTrackUnfinished[0];

  return null; // everything is done
}
