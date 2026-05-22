import { useRef, useState } from 'react';
import { Chip, type ChipVariant } from './Chip';
import { TagPicker } from './TagPicker';
import { Icon } from '../ui/Icons';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  allTags?: string[];
  tagCounts?: Record<string, number>;
  placeholder?: string;
  chipVariant?: ChipVariant;
}

export function TagInput({
  value,
  onChange,
  allTags = [],
  tagCounts = {},
  placeholder = 'No tags yet',
  chipVariant = 'bar',
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="tag-input">
      <div className="ti-chips">
        {value.length === 0 ? (
          <span className="ti-placeholder">{placeholder}</span>
        ) : (
          value.map((tag, i) => (
            <Chip
              key={tag + i}
              tag={tag}
              variant={chipVariant}
              removable
              onRemove={() => removeAt(i)}
            />
          ))
        )}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="ti-add tip"
        data-tip="Add tags"
        onClick={() => setOpen(true)}
      >
        <Icon.Tags size={13} />
      </button>

      <TagPicker
        anchor={buttonRef.current}
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        allTags={allTags}
        tagCounts={tagCounts}
      />
    </div>
  );
}
