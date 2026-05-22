import type { SkillCategory, Skill } from '../../types/resume';
import { TagInput } from '../TagInput/TagInput';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { generateId } from '../../utils/export';
import type { DragHandlers } from './useDragReorder';
import type { ChipVariant } from '../TagInput/Chip';

interface SkillCategoryCardProps {
  cat: SkillCategory;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: SkillCategory) => void;
  onDelete: () => void;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: ChipVariant;
  dragHandlers: DragHandlers;
}

export function SkillCategoryCard({
  cat, expanded, onToggle, onChange, onDelete,
  allTags, tagCounts, chipVariant, dragHandlers,
}: SkillCategoryCardProps) {
  const setField = <K extends keyof SkillCategory>(k: K, v: SkillCategory[K]) =>
    onChange({ ...cat, [k]: v });
  const setSkill = (s: Skill) =>
    onChange({ ...cat, skills: cat.skills.map((x) => (x.id === s.id ? s : x)) });
  const deleteSkill = (id: string) =>
    onChange({ ...cat, skills: cat.skills.filter((x) => x.id !== id) });
  const addSkill = () =>
    onChange({ ...cat, skills: [...cat.skills, { id: generateId(), name: '', tags: [] }] });

  return (
    <div
      className={'card' + (expanded ? ' expanded' : '')}
      draggable
      onDragStart={dragHandlers.onDragStart(cat.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver(cat.id)}
    >
      <div className="card-head" onClick={onToggle}>
        <span className="grip" onClick={(e) => e.stopPropagation()}>
          <Icon.Grip size={14} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="title-line">
            <span className="t-title">{cat.name || 'Untitled category'}</span>
          </div>
          <div className="meta-line">
            <span>{cat.skills.length} skill{cat.skills.length === 1 ? '' : 's'}</span>
            <span className="dot" />
            <span>{cat.tags.length} tag{cat.tags.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <span className="chev"><Icon.ChevronRight size={16} /></span>
      </div>

      {expanded ? (
        <div className="card-body">
          <div className="field" style={{ paddingTop: 14 }}>
            <label className="field-label">Category name</label>
            <input className="input" value={cat.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label className="field-label">Category tags</label>
            <TagInput
              value={cat.tags}
              onChange={(tags) => setField('tags', tags)}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={chipVariant}
            />
          </div>
          <div className="section-h" style={{ marginTop: 16, marginBottom: 4 }}>
            <h2 style={{ fontSize: 'var(--fs-sm)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Skills
            </h2>
            <span className="count">{cat.skills.length}</span>
            <span className="grow" />
            <Button size="sm" icon={Icon.Plus} onClick={addSkill}>Add skill</Button>
          </div>
          {cat.skills.map((s) => (
            <div className="skill-row-ed" key={s.id}>
              <input
                className="input bare"
                value={s.name}
                placeholder="Skill name"
                onChange={(e) => setSkill({ ...s, name: e.target.value })}
              />
              <TagInput
                value={s.tags}
                onChange={(tags) => setSkill({ ...s, tags })}
                allTags={allTags}
                tagCounts={tagCounts}
                chipVariant={chipVariant}
              />
              <Button variant="ghost" size="sm" icon={Icon.Trash} onClick={() => deleteSkill(s.id)} />
            </div>
          ))}
          <div className="row" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <Button variant="ghost" size="sm" icon={Icon.Trash} onClick={onDelete}>Delete category</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
