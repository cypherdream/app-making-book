import { useState, useEffect, useCallback, useRef } from 'react';
import { getProgress, setProgress } from '../services/storage';

const DEFAULTS = {
  dark: true,
  done: {},
  bookmarked: {},
  notes: {},
  fontSize: 'base',
  streak: { count: 0, lastDate: null },
  lastLessonId: null,
  hasSeenOnboarding: false,
};

/**
 * Loads saved progress once on mount, then persists on every change.
 * getProgress()/setProgress() are async now (they may hit the backend)
 * — the component using this hook doesn't need to know that, or
 * whether it's talking to localStorage or a real API.
 */
export function usePersistentProgress() {
  const [state, setState] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const skipNextSave = useRef(false);

  const load = useCallback(async () => {
    const saved = await getProgress();
    if (saved) {
      skipNextSave.current = true; // don't immediately re-write what we just read
      setState((s) => ({ ...s, ...saved }));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    setProgress(state).then((ok) => setSaveError(!ok));
  }, [loaded, state]);

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  // Called after login/logout so the UI reflects whichever account's
  // data should now be showing, instead of keeping the previous state.
  const reload = useCallback(() => {
    setLoaded(false);
    load();
  }, [load]);

  return { ...state, loaded, saveError, update, setState, reload };
}
