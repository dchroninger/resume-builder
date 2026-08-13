import type { FilteredResumeData, TemplateType, PersonalInfo, Job, SkillCategory, Education, Project, Bullet, Skill, Summary } from '../../types/resume';
import { fmtDateRange } from '../../utils/date';

type JobF = Job & { filteredBullets: Bullet[] };
type CatF = SkillCategory & { filteredSkills: Skill[] };
type EduF = Education & { filteredBullets: Bullet[] };
type PrjF = Project & { filteredBullets: Bullet[] };

type Variant = 'default' | 'executive';

interface HideMap {
  jobs?: boolean;
  skills?: boolean;
  education?: boolean;
  projects?: boolean;
}

interface ResumeSheetProps {
  data: FilteredResumeData;
  template: TemplateType;
  font: 'sans' | 'plex' | 'serif';
  hideSections?: HideMap;
  scale?: number;
}

export function ResumeSheet({
  data,
  template,
  font,
  hideSections = {},
  scale = 1,
}: ResumeSheetProps) {
  const fClass = font === 'serif' ? 'f-serif' : font === 'plex' ? 'f-plex' : '';
  const variant: Variant = template === 'executive' ? 'executive' : 'default';
  return (
    <div
      className={'resume-sheet ' + fClass}
      data-template={template}
      style={{ transform: `scale(${scale})` }}
    >
      {template === 'sidebar' ? (
        <SidebarLayout data={data} hide={hideSections} />
      ) : (
        <>
          <Header info={data.personalInfo} template={template} />
          {template === 'two-column' ? (
            <TwoColumn data={data} hide={hideSections} />
          ) : (
            <SingleColumn data={data} hide={hideSections} variant={variant} />
          )}
        </>
      )}
    </div>
  );
}

