import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icons';
import { NAMESPACES, NS_ORDER, parseTag, nsColor, type Namespace } from '../../utils/tag-namespace';
import { Chip } from './Chip';

interface TagPickerProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  value: string[];
  onChange: (next: string[]) => void;
  allTags: string[];
  tagCounts?: Record<string, number>;
}

export function TagPicker({
  anchor, open, onClose, value, onChange, allTags, tagCounts: _tagCounts = {},
}: TagPickerProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const groups = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    NS_ORDER.forEach((ns) => (m[ns] = new Set()));
    Object.entries(NAMESPACES).forEach(([ns, def]) => {
      def.values.forEach((v) => m[ns].add(`${ns}:${v}`));
    });
    allTags.forEach((t) => {
      const { ns } = parseTag(t);
      (m[ns] ||= new Set()).add(t);
    });
    return Object.entries(m)
      .map(([ns, set]) => ({ ns: ns as Namespace, tags: Array.from(set).sort() }))
      .filter((g) => g.tags.length);
  }, [allTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ns: g.ns, tags: g.tags.filter((t) => t.toLowerCase().includes(q)) }))
      .filter((g) => g.tags.length);
  }, [groups, query]);

  const allKnown = useMemo(() => {
    const s = new Set<string>();
    groups.forEach((g) => g.tags.forEach((t) => s.add(t)));
    return s;
  }, [groups]);

  const trimmed = query.trim();
  const canCreate = trimmed.length > 0 && !allKnown.has(trimmed) && !value.includes(trimmed);

  const toggle = (t: string) => {
    if (value.includes(t)) onChange(value.filter((x) => x !== t));
    else onChange([...value, t]);
  };

  const create = () => {
    onChange([...value, trimmed]);
    setQuery('');
    inputRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canCreate) {
      e.preventDefault();
      create();
    }
  };

  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={360} placement="bottom-end">
      <div className="ti-picker-head">
        <Icon.Search size={12} />
        <input
          ref={inputRef}
          className="ti-picker-input"
          placeholder="Search tags or type to add new…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
        />
        <span className="ti-picker-count">{value.length} selected</span>
      </div>
      <div className="pop-list scroller" style={{ maxHeight: 380 }}>
        {filtered.map((g) => (
          <div key={g.ns}>
            <div className="pop-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: nsColor(g.ns) }} />
              {g.ns}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 8px 8px' }}>
              {g.tags.map((t) => {
                const on = value.includes(t);
                return (
                  <span
                    key={t}
                    onClick={() => toggle(t)}
                    style={{ cursor: 'pointer', opacity: on ? 1 : 0.55 }}
                  >
                    <Chip tag={t} variant={on ? 'bar' : 'outline'} size="sm" />
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        {canCreate && (
          <div
            className="pop-item"
            onClick={create}
            style={{ borderTop: filtered.length ? '1px solid var(--border)' : 0 }}
          >
            <Icon.Plus size={12} />
            <span>
              Create <strong style={{ color: 'var(--text)' }}>{trimmed}</strong>
            </span>
          </div>
        )}
        {!filtered.length && !canCreate && (
          <div style={{ padding: '20px 14px', color: 'var(--text-faint)', fontSize: 12 }}>
            No tags match.
          </div>
        )}
      </div>
    </Popover>
  );
}
