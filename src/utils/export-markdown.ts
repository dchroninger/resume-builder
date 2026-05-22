import type { ResumeData, FilteredResumeData } from '../types/resume';
import { download } from './export';
import { fmtDateRange } from './date';

function esc(s?: string): string {
  return (s || '').replace(/([*_`])/g, '\\$1');
}

export function exportMarkdown(data: ResumeData | FilteredResumeData, filename = 'resume.md'): void {
  const lines: string[] = [];
  const p = data.personalInfo;
  lines.push(`# ${p.name || 'Resume'}`);
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);
  if (contact.length) lines.push('', contact.join(' · '));
  lines.push('');

  const bullets = (
    items: { id: string; text: string }[] | undefined,
  ) => items?.forEach((b) => lines.push(`- ${b.text}`));

  const jobs = data.jobs as Array<typeof data.jobs[number] & { filteredBullets?: typeof data.jobs[number]['bullets'] }>;
  if (jobs.length) {
    lines.push('## Experience', '');
    jobs.forEach((j) => {
      lines.push(`### ${esc(j.title)} — ${esc(j.company)}`);
      const meta = [fmtDateRange(j.startDate, j.endDate), j.location].filter(Boolean).join(' · ');
      if (meta) lines.push(`*${meta}*`);
      bullets(j.filteredBullets || j.bullets);
      lines.push('');
    });
  }

  if (data.skillCategories.length) {
    lines.push('## Skills', '');
    (data.skillCategories as Array<typeof data.skillCategories[number] & { filteredSkills?: typeof data.skillCategories[number]['skills'] }>).forEach((c) => {
      const list = (c.filteredSkills || c.skills).map((s) => s.name).join(', ');
      lines.push(`**${esc(c.name)}**: ${list}`);
    });
    lines.push('');
  }

  const projects = data.projects as Array<typeof data.projects[number] & { filteredBullets?: typeof data.projects[number]['bullets'] }>;
  if (projects.length) {
    lines.push('## Projects', '');
    projects.forEach((pr) => {
      lines.push(`### ${esc(pr.name)}${pr.url ? ` — [${pr.url}](${pr.url})` : ''}`);
      if (pr.description) lines.push(pr.description);
      bullets(pr.filteredBullets || pr.bullets);
      lines.push('');
    });
  }

  const education = data.education as Array<typeof data.education[number] & { filteredBullets?: typeof data.education[number]['bullets'] }>;
  if (education.length) {
    lines.push('## Education', '');
    education.forEach((e) => {
      lines.push(`### ${esc(e.degree)} — ${esc(e.institution)}`);
      const m = [e.field, e.graduationDate].filter(Boolean).join(' · ');
      if (m) lines.push(`*${m}*`);
      bullets(e.filteredBullets || e.bullets);
      lines.push('');
    });
  }

  download(filename, new Blob([lines.join('\n')], { type: 'text/markdown' }));
}
