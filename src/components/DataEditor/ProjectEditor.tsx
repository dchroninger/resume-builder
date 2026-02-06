import { Project, Bullet } from '../../types/resume';
import { TagInput } from './TagInput';
import { BulletEditor } from './BulletEditor';

interface ProjectEditorProps {
  project: Project;
  onChange: (updates: Partial<Project>) => void;
  onDelete: () => void;
  onAddBullet: () => void;
  onUpdateBullet: (bulletId: string, updates: Partial<Bullet>) => void;
  onDeleteBullet: (bulletId: string) => void;
  allTags: string[];
}

export function ProjectEditor({
  project,
  onChange,
  onDelete,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  allTags,
}: ProjectEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-700">Project</h3>
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
          value={project.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Project Name"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          value={project.url || ''}
          onChange={(e) => onChange({ url: e.target.value || undefined })}
          placeholder="URL (optional)"
          className="p-2 border border-gray-300 rounded"
        />
        <textarea
          value={project.description || ''}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          placeholder="Description (optional)"
          className="p-2 border border-gray-300 rounded col-span-2 resize-none"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Tags</label>
        <TagInput
          tags={project.tags}
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
        {project.bullets.map((bullet) => (
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
