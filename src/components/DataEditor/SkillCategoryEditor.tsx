import { SkillCategory, Skill } from '../../types/resume';
import { TagInput } from './TagInput';

interface SkillCategoryEditorProps {
  category: SkillCategory;
  onChange: (updates: Partial<SkillCategory>) => void;
  onDelete: () => void;
  onAddSkill: () => void;
  onUpdateSkill: (skillId: string, updates: Partial<Skill>) => void;
  onDeleteSkill: (skillId: string) => void;
  allTags: string[];
}

export function SkillCategoryEditor({
  category,
  onChange,
  onDelete,
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
  allTags,
}: SkillCategoryEditorProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-700">Skill Category</h3>
        <button
          type="button"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      </div>

      <input
        type="text"
        value={category.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Category Name (e.g., Languages, Frameworks)"
        className="w-full p-2 border border-gray-300 rounded"
      />

      <div>
        <label className="block text-sm text-gray-600 mb-1">Category Tags</label>
        <TagInput tags={category.tags} onChange={(tags) => onChange({ tags })} allTags={allTags} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-600">Skills</label>
          <button
            type="button"
            onClick={onAddSkill}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Skill
          </button>
        </div>
        {category.skills.map((skill) => (
          <div key={skill.id} className="flex gap-2 items-start p-2 bg-gray-50 rounded">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={skill.name}
                onChange={(e) => onUpdateSkill(skill.id, { name: e.target.value })}
                placeholder="Skill name"
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500">Tags:</span>
                <div className="flex-1">
                  <TagInput
                    tags={skill.tags}
                    onChange={(tags) => onUpdateSkill(skill.id, { tags })}
                    allTags={allTags}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDeleteSkill(skill.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Delete skill"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
