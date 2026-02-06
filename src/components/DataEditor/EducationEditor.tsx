import { Education, Bullet } from '../../types/resume';
import { TagInput } from './TagInput';
import { BulletEditor } from './BulletEditor';

interface EducationEditorProps {
  education: Education;
  onChange: (updates: Partial<Education>) => void;
  onDelete: () => void;
  onAddBullet: () => void;
  onUpdateBullet: (bulletId: string, updates: Partial<Bullet>) => void;
  onDeleteBullet: (bulletId: string) => void;
  allTags: string[];
}

export function EducationEditor({
  education,
  onChange,
  onDelete,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  allTags,
}: EducationEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-700">Education</h3>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={education.institution}
          onChange={(e) => onChange({ institution: e.target.value })}
          placeholder="Institution"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={education.degree}
          onChange={(e) => onChange({ degree: e.target.value })}
          placeholder="Degree"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={education.field || ''}
          onChange={(e) => onChange({ field: e.target.value || undefined })}
          placeholder="Field of Study"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={education.graduationDate || ''}
          onChange={(e) => onChange({ graduationDate: e.target.value || undefined })}
          placeholder="Graduation Date"
          className="p-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Tags</label>
        <TagInput
          tags={education.tags}
          onChange={(tags) => onChange({ tags })}
          allTags={allTags}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-600">Bullet Points</label>
          <button
            type="button"
            onClick={onAddBullet}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Bullet
          </button>
        </div>
        {education.bullets.map((bullet) => (
          <BulletEditor
            key={bullet.id}
            bullet={bullet}
            onChange={(updates) => onUpdateBullet(bullet.id, updates)}
            onDelete={() => onDeleteBullet(bullet.id)}
            allTags={allTags}
          />
        ))}
      </div>
    </div>
  );
}
