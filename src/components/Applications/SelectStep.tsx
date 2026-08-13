import { useMemo, useState } from 'react';
import type {
  Application,
  Bullet,
  ResumeData,
  Selection,
  Skill,
} from '../../types/resume';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icons';
import { AutoTextarea } from '../ui/AutoTextarea';
import { Chip } from '../TagInput/Chip';
import { fmtDateRange } from '../../utils/date';

interface SelectStepProps {
  data: ResumeData;
  app: Application;
  onChange: (next: Application) => void;
}

type EntityKey = 'jobIds' | 'skillCategoryIds' | 'educationIds' | 'projectIds';
type ChildKey = 'bulletIds' | 'skillIds';

function toggleIn(list: string[], id: string, on: boolean): string[] {
  const has = list.includes(id);
  if (on && !has) return [...list, id];
  if (!on && has) return list.filter((x) => x !== id);
  return list;
}

export function SelectStep({ data, app, onChange }: SelectStepProps) {
  const [query, setQuery] = useState('');
  const [editingOverride, setEditingOverride] = useState<string | null>(null);

  const sel = app.included;
  const setSel = (next: Selection) => onChange({ ...app, included: next });

  const matches = (text: string, tags: string[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return text.toLowerCase().includes(q) || tags.some((t) => t.toLowerCase().includes(q));
  };

  // Entity checkbox drives its children too.
  const toggleEntity = (key: EntityKey, id: string, childKey: ChildKey, childIds: string[], on: boolean) => {
    let children = sel[childKey];
    for (const c of childIds) children = toggleIn(children, c, on);
    setSel({ ...sel, [key]: toggleIn(sel[key], id, on), [childKey]: children });
  };

  // Child checkbox: checking a child also checks its parent.
  const toggleChild = (childKey: ChildKey, childId: string, parentKey: EntityKey, parentId: string, on: boolean) => {
    setSel({
      ...sel,
      [childKey]: toggleIn(sel[childKey], childId, on),
      [parentKey]: on ? toggleIn(sel[parentKey], parentId, true) : sel[parentKey],
    });
  };

  const setOverride = (bulletId: string, text: string | null) => {
    const overrides = { ...app.overrides };
    if (text === null || text.trim() === '') delete overrides[bulletId];
    else overrides[bulletId] = text;
    onChange({ ...app, overrides });
  };

  const totals = useMemo(() => {
    const all =
      data.jobs.reduce((n, j) => n + j.bullets.length, 0) +
      data.education.reduce((n, e) => n + e.bullets.length, 0) +
      data.projects.reduce((n, p) => n + p.bullets.length, 0);
    return { all, selected: sel.bulletIds.length };
  }, [data, sel.bulletIds]);

  const bulletRow = (b: Bullet, parentKey: EntityKey, parentId: string) => {
    if (!matches(b.text, b.tags)) return null;
    const on = sel.bulletIds.includes(b.id);
    const override = app.overrides[b.id];
    const editing = editingOverride === b.id;
    return (
      <div key={b.id} className={'sel-bullet' + (on ? '' : ' off')}>
        <Checkbox
          checked={on}
          onChange={(v) => toggleChild('bulletIds', b.id, parentKey, parentId, v)}
        />
        <div className="sel-bullet-body">
          <div className="sel-bullet-text">
            {override && !editing ? (
              <>
                <span>{override}</span>
                <span className="badge acc" style={{ marginLeft: 6 }}>tailored</span>
              </>
            ) : (
              b.text
            )}
            {b.pinned ? (
              <span className="tip" data-tip="Pinned — pre-selected in new applications" style={{ marginLeft: 6, color: 'var(--warn)' }}>
                <Icon.Star size={11} />
              </span>
            ) : null}
          </div>
          {b.tags.length ? (
            <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
              {b.tags.map((t) => (
                <Chip key={t} tag={t} size="sm" variant="minimal" />
              ))}
            </div>
          ) : null}
          {editing ? (
            <div className="override-box">
              <AutoTextarea
                singleLine={false}
                autoFocus
                value={override ?? b.text}
                onChange={(e) => setOverride(b.id, e.target.value)}
              />
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                <Button size="sm" variant="primary" onClick={() => setEditingOverride(null)}>
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOverride(b.id, null);
                    setEditingOverride(null);
                  }}
                >
                  Reset to original
                </Button>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  Original: {b.text.slice(0, 80)}
                  {b.text.length > 80 ? '…' : ''}
                </span>
              </div>
            </div>
          ) : null}
        </div>
        {!editing ? (
          <Button
            size="sm"
            variant="ghost"
            icon={Icon.Sliders}
            tip={override ? 'Edit tailored text' : 'Tailor text for this job'}
            onClick={() => setEditingOverride(b.id)}
          />
        ) : null}
      </div>
    );
  };

  const skillRow = (s: Skill, parentId: string) => {
    if (!matches(s.name, s.tags)) return null;
    const on = sel.skillIds.includes(s.id);
    return (
      <label key={s.id} className={'sel-skill' + (on ? '' : ' off')}>
        <Checkbox
          checked={on}
          onChange={(v) => toggleChild('skillIds', s.id, 'skillCategoryIds', parentId, v)}
        />
        <span>{s.name}</span>
      </label>
    );
  };

  const entityHead = (opts: {
    key: EntityKey;
    id: string;
    title: string;
    sub?: string;
    childKey: ChildKey;
    childIds: string[];
  }) => {
    const on = sel[opts.key].includes(opts.id);
    const selCount = opts.childIds.filter((c) => sel[opts.childKey].includes(c)).length;
    return (
      <div className="sel-entity-head">
        <Checkbox
          checked={on}
          onChange={(v) => toggleEntity(opts.key, opts.id, opts.childKey, opts.childIds, v)}
        />
        <span className="sel-entity-title">{opts.title}</span>
        {opts.sub ? <span className="sel-entity-sub">{opts.sub}</span> : null}
        <span className="grow" />
        <span className="sel-entity-count">
          {selCount}/{opts.childIds.length}
        </span>
      </div>
    );
  };

  return (
    <div className="main-body scroller">
      {app.gaps?.length ? (
        <div className="gaps-panel">
          <div className="fg-head" style={{ marginBottom: 4 }}>
            <span>Gaps — the JD asks for things your library doesn't cover</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
            {app.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
          {app.jdAnalysis?.notes ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {app.jdAnalysis.notes}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="sel-toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <input
            className="input"
            placeholder="Filter bullets and skills by text or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon.Search size={14} />
          </span>
        </div>
        <span className="grow" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {totals.selected}/{totals.all} bullets selected
        </span>
      </div>

      {data.jobs.length ? (
        <div className="sel-section">
          <div className="sel-section-title">Work experience</div>
          {data.jobs.map((j) => (
            <div key={j.id} className="sel-entity">
              {entityHead({
                key: 'jobIds',
                id: j.id,
                title: `${j.title || 'Untitled'} · ${j.company || 'Company'}`,
                sub: fmtDateRange(j.startDate, j.endDate),
                childKey: 'bulletIds',
                childIds: j.bullets.map((b) => b.id),
              })}
              <div className="sel-children">{j.bullets.map((b) => bulletRow(b, 'jobIds', j.id))}</div>
            </div>
          ))}
        </div>
      ) : null}

      {data.skillCategories.length ? (
        <div className="sel-section">
          <div className="sel-section-title">Skills</div>
          {data.skillCategories.map((c) => (
            <div key={c.id} className="sel-entity">
              {entityHead({
                key: 'skillCategoryIds',
                id: c.id,
                title: c.name || 'Untitled category',
                childKey: 'skillIds',
                childIds: c.skills.map((s) => s.id),
              })}
              <div className="sel-children sel-skills">{c.skills.map((s) => skillRow(s, c.id))}</div>
            </div>
          ))}
        </div>
      ) : null}

      {data.projects.length ? (
        <div className="sel-section">
          <div className="sel-section-title">Projects</div>
          {data.projects.map((p) => (
            <div key={p.id} className="sel-entity">
              {entityHead({
                key: 'projectIds',
                id: p.id,
                title: p.name || 'Untitled project',
                childKey: 'bulletIds',
                childIds: p.bullets.map((b) => b.id),
              })}
              <div className="sel-children">{p.bullets.map((b) => bulletRow(b, 'projectIds', p.id))}</div>
            </div>
          ))}
        </div>
      ) : null}

      {data.education.length ? (
        <div className="sel-section">
          <div className="sel-section-title">Education</div>
          {data.education.map((e) => (
            <div key={e.id} className="sel-entity">
              {entityHead({
                key: 'educationIds',
                id: e.id,
                title: `${e.degree || 'Degree'} · ${e.institution || 'Institution'}`,
                sub: e.graduationDate,
                childKey: 'bulletIds',
                childIds: e.bullets.map((b) => b.id),
              })}
              <div className="sel-children">{e.bullets.map((b) => bulletRow(b, 'educationIds', e.id))}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
