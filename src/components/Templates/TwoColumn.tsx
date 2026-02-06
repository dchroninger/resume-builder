import { FilteredResumeData } from '../../types/resume';

interface TwoColumnProps {
  data: FilteredResumeData;
}

export function TwoColumn({ data }: TwoColumnProps) {
  const { personalInfo, jobs, skillCategories, education, projects } = data;

  return (
    <div className="bg-white shadow-lg max-w-[8.5in] mx-auto text-sm flex">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-gray-800 text-white p-6">
        {/* Contact */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 border-b border-gray-600 pb-1">Contact</h2>
          <div className="space-y-1 text-gray-300">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
            {personalInfo.linkedin && <div>{personalInfo.linkedin}</div>}
            {personalInfo.website && <div>{personalInfo.website}</div>}
          </div>
        </section>

        {/* Skills */}
        {skillCategories.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 border-b border-gray-600 pb-1">Skills</h2>
            {skillCategories.map((cat) => (
              <div key={cat.id} className="mb-3">
                <h3 className="font-semibold text-gray-200">{cat.name}</h3>
                <div className="text-gray-300">
                  {cat.filteredSkills.map((s) => s.name).join(', ')}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3 border-b border-gray-600 pb-1">Education</h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <h3 className="font-semibold text-gray-200">
                  {edu.degree}{edu.field && ` in ${edu.field}`}
                </h3>
                <div className="text-gray-300">{edu.institution}</div>
                {edu.graduationDate && (
                  <div className="text-gray-400 text-xs">{edu.graduationDate}</div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Right Main Content */}
      <div className="w-2/3 p-6">
        {/* Header */}
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{personalInfo.name || 'Your Name'}</h1>
        </header>

        {/* Experience */}
        {jobs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 border-b mb-3">Experience</h2>
            {jobs.map((job) => (
              <div key={job.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <div className="text-gray-600">{job.company}{job.location && ` • ${job.location}`}</div>
                  </div>
                  <div className="text-gray-500 text-xs">
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
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b mb-3">Projects</h2>
            {projects.map((proj) => (
              <div key={proj.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{proj.name}</h3>
                    {proj.description && <div className="text-gray-600">{proj.description}</div>}
                  </div>
                  {proj.url && (
                    <div className="text-blue-600 text-xs">{proj.url}</div>
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
      </div>
    </div>
  );
}