function SidebarLayout({ data, hide }: { data: FilteredResumeData; hide: HideMap }) {
  const info = data.personalInfo;
  const cats = data.skillCategories as CatF[];
  const education = data.education as EduF[];
  const contact = [info.email, info.phone, info.location, info.linkedin, info.website].filter(
    Boolean,
  ) as string[];
  return (
    <div className="sb-row">
      <aside className="sb-side">
        <div className="sb-contact">
          {contact.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
        {!hide.skills && cats.length ? (
          <div>
            <h2>Skills</h2>
            {cats.map((c) => (
              <div className="sb-cat" key={c.id}>
                <div className="lbl">{c.name}</div>
                <div className="vals">{c.filteredSkills.map((s) => s.name).join(' · ')}</div>
              </div>
            ))}
          </div>
        ) : null}
        {!hide.education && education.length ? (
          <div>
            <h2>Education</h2>
            {education.map((ed) => (
              <div className="sb-edu" key={ed.id}>
                <div className="sb-edu-deg">
                  {ed.degree}
                  {ed.field ? ` · ${ed.field}` : ''}
                </div>
                <div className="sb-edu-inst">{ed.institution}</div>
                {ed.graduationDate ? <div className="sb-edu-date">{ed.graduationDate}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </aside>
      <div className="sb-main">
        <h1>{info.name || 'Your Name'}</h1>
        <div className="accent-bar" />
        <SummaryBlock summary={data.selectedSummary} />
        {!hide.jobs ? <ExperienceBlock jobs={data.jobs as JobF[]} variant="default" /> : null}
        {!hide.projects ? <ProjectsBlock projects={data.projects as PrjF[]} /> : null}
      </div>
    </div>
  );
}

function Header({ info, template }: { info: PersonalInfo; template: TemplateType }) {
  return (
    <div>
      <h1>{info.name || 'Your Name'}</h1>
      {template === 'modern' ? <div className="accent-bar" /> : null}
      <div className="contact">
        {info.email ? <span>{info.email}</span> : null}
        {info.phone ? <span>· {info.phone}</span> : null}
        {info.location ? <span>· {info.location}</span> : null}
        {info.linkedin ? <span>· {info.linkedin}</span> : null}
        {info.website ? <span>· {info.website}</span> : null}
      </div>
    </div>
  );
}

function SingleColumn({ data, hide, variant }: { data: FilteredResumeData; hide: HideMap; variant: Variant }) {
  return (
    <>
      <SummaryBlock summary={data.selectedSummary} />
      {!hide.jobs ? <ExperienceBlock jobs={data.jobs as JobF[]} variant={variant} /> : null}
      {!hide.skills ? <SkillsBlock cats={data.skillCategories as CatF[]} /> : null}
      {!hide.projects ? <ProjectsBlock projects={data.projects as PrjF[]} /> : null}
      {!hide.education ? <EducationBlock education={data.education as EduF[]} variant={variant} /> : null}
    </>
  );
}

function TwoColumn({ data, hide }: { data: FilteredResumeData; hide: HideMap }) {
  return (
    <>
      <SummaryBlock summary={data.selectedSummary} />
      {!hide.jobs ? <ExperienceBlock jobs={data.jobs as JobF[]} variant="default" /> : null}
      <div className="two-col">
        <div>
          {!hide.projects ? <ProjectsBlock projects={data.projects as PrjF[]} /> : null}
          {!hide.education ? <EducationBlock education={data.education as EduF[]} variant="default" /> : null}
        </div>
        <div>{!hide.skills ? <SkillsBlock cats={data.skillCategories as CatF[]} /> : null}</div>
      </div>
    </>
  );
}

/** Renders above Experience. Absent when the application selects no summary. */
function SummaryBlock({ summary }: { summary?: Summary }) {
  if (!summary?.text.trim()) return null;
  return (
    <div className="r-summary">
      <p>{summary.text}</p>
    </div>
  );
}

function ExperienceBlock({ jobs, variant }: { jobs: JobF[]; variant: Variant }) {
  if (!jobs.length) return null;
  return (
    <div>
      <h2>Experience</h2>
      {jobs.map((j) => (
        <div className="role" key={j.id}>
          {variant === 'executive' ? (
            <>
              <div className="job-h">
                <span className="x-co">{j.company}</span>
                <span className="job-date">{fmtDateRange(j.startDate, j.endDate)}</span>
              </div>
              <div className="job-h">
                <span className="x-title">{j.title}</span>
                {j.location ? <span className="job-date">{j.location}</span> : null}
              </div>
            </>
          ) : (
            <div className="job-h">
              <div>
                <span className="job-title">{j.title}</span>
                <span className="job-sep"> · </span>
                <span className="job-co">{j.company}</span>
              </div>
              <div className="job-date">
                {fmtDateRange(j.startDate, j.endDate)}
                {j.location ? ` · ${j.location}` : ''}
              </div>
            </div>
          )}
          {j.filteredBullets.length > 0 ? (
            <ul className="bul">
              {j.filteredBullets.map((b) => (
                <li key={b.id}>{b.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SkillsBlock({ cats }: { cats: CatF[] }) {
  if (!cats.length) return null;
  return (
    <div>
      <h2>Skills</h2>
      {cats.map((c) => (
        <div className="skill-row" key={c.id}>
          <div className="lbl">{c.name}</div>
          <div className="vals">{c.filteredSkills.map((s) => s.name).join(' · ')}</div>
        </div>
      ))}
    </div>
  );
}

function ProjectsBlock({ projects }: { projects: PrjF[] }) {
  if (!projects.length) return null;
  return (
    <div>
      <h2>Projects</h2>
      {projects.map((p) => (
        <div className="role" key={p.id}>
          <div className="proj-h">
            <span className="proj-name">{p.name}</span>
            {p.url ? <span className="job-date">{p.url}</span> : null}
          </div>
          {p.description ? <div className="proj-desc">{p.description}</div> : null}
          {p.filteredBullets.length > 0 ? (
            <ul className="bul">
              {p.filteredBullets.map((b) => (
                <li key={b.id}>{b.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function EducationBlock({ education, variant }: { education: EduF[]; variant: Variant }) {
  if (!education.length) return null;
  return (
    <div>
      <h2>Education</h2>
      {education.map((ed) => (
        <div className="role" key={ed.id}>
          {variant === 'executive' ? (
            <>
              <div className="job-h">
                <span className="x-co">{ed.institution}</span>
                <span className="job-date">{ed.graduationDate || ''}</span>
              </div>
              <div className="x-title">
                {ed.degree}
                {ed.field ? ` · ${ed.field}` : ''}
              </div>
            </>
          ) : (
            <>
              <div className="job-h">
                <div>
                  <span className="job-title">{ed.degree}</span>
                  {ed.field ? <span style={{ color: '#444' }}> · {ed.field}</span> : null}
                </div>
                <div className="job-date">{ed.graduationDate || ''}</div>
              </div>
              <div className="job-co">{ed.institution}</div>
            </>
          )}
          {ed.filteredBullets.length > 0 ? (
            <ul className="bul">
              {ed.filteredBullets.map((b) => (
                <li key={b.id}>{b.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
