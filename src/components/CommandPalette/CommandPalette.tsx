import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from '../../types/resume';
import { Icon, Kbd } from '../ui/Icons';

export interface CommandTarget {
  section: 'personal' | 'jobs' | 'skills' | 'education' | 'projects';
  parentId?: string;
  id?: string;
}

interface CommandPaletteProps {
  data: ResumeData;
  onClose: () => void;
  onJump: (target: CommandTarget) => void;
}

interface Result {
  kind: string;
  label: string;
  meta?: string;
  target: CommandTarget;
}

const NAV_RESULTS: Result[] = [
  { kind: 'Section', label: 'Go to Personal Info', target: { section: 'personal' } },
  { kind: 'Section', label: 'Go to Work Experience', target: { section: 'jobs' } },
  { kind: 'Section', label: 'Go to Skills', target: { section: 'skills' } },
  { kind: 'Section', label: 'Go to Education', target: { section: 'education' } },
  { kind: 'Section', label: 'Go to Projects', target: { section: 'projects' } },
];

export function CommandPalette({ data, onClose, onJump }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results: Result[] = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return NAV_RESULTS;

    const matches = (s?: string) => !!s && s.toLowerCase().includes(term);
    const out: Result[] = [];

    data.jobs.forEach((j) => {
      if (matches(j.title) || matches(j.company)) {
        out.push({
          kind: 'Role',
          label: `${j.title} @ ${j.company}`,
          meta: `${j.bullets.length} bullets`,
          target: { section: 'jobs', parentId: j.id, id: j.id },
        });
      }
      j.bullets.forEach((b) => {
        if (matches(b.text)) {
          out.push({
            kind: 'Bullet',
            label: b.text.length > 90 ? b.text.slice(0, 90) + '…' : b.text,
            meta: j.company,
            target: { section: 'jobs', parentId: j.id, id: b.id },
          });
        }
      });
    });

    data.skillCategories.forEach((c) => {
      if (matches(c.name)) {
        out.push({
          kind: 'Skill cat',
          label: c.name,
          meta: `${c.skills.length} skills`,
          target: { section: 'skills', parentId: c.id, id: c.id },
        });
      }
      c.skills.forEach((s) => {
        if (matches(s.name)) {
          out.push({
            kind: 'Skill',
            label: s.name,
            meta: c.name,
            target: { section: 'skills', parentId: c.id, id: s.id },
          });
        }
      });
    });

    data.projects.forEach((p) => {
      if (matches(p.name) || matches(p.description)) {
        out.push({
          kind: 'Project',
          label: p.name,
          target: { section: 'projects', parentId: p.id, id: p.id },
        });
      }
    });

    return out.slice(0, 30);
  }, [q, data]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[idx]) {
      onJump(results[idx].target);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input">
          <Icon.Search size={16} stroke={1.7} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search bullets, roles, skills, projects…"
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Kbd>↵</Kbd>
          </div>
        </div>
        <div className="cmd-list scroller">
          {results.length === 0 ? (
            <div className="cmd-empty">No matches for “{q}”.</div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className={'cmd-row' + (i === idx ? ' active' : '')}
                onMouseEnter={() => setIdx(i)}
                onClick={() => onJump(r.target)}
              >
                <span className="cmd-kind" style={{ width: 60 }}>
                  {r.kind}
                </span>
                <span style={{ flex: 1, color: 'var(--text)' }}>{r.label}</span>
                {r.meta ? <span className="cmd-meta">{r.meta}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
