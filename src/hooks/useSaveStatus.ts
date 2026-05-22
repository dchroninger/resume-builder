import { useEffect, useRef, useState } from 'react';

/**
 * useDebouncedSaveStatus — returns 'saving' briefly after `dep` changes, then 'saved'.
 * Use to render a save-status indicator in the top bar.
 */
export function useSaveStatus(dep: unknown, delay = 700): 'saved' | 'saving' {
  const [status, setStatus] = useState<'saved' | 'saving'>('saved');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus('saving');
    const id = setTimeout(() => setStatus('saved'), delay);
    return () => clearTimeout(id);
  }, [dep, delay]);
  return status;
}
