import { useEffect, useRef } from 'react';
import type { Bullet } from '../../types/resume';
import { TagInput } from '../TagInput/TagInput';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import type { ChipVariant } from '../TagInput/Chip';
import type { DragHandlers } from './useDragReorder';

interface BulletRowProps {
  bullet: Bullet;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: ChipVariant;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (next: Bullet) => void;
  onDelete: () => void;
  onClone: () => void;
  dragHandlers: DragHandlers;
}

export function BulletRow({
  bullet,
  allTags,
  tagCounts,
  chipVariant,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onClone,
  dragHandlers,
}: BulletRowProps) {
  const len = bullet.text.length;
  const warn = len > 0 && (len < 70 || len > 220);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const autosize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  };

  useEffect(autosize, [bullet.text]);

  return (
    <div
      className="bullet"
      draggable
      onDragStart={dragHandlers.onDragStart(bullet.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={dragHandlers.onDragOver(bullet.id)}
    >
      <span className="b-grip" title="Drag to reorder">
        <Icon.Grip size={14} />
      </span>
      <div className="b-check">
        <Checkbox checked={isSelected} onChange={onSelect} />
      </div>
      <div className="b-body">
        <textarea
          ref={taRef}
          className="b-text"
          value={bullet.text}
          rows={1}
          onChange={(e) => onChange({ ...bullet, text: e.target.value })}
          onInput={autosize}
          placeholder="Describe an accomplishment, an outcome, or a technical decision…"
        />
        <TagInput
          value={bullet.tags}
          onChange={(tags) => onChange({ ...bullet, tags })}
          allTags={allTags}
          tagCounts={tagCounts}
          chipVariant={chipVariant}
        />
        <div className="b-meta">
          <span className={'char-count' + (warn ? ' warn' : '')}>
            {len} chars{len ? ' · sweet spot 110–180' : ''}
          </span>
          {bullet.tags.length === 0 ? (
            <span className="badge warn dot">untagged</span>
          ) : null}
        </div>
      </div>
      <div className="b-actions">
        <Button variant="ghost" size="sm" icon={Icon.Copy} tip="Clone bullet" onClick={onClone} />
        <Button variant="ghost" size="sm" icon={Icon.Trash} tip="Delete" onClick={onDelete} />
      </div>
    </div>
  );
}
