import type { FilteredResumeData, TemplateType, PersonalInfo, Job, SkillCategory, Education, Project, Bullet, Skill } from '../../types/resume';
import { fmtDateRange } from '../../utils/date';

type JobF = Job & { filteredBullets: Bullet[] };
type CatF = SkillCategory & { filteredSkills: Skill[] };
type EduF = Education & { filteredBullets: Bullet[] };
type PrjF = Project & { filteredBullets: Bullet[] };

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
  return (
    <div
      className={'resume-sheet ' + fClass}
      style={{ transform: `scale(${scale})` }}
    >
      <Header info={data.personalInfo} />
      {template === 'two-column' ? (
        <TwoColumn data={data} hide={hideSections} />
      ) : (
        <SingleColumn data={data} hide={hideSections} />
      )}
    </div>
  );
}

function Header({ info }: { info: PersonalInfo }) {
  return (
    <div>
      <h1>{info.name || 'Your Name'}</h1>
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

function SingleColumn({ data, hide }: { data: FilteredResumeData; hide: HideMap }) {
  return (
    <>
      {!hide.jobs ? <ExperienceBlock jobs={data.jobs as JobF[]} /> : null}
      {!hide.skills ? <SkillsBlock cats={data.skillCategories as CatF[]} /> : null}
      {!hide.projects ? <ProjectsBlock projects={data.projects as PrjF[]} /> : null}
      {!hide.education ? <EducationBlock education={data.education as EduF[]} /> : null}
    </>
  );
}

function TwoColumn({ data, hide }: { data: FilteredResumeData; hide: HideMap }) {
  return (
    <>
      {!hide.jobs ? <ExperienceBlock jobs={data.jobs as JobF[]} /> : null}
      <div className="two-col">
        <div>
          {!hide.projects ? <ProjectsBlock projects={data.projects as PrjF[]} /> : null}
          {!hide.education ? <EducationBlock education={data.education as EduF[]} /> : null}
        </div>
        <div>{!hide.skills ? <SkillsBlock cats={data.skillCategories as CatF[]} /> : null}</div>
      </div>
    </>
  );
}

function ExperienceBlock({ jobs }: { jobs: JobF[] }) {
  if (!jobs.length) return null;
  return (
    <div>
      <h2>Experience</h2>
      {jobs.map((j) => (
        <div className="role" key={j.id}>
          <div className="job-h">
            <div>
              <span className="job-title">{j.title}</span>
              <span style={{ color: '#666' }}> · </span>
              <span className="job-co">{j.company}</span>
            </div>
            <div className="job-date">
              {fmtDateRange(j.startDate, j.endDate)}
              {j.location ? ` · ${j.location}` : ''}
            </div>
          </div>
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

function EducationBlock({ education }: { education: EduF[] }) {
  if (!education.length) return null;
  return (
    <div>
      <h2>Education</h2>
      {education.map((ed) => (
        <div className="role" key={ed.id}>
          <div className="job-h">
            <div>
              <span className="job-title">{ed.degree}</span>
              {ed.field ? <span style={{ color: '#444' }}> · {ed.field}</span> : null}
            </div>
            <div className="job-date">{ed.graduationDate || ''}</div>
          </div>
          <div className="job-co">{ed.institution}</div>
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
