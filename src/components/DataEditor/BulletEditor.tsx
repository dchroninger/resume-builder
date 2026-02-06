import { Bullet } from '../../types/resume';
import { TagInput } from './TagInput';

interface BulletEditorProps {
  bullet: Bullet;
  onChange: (updates: Partial<Bullet>) => void;
  onDelete: () => void;
  allTags: string[];
}

export function BulletEditor({ bullet, onChange, onDelete, allTags }: BulletEditorProps) {
  return (
    <div className="flex gap-2 items-start p-2 bg-gray-50 rounded">
      <span className="text-gray-400 mt-2">•</span>
      <div className="flex-1 space-y-2">
        <textarea
          value={bullet.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Bullet point text..."
          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
          rows={2}
        />
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Tags:</span>
          <div className="flex-1">
            <TagInput
              tags={bullet.tags}
              onChange={(tags) => onChange({ tags })}
              allTags={allTags}
            />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 p-1"
        title="Delete bullet"
      >
        ×
      </button>
    </div>
  );
}
