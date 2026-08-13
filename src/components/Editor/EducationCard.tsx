import type { Education, Bullet } from '../../types/resume';
import { TagInput } from '../TagInput/TagInput';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { BulletRow } from './BulletRow';
import { useDragReorder, reorderById, type DragHandlers } from './useDragReorder';
import { generateId } from '../../utils/export';
import { isActive } from '../../utils/selection';
import type { ChipVariant } from '../TagInput/Chip';
import { AutoTextarea } from '../ui/AutoTextarea';

interface EducationCardProps {
  ed: Education;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Education) => void;
  onDelete: () => void;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: ChipVariant;
  dragHandlers: DragHandlers;
  selectedBullets: Set<string>;
  onSelectBullet: (id: string) => void;
}

export function EducationCard({
  ed, expanded, onToggle, onChange, onDelete,
  allTags, tagCounts, chipVariant, dragHandlers,
  selectedBullets, onSelectBullet,
}: EducationCardProps) {
  const setField = <K extends keyof Education>(k: K, v: Education[K]) => onChange({ ...ed, [k]: v });
  const setBullet = (b: Bullet) =>
    onChange({ ...ed, bullets: ed.bullets.map((x) => (x.id === b.id ? b : x)) });
  const deleteBullet = (id: string) =>
    onChange({ ...ed, bullets: ed.bullets.filter((x) => x.id !== id) });
  const cloneBullet = (b: Bullet) => {
    const next = [...ed.bullets];
    const idx = next.findIndex((x) => x.id === b.id);
    next.splice(idx + 1, 0, { ...b, id: generateId() });
    onChange({ ...ed, bullets: next });
  };
  const addBullet = () =>
    onChange({ ...ed, bullets: [...ed.bullets, { id: generateId(), text: '', tags: [] }] });

  const bulletDnd = useDragReorder((from, to) =>
    onChange({ ...ed, bullets: reorderById(ed.bullets, from, to) }),
  );

  // Render list only; all mutations above still use the full bullets array.
  const visible = ed.bullets.filter(isActive);

  return (
    <div
      className={'card' + (expanded ? ' expanded' : '')}
      draggable
      onDragStart={dragHandlers.onDragStart(ed.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver(ed.id)}
    >
      <div className="card-head" onClick={onToggle}>
        <span className="grip" onClick={(e) => e.stopPropagation()}>
          <Icon.Grip size={14} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="title-line">
            <span className="t-title">{ed.degree || 'Degree'}</span>
            <span className="t-sub">· {ed.institution || 'Institution'}</span>
          </div>
          <div className="meta-line">
            {ed.graduationDate ? (
              <>
                <span className="mono-num">{ed.graduationDate}</span>
                <span className="dot" />
              </>
            ) : null}
            {ed.field ? (
              <>
                <span>{ed.field}</span>
                <span className="dot" />
              </>
            ) : null}
            <span>{ed.tags.length} tag{ed.tags.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <span className="chev"><Icon.ChevronRight size={16} /></span>
      </div>

      {expanded ? (
        <div className="card-body">
          <div className="grid-2" style={{ paddingTop: 14 }}>
            <div className="field">
              <label className="field-label">Institution</label>
              <AutoTextarea value={ed.institution} onChange={(e) => setField('institution', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Degree</label>
              <AutoTextarea value={ed.degree} onChange={(e) => setField('degree', e.target.value)} />
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <div className="field">
              <label className="field-label">Field</label>
              <AutoTextarea value={ed.field || ''} onChange={(e) => setField('field', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Graduation</label>
              <input
                className="input mono"
                value={ed.graduationDate || ''}
                onChange={(e) => setField('graduationDate', e.target.value)}
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="field-label">Tags</label>
            <TagInput
              value={ed.tags}
              onChange={(tags) => setField('tags', tags)}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={chipVariant}
            />
          </div>
          <div className="section-h" style={{ marginTop: 16, marginBottom: 4 }}>
            <h2 style={{ fontSize: 'var(--fs-sm)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Highlights
            </h2>
            <span className="count">{visible.length}</span>
            <span className="grow" />
            <Button size="sm" icon={Icon.Plus} onClick={addBullet}>Add</Button>
          </div>
          {visible.map((b) => (
            <BulletRow
              key={b.id}
              bullet={b}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={chipVariant}
              isSelected={selectedBullets.has(b.id)}
              onSelect={() => onSelectBullet(b.id)}
              onChange={setBullet}
              onDelete={() => deleteBullet(b.id)}
              onClone={() => cloneBullet(b)}
              dragHandlers={bulletDnd}
            />
          ))}
          <div className="row" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <Button variant="ghost" size="sm" icon={Icon.Trash} onClick={onDelete}>Delete</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
