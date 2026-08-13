import type { Job, Bullet } from '../../types/resume';
import { TagInput } from '../TagInput/TagInput';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { AutoTextarea } from '../ui/AutoTextarea';
import { BulletRow } from './BulletRow';
import { useDragReorder, reorderById, type DragHandlers } from './useDragReorder';
import { fmtDateRange } from '../../utils/date';
import { generateId } from '../../utils/export';
import { isActive } from '../../utils/selection';
import type { ChipVariant } from '../TagInput/Chip';

interface JobCardProps {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Job) => void;
  onDelete: () => void;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: ChipVariant;
  dragHandlers: DragHandlers;
  selectedBullets: Set<string>;
  onSelectBullet: (id: string) => void;
}

export function JobCard({
  job, expanded, onToggle, onChange, onDelete,
  allTags, tagCounts, chipVariant, dragHandlers,
  selectedBullets, onSelectBullet,
}: JobCardProps) {
  const setField = <K extends keyof Job>(k: K, v: Job[K]) => onChange({ ...job, [k]: v });
  const setBullet = (b: Bullet) =>
    onChange({ ...job, bullets: job.bullets.map((x) => (x.id === b.id ? b : x)) });
  const deleteBullet = (id: string) =>
    onChange({ ...job, bullets: job.bullets.filter((x) => x.id !== id) });
  const cloneBullet = (b: Bullet) => {
    const idx = job.bullets.findIndex((x) => x.id === b.id);
    const next = job.bullets.slice();
    next.splice(idx + 1, 0, { ...b, id: generateId() });
    onChange({ ...job, bullets: next });
  };
  const addBullet = () => {
    onChange({ ...job, bullets: [...job.bullets, { id: generateId(), text: '', tags: [] }] });
  };

  const bulletDnd = useDragReorder((from, to) =>
    onChange({ ...job, bullets: reorderById(job.bullets, from, to) }),
  );

  // Only the render list is filtered — every mutation above still operates on
  // the full `job.bullets`, so retired bullets keep their position and are
  // never silently dropped on edit, clone, or reorder.
  const visible = job.bullets.filter(isActive);
  const retiredCount = job.bullets.length - visible.length;

  return (
    <div
      className={'card' + (expanded ? ' expanded' : '')}
      draggable
      onDragStart={dragHandlers.onDragStart(job.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver(job.id)}
    >
      <div className="card-head" onClick={onToggle}>
        <span className="grip" onClick={(e) => e.stopPropagation()}>
          <Icon.Grip size={14} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="title-line">
            <span className="t-title">{job.title || 'Untitled role'}</span>
            <span className="t-sub">· {job.company || 'Company'}</span>
          </div>
          <div className="meta-line">
            <span className="mono-num">{fmtDateRange(job.startDate, job.endDate)}</span>
            {job.location ? (
              <>
                <span className="dot" />
                <span>{job.location}</span>
              </>
            ) : null}
            <span className="dot" />
            <span>{job.bullets.length} bullets</span>
            <span className="dot" />
            <span>{job.tags.length} tag{job.tags.length === 1 ? '' : 's'}</span>
            {job.tags.length === 0 ? (
              <span className="badge warn dot" style={{ marginLeft: 'auto' }}>untagged</span>
            ) : null}
          </div>
        </div>
        <span className="chev">
          <Icon.ChevronRight size={16} />
        </span>
      </div>

      {expanded ? (
        <div className="card-body">
          <div className="grid-2" style={{ paddingTop: 14 }}>
            <div className="field">
              <label className="field-label">Title</label>
              <AutoTextarea value={job.title} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Company</label>
              <AutoTextarea value={job.company} onChange={(e) => setField('company', e.target.value)} />
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: 10 }}>
            <div className="field">
              <label className="field-label">Start</label>
              <input
                className="input mono"
                placeholder="2023-04"
                value={job.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">End</label>
              <input
                className="input mono"
                placeholder="Present"
                value={job.endDate || ''}
                onChange={(e) => setField('endDate', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Location</label>
              <AutoTextarea
                value={job.location || ''}
                onChange={(e) => setField('location', e.target.value)}
              />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label className="field-label">Role-level tags</label>
            <TagInput
              value={job.tags}
              onChange={(tags) => setField('tags', tags)}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={chipVariant}
            />
          </div>

          <div className="section-h" style={{ marginTop: 18, marginBottom: 4 }}>
            <h2
              style={{
                fontSize: 'var(--fs-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              Bullets
            </h2>
            <span className="count">{visible.length}</span>
            {retiredCount > 0 ? (
              <span className="e-sub" style={{ color: 'var(--text-muted)' }}>
                +{retiredCount} retired
              </span>
            ) : null}
            <span className="grow" />
            <Button size="sm" icon={Icon.Plus} onClick={addBullet}>
              Add bullet
            </Button>
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
          {visible.length === 0 ? (
            <div className="empty" style={{ padding: '20px 16px', margin: '8px 0' }}>
              <div className="e-sub">No bullets yet for this role.</div>
              <Button icon={Icon.Plus} onClick={addBullet}>Add the first bullet</Button>
            </div>
          ) : null}

          <div className="row" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <Button variant="ghost" size="sm" icon={Icon.Trash} onClick={onDelete}>
              Delete role
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
