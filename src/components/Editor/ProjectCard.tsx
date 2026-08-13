import type { Project, Bullet } from '../../types/resume';
import { TagInput } from '../TagInput/TagInput';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { BulletRow } from './BulletRow';
import { useDragReorder, reorderById, type DragHandlers } from './useDragReorder';
import { generateId } from '../../utils/export';
import { isActive } from '../../utils/selection';
import type { ChipVariant } from '../TagInput/Chip';
import { AutoTextarea } from '../ui/AutoTextarea';

interface ProjectCardProps {
  pr: Project;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: Project) => void;
  onDelete: () => void;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: ChipVariant;
  dragHandlers: DragHandlers;
  selectedBullets: Set<string>;
  onSelectBullet: (id: string) => void;
}

export function ProjectCard({
  pr, expanded, onToggle, onChange, onDelete,
  allTags, tagCounts, chipVariant, dragHandlers,
  selectedBullets, onSelectBullet,
}: ProjectCardProps) {
  const setField = <K extends keyof Project>(k: K, v: Project[K]) => onChange({ ...pr, [k]: v });
  const setBullet = (b: Bullet) =>
    onChange({ ...pr, bullets: pr.bullets.map((x) => (x.id === b.id ? b : x)) });
  const deleteBullet = (id: string) =>
    onChange({ ...pr, bullets: pr.bullets.filter((x) => x.id !== id) });
  const cloneBullet = (b: Bullet) => {
    const next = [...pr.bullets];
    const idx = next.findIndex((x) => x.id === b.id);
    next.splice(idx + 1, 0, { ...b, id: generateId() });
    onChange({ ...pr, bullets: next });
  };
  const addBullet = () =>
    onChange({ ...pr, bullets: [...pr.bullets, { id: generateId(), text: '', tags: [] }] });

  const bulletDnd = useDragReorder((from, to) =>
    onChange({ ...pr, bullets: reorderById(pr.bullets, from, to) }),
  );

  // Render list only; all mutations above still use the full bullets array.
  const visible = pr.bullets.filter(isActive);

  return (
    <div
      className={'card' + (expanded ? ' expanded' : '')}
      draggable
      onDragStart={dragHandlers.onDragStart(pr.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver(pr.id)}
    >
      <div className="card-head" onClick={onToggle}>
        <span className="grip" onClick={(e) => e.stopPropagation()}>
          <Icon.Grip size={14} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="title-line">
            <span className="t-title">{pr.name || 'Untitled project'}</span>
            {pr.url ? <span className="t-sub mono" style={{ fontSize: 11 }}>· {pr.url}</span> : null}
          </div>
          <div className="meta-line">
            {pr.description ? (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pr.description}
              </span>
            ) : (
              <span style={{ color: 'var(--text-faint)' }}>No description</span>
            )}
          </div>
        </div>
        <span className="chev"><Icon.ChevronRight size={16} /></span>
      </div>

      {expanded ? (
        <div className="card-body">
          <div className="grid-2" style={{ paddingTop: 14 }}>
            <div className="field">
              <label className="field-label">Name</label>
              <AutoTextarea value={pr.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">URL</label>
              <input className="input mono" value={pr.url || ''} onChange={(e) => setField('url', e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="field-label">Description</label>
            <AutoTextarea
              value={pr.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="field-label">Tags</label>
            <TagInput
              value={pr.tags}
              onChange={(tags) => setField('tags', tags)}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={chipVariant}
            />
          </div>
          <div className="section-h" style={{ marginTop: 16, marginBottom: 4 }}>
            <h2 style={{ fontSize: 'var(--fs-sm)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Bullets
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
            <Button variant="ghost" size="sm" icon={Icon.Trash} onClick={onDelete}>Delete project</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
