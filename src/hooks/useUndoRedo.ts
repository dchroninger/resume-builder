import { useState, useCallback } from 'react';

/**
 * Simple undo/redo state container.
 * Returns the current state plus undo/redo controls.
 */
export function useUndoRedo<T>(initial: T, limit = 50) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback(
    (updater: T | ((prev: T) => T), opts?: { skipHistory?: boolean }) => {
      setPresent((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: T) => T)(prev)
            : updater;
        if (Object.is(next, prev)) return prev;
        if (opts?.skipHistory) return next;
        setPast((p) => {
          const np = [...p, prev];
          if (np.length > limit) np.shift();
          return np;
        });
        setFuture([]);
        return next;
      });
    },
    [limit],
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const last = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(last);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present]);
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  // Replace state without writing to history (e.g. when loading from storage).
  const replace = useCallback((value: T) => {
    setPresent(value);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    set,
    undo,
    redo,
    replace,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
