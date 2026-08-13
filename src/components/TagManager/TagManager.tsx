import { useMemo, useState } from 'react';
import type { ResumeData } from '../../types/resume';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { Chip } from '../TagInput/Chip';

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
  data: ResumeData;
  onRename: (oldTag: string, newTag: string) => void;
  onDelete: (tag: string) => void;
}

interface TagRef {
  kind: string;
  label: string;
}

export function TagManager({ open, onClose, data, onRename, onDelete }: TagManagerProps) {
  const [filter, setFilter] = useState('');
  const [renaming, setRenaming] = useState<{ tag: string; value: string } | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const tagMap = useMemo(() => {
    const m = new Map<string, { count: number; refs: TagRef[] }>();
    const bump = (tag: string, ref: TagRef) => {
      let e = m.get(tag);
      if (!e) {
        e = { count: 0, refs: [] };
        m.set(tag, e);
      }
      e.count++;
      e.refs.push(ref);
    };
    data.jobs.forEach((j) => {
      j.tags.forEach((t) => bump(t, { kind: 'Job', label: `${j.title} @ ${j.company}` }));
      j.bullets.forEach((b) =>
        b.tags.forEach((t) =>
          bump(t, { kind: 'Bullet', label: `${j.company}: ${b.text.slice(0, 60)}…` }),
        ),
      );
    });
    data.skillCategories.forEach((sc) => {
      sc.tags.forEach((t) => bump(t, { kind: 'Skill category', label: sc.name }));
      sc.skills.forEach((s) => s.tags.forEach((t) => bump(t, { kind: 'Skill', label: s.name })));
    });
    data.education.forEach((ed) => {
      ed.tags.forEach((t) => bump(t, { kind: 'Education', label: ed.degree }));
      ed.bullets.forEach((b) =>
        b.tags.forEach((t) => bump(t, { kind: 'Bullet', label: b.text.slice(0, 60) + '…' })),
      );
    });
    data.projects.forEach((pr) => {
      pr.tags.forEach((t) => bump(t, { kind: 'Project', label: pr.name }));
      pr.bullets.forEach((b) =>
        b.tags.forEach((t) => bump(t, { kind: 'Bullet', label: b.text.slice(0, 60) + '…' })),
      );
    });
    return m;
  }, [data]);

  const list = useMemo(() => {
    return Array.from(tagMap.entries())
      .filter(([tag]) => !filter || tag.toLowerCase().includes(filter.toLowerCase()))
      .map(([tag, info]) => ({ tag, ...info }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [tagMap, filter]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tag manager"
      headExtras={
        <div className="row" style={{ marginLeft: 16, flex: 1, maxWidth: 320 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="input"
              placeholder="Filter tags…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
            <span
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              <Icon.Search size={14} />
            </span>
          </div>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, minHeight: 460 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {list.length} tag{list.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {list.map(({ tag, count }) => {
                    const isRen = renaming && renaming.tag === tag;
                    return (
                      <div
                        key={tag}
                        className={'pop-item' + (active === tag ? ' kbd-active' : '')}
                        onClick={() => setActive(tag)}
                        style={{
                          padding: '6px 8px',
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto auto',
                          gap: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Chip tag={tag} size="sm" />
                        {isRen ? (
                          <input
                            className="input"
                            autoFocus
                            value={renaming.value}
                            style={{ height: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenaming({ tag, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onRename(tag, renaming.value);
                                setRenaming(null);
                              } else if (e.key === 'Escape') {
                                setRenaming(null);
                              }
                            }}
                          />
                        ) : (
                          <span />
                        )}
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {count}×
                        </span>
                        <span className="row" style={{ gap: 2 }}>
                          {isRen ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRename(tag, renaming.value);
                                setRenaming(null);
                              }}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenaming({ tag, value: tag });
                              }}
                            >
                              Rename
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Icon.Trash}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete tag "${tag}" from ${count} entities?`)) {
                                onDelete(tag);
                              }
                            }}
                          />
                        </span>
                      </div>
                    );
              })}
            </div>
          </div>
          {list.length === 0 ? (
            <div className="empty">
              <div className="e-title">No tags match</div>
              <div className="e-sub">Try a different search term.</div>
            </div>
          ) : null}
        </div>

        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 18 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
              fontWeight: 600,
            }}
          >
            Usage
          </div>
          {active && tagMap.has(active) ? (
            <>
              <div style={{ marginBottom: 10 }}>
                <Chip tag={active} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
                {tagMap.get(active)!.count} reference
                {tagMap.get(active)!.count === 1 ? '' : 's'}
              </div>
              <div
                className="scroller"
                style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 360, overflow: 'auto' }}
              >
                {tagMap.get(active)!.refs.map((r, i) => (
                  <div
                    key={i}
                    style={{ padding: '6px 8px', borderRadius: 5, fontSize: 12, lineHeight: 1.4 }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-faint)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: 2,
                      }}
                    >
                      {r.kind}
                    </div>
                    <div style={{ color: 'var(--text-2)' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-faint)', fontSize: 12, padding: '20px 0' }}>
              Select a tag on the left to see where it's used.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
