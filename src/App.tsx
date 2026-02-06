import { useState, useRef, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Layout } from './components/Layout';
import { JobEditor } from './components/DataEditor/JobEditor';
import { SkillCategoryEditor } from './components/DataEditor/SkillCategoryEditor';
import { EducationEditor } from './components/DataEditor/EducationEditor';
import { ProjectEditor } from './components/DataEditor/ProjectEditor';
import { TagFilter } from './components/TagFilter/TagFilter';
import { ResumePreview } from './components/Preview/ResumePreview';
import { ResumePDF } from './components/PDF/ResumePDF';
import { useResumeData } from './hooks/useResumeData';
import { useTags, filterResumeData } from './hooks/useTags';
import { exportToJson, importFromJson } from './utils/export';
import { TemplateType } from './types/resume';

function App() {
  const [mode, setMode] = useState<'edit' | 'generate'>('edit');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [template, setTemplate] = useState<TemplateType>('single-column');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data,
    setFullData,
    updatePersonalInfo,
    addJob,
    updateJob,
    deleteJob,
    addJobBullet,
    updateJobBullet,
    deleteJobBullet,
    addSkillCategory,
    updateSkillCategory,
    deleteSkillCategory,
    addSkill,
    updateSkill,
    deleteSkill,
    addEducation,
    updateEducation,
    deleteEducation,
    addEducationBullet,
    updateEducationBullet,
    deleteEducationBullet,
    addProject,
    updateProject,
    deleteProject,
    addProjectBullet,
    updateProjectBullet,
    deleteProjectBullet,
  } = useResumeData();

  const allTags = useTags(data);

  const filteredData = useMemo(
    () => filterResumeData(data, selectedTags),
    [data, selectedTags]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => setSelectedTags([]);

  const handleExportJson = () => exportToJson(data);

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJson(file);
      setFullData(imported);
    } catch (err) {
      alert('Failed to import: ' + (err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportPdf = async () => {
    const blob = await pdf(<ResumePDF data={filteredData} template={template} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout mode={mode} onModeChange={setMode}>
      {mode === 'edit' ? (
        <div className="space-y-6">
          {/* Import/Export */}
          <div className="flex gap-3">
            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>

          {/* Personal Info */}
          <section className="bg-white rounded-lg p-4 shadow">
            <h2 className="text-lg font-semibold mb-3">Personal Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={data.personalInfo.name}
                onChange={(e) => updatePersonalInfo({ name: e.target.value })}
                placeholder="Full Name"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                placeholder="Email"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="tel"
                value={data.personalInfo.phone || ''}
                onChange={(e) => updatePersonalInfo({ phone: e.target.value || undefined })}
                placeholder="Phone"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={data.personalInfo.location || ''}
                onChange={(e) => updatePersonalInfo({ location: e.target.value || undefined })}
                placeholder="Location"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={data.personalInfo.linkedin || ''}
                onChange={(e) => updatePersonalInfo({ linkedin: e.target.value || undefined })}
                placeholder="LinkedIn"
                className="p-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={data.personalInfo.website || ''}
                onChange={(e) => updatePersonalInfo({ website: e.target.value || undefined })}
                placeholder="Website"
                className="p-2 border border-gray-300 rounded"
              />
            </div>
          </section>

          {/* Jobs */}
          <section className="bg-white rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Work Experience</h2>
              <button
                onClick={addJob}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Job
              </button>
            </div>
            <div className="space-y-4">
              {data.jobs.map((job) => (
                <JobEditor
                  key={job.id}
                  job={job}
                  onChange={(updates) => updateJob(job.id, updates)}
                  onDelete={() => deleteJob(job.id)}
                  onAddBullet={() => addJobBullet(job.id)}
                  onUpdateBullet={(bulletId, updates) => updateJobBullet(job.id, bulletId, updates)}
                  onDeleteBullet={(bulletId) => deleteJobBullet(job.id, bulletId)}
                  allTags={allTags}
                />
              ))}
              {data.jobs.length === 0 && (
                <p className="text-gray-400 text-sm">No jobs added yet.</p>
              )}
            </div>
          </section>

          {/* Skills */}
          <section className="bg-white rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Skills</h2>
              <button
                onClick={addSkillCategory}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Category
              </button>
            </div>
            <div className="space-y-4">
              {data.skillCategories.map((cat) => (
                <SkillCategoryEditor
                  key={cat.id}
                  category={cat}
                  onChange={(updates) => updateSkillCategory(cat.id, updates)}
                  onDelete={() => deleteSkillCategory(cat.id)}
                  onAddSkill={() => addSkill(cat.id)}
                  onUpdateSkill={(skillId, updates) => updateSkill(cat.id, skillId, updates)}
                  onDeleteSkill={(skillId) => deleteSkill(cat.id, skillId)}
                  allTags={allTags}
                />
              ))}
              {data.skillCategories.length === 0 && (
                <p className="text-gray-400 text-sm">No skill categories added yet.</p>
              )}
            </div>
          </section>

          {/* Education */}
          <section className="bg-white rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Education</h2>
              <button
                onClick={addEducation}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Education
              </button>
            </div>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <EducationEditor
                  key={edu.id}
                  education={edu}
                  onChange={(updates) => updateEducation(edu.id, updates)}
                  onDelete={() => deleteEducation(edu.id)}
                  onAddBullet={() => addEducationBullet(edu.id)}
                  onUpdateBullet={(bulletId, updates) => updateEducationBullet(edu.id, bulletId, updates)}
                  onDeleteBullet={(bulletId) => deleteEducationBullet(edu.id, bulletId)}
                  allTags={allTags}
                />
              ))}
              {data.education.length === 0 && (
                <p className="text-gray-400 text-sm">No education added yet.</p>
              )}
            </div>
          </section>

          {/* Projects */}
          <section className="bg-white rounded-lg p-4 shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Projects</h2>
              <button
                onClick={addProject}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Project
              </button>
            </div>
            <div className="space-y-4">
              {data.projects.map((proj) => (
                <ProjectEditor
                  key={proj.id}
                  project={proj}
                  onChange={(updates) => updateProject(proj.id, updates)}
                  onDelete={() => deleteProject(proj.id)}
                  onAddBullet={() => addProjectBullet(proj.id)}
                  onUpdateBullet={(bulletId, updates) => updateProjectBullet(proj.id, bulletId, updates)}
                  onDeleteBullet={(bulletId) => deleteProjectBullet(proj.id, bulletId)}
                  allTags={allTags}
                />
              ))}
              {data.projects.length === 0 && (
                <p className="text-gray-400 text-sm">No projects added yet.</p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-lg p-4 shadow space-y-4">
            <TagFilter
              allTags={allTags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              onClearTags={clearTags}
            />

            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">Template:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateType)}
                className="p-2 border border-gray-300 rounded"
              >
                <option value="single-column">Single Column</option>
                <option value="two-column">Two Column</option>
              </select>

              <button
                onClick={handleExportPdf}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-200 p-4 rounded-lg">
            <ResumePreview data={filteredData} template={template} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;
