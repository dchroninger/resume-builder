import { FilteredResumeData } from '../../types/resume';

interface SingleColumnProps {
  data: FilteredResumeData;
}

export function SingleColumn({ data }: SingleColumnProps) {
  const { personalInfo, jobs, skillCategories, education, projects } = data;

  return (
    <div className="bg-white p-8 shadow-lg max-w-[8.5in] mx-auto text-sm">
      {/* Header */}
      <header className="text-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{personalInfo.name || 'Your Name'}</h1>
        <div className="text-gray-600 mt-1 flex flex-wrap justify-center gap-x-3">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.website && <span>{personalInfo.website}</span>}
        </div>
      </header>

      {/* Skills */}
      {skillCategories.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-b mb-2">Skills</h2>
          {skillCategories.map((cat) => (
            <div key={cat.id} className="mb-1">
              <span className="font-semibold">{cat.name}: </span>
              <span>{cat.filteredSkills.map((s) => s.name).join(', ')}</span>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {jobs.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-b mb-2">Experience</h2>
          {jobs.map((job) => (
            <div key={job.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <div className="text-gray-600">{job.company}{job.location && ` • ${job.location}`}</div>
                </div>
                <div className="text-gray-500 text-right">
                  {job.startDate} – {job.endDate || 'Present'}
                </div>
              </div>
              {job.filteredBullets.length > 0 && (
                <ul className="list-disc list-outside ml-5 mt-1 text-gray-700">
                  {job.filteredBullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-b mb-2">Projects</h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{proj.name}</h3>
                  {proj.description && <div className="text-gray-600">{proj.description}</div>}
                </div>
                {proj.url && (
                  <div className="text-blue-600 text-sm">{proj.url}</div>
                )}
              </div>
              {proj.filteredBullets.length > 0 && (
                <ul className="list-disc list-outside ml-5 mt-1 text-gray-700">
                  {proj.filteredBullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 border-b mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{edu.degree}{edu.field && ` in ${edu.field}`}</h3>
                  <div className="text-gray-600">{edu.institution}</div>
                </div>
                {edu.graduationDate && (
                  <div className="text-gray-500">{edu.graduationDate}</div>
                )}
              </div>
              {edu.filteredBullets.length > 0 && (
                <ul className="list-disc list-outside ml-5 mt-1 text-gray-700">
                  {edu.filteredBullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
