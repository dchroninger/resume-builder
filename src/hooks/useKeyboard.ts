import { useEffect } from 'react';

/**
 * useKeyboard — register a global hotkey.
 * Combo syntax: 'mod+k', 'mod+shift+z', 'escape', 'arrowdown'.
 * 'mod' matches Cmd on macOS and Ctrl on Windows/Linux.
 */
export function useKeyboard(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  deps: unknown[] = [],
): void {
  useEffect(() => {
    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needMod =
      parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (needMod !== mod) return;
      if (needShift !== e.shiftKey) return;
      if (needAlt !== e.altKey) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
