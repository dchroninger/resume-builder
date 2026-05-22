import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { Popover } from '../ui/Popover';
import { Chip } from '../TagInput/Chip';

interface BulkBarProps {
  count: number;
  allTags: string[];
  tagCounts: Record<string, number>;
  onAddTag: (tag: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkBar({ count, allTags, tagCounts, onAddTag, onDelete, onClear }: BulkBarProps) {
  const [pickOpen, setPickOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <div className="bulk-bar">
        <span className="count">{count} selected</span>
        <span className="sep" />
        <button ref={btnRef} className="btn sm" onClick={() => setPickOpen((o) => !o)}>
          <Icon.Tag size={12} /> Add tag
        </button>
        <Button size="sm" variant="ghost" icon={Icon.Trash} onClick={onDelete}>
          Delete
        </Button>
        <span className="sep" />
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
      <Popover
        anchor={btnRef.current}
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        placement="top-start"
        width={300}
      >
        <div className="pop-head">Apply tag to {count} bullets</div>
        <div className="pop-list scroller">
          {allTags.map((t) => (
            <div
              key={t}
              className="pop-item"
              onClick={() => {
                onAddTag(t);
                setPickOpen(false);
              }}
            >
              <Chip tag={t} size="sm" />
              <span className="pop-count">{tagCounts[t]}</span>
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
}
