import { useCallback, useEffect, useState } from 'react';
import { loadPresets, savePresets, type TagPreset } from '../utils/storage';
import { generateId } from '../utils/export';

export function usePresets() {
  const [presets, setPresets] = useState<TagPreset[]>(() => loadPresets());

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  const create = useCallback((name: string, tags: string[], logicByNs: Record<string, 'or' | 'and'>) => {
    const p: TagPreset = { id: generateId(), name, tags, logicByNs };
    setPresets((arr) => [...arr, p]);
    return p.id;
  }, []);

  const remove = useCallback((id: string) => {
    setPresets((arr) => arr.filter((p) => p.id !== id));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    setPresets((arr) => arr.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  return { presets, create, remove, rename };
}
