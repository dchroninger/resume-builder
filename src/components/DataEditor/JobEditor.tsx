import { Job, Bullet } from '../../types/resume';
import { TagInput } from './TagInput';
import { BulletEditor } from './BulletEditor';

interface JobEditorProps {
  job: Job;
  onChange: (updates: Partial<Job>) => void;
  onDelete: () => void;
  onAddBullet: () => void;
  onUpdateBullet: (bulletId: string, updates: Partial<Bullet>) => void;
  onDeleteBullet: (bulletId: string) => void;
  allTags: string[];
}

export function JobEditor({
  job,
  onChange,
  onDelete,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  allTags,
}: JobEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-700">Job</h3>
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
          value={job.company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Company"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={job.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Job Title"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={job.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
          placeholder="Start Date (e.g., Jan 2020)"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={job.endDate || ''}
          onChange={(e) => onChange({ endDate: e.target.value || undefined })}
          placeholder="End Date (or 'Present')"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={job.location || ''}
          onChange={(e) => onChange({ location: e.target.value || undefined })}
          placeholder="Location"
          className="p-2 border border-gray-300 rounded col-span-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Job Tags</label>
        <TagInput tags={job.tags} onChange={(tags) => onChange({ tags })} allTags={allTags} />
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
        {job.bullets.map((bullet) => (
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
