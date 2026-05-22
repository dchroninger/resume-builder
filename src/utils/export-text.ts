import type { ResumeData, FilteredResumeData } from '../types/resume';
import { download } from './export';
import { fmtDateRange } from './date';

export function exportPlainText(data: ResumeData | FilteredResumeData, filename = 'resume.txt'): void {
  const lines: string[] = [];
  const p = data.personalInfo;
  lines.push((p.name || '').toUpperCase());
  const contact = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean);
  if (contact.length) lines.push(contact.join('  ·  '));
  lines.push('', '═'.repeat(72), '');

  const section = (title: string) => {
    lines.push(title.toUpperCase(), '─'.repeat(title.length), '');
  };

  const jobs = data.jobs as Array<typeof data.jobs[number] & { filteredBullets?: typeof data.jobs[number]['bullets'] }>;
  if (jobs.length) {
    section('Experience');
    jobs.forEach((j) => {
      lines.push(`${j.title}  —  ${j.company}`);
      const meta = [fmtDateRange(j.startDate, j.endDate), j.location].filter(Boolean).join(' · ');
      if (meta) lines.push(meta);
      (j.filteredBullets || j.bullets).forEach((b) => lines.push(`  • ${b.text}`));
      lines.push('');
    });
  }

  if (data.skillCategories.length) {
    section('Skills');
    (data.skillCategories as Array<typeof data.skillCategories[number] & { filteredSkills?: typeof data.skillCategories[number]['skills'] }>).forEach((c) => {
      const list = (c.filteredSkills || c.skills).map((s) => s.name).join(', ');
      lines.push(`${c.name}: ${list}`);
    });
    lines.push('');
  }

  const projects = data.projects as Array<typeof data.projects[number] & { filteredBullets?: typeof data.projects[number]['bullets'] }>;
  if (projects.length) {
    section('Projects');
    projects.forEach((pr) => {
      lines.push(`${pr.name}${pr.url ? '  —  ' + pr.url : ''}`);
      if (pr.description) lines.push(pr.description);
      (pr.filteredBullets || pr.bullets).forEach((b) => lines.push(`  • ${b.text}`));
      lines.push('');
    });
  }

  const education = data.education as Array<typeof data.education[number] & { filteredBullets?: typeof data.education[number]['bullets'] }>;
  if (education.length) {
    section('Education');
    education.forEach((e) => {
      lines.push(`${e.degree}  —  ${e.institution}`);
      const m = [e.field, e.graduationDate].filter(Boolean).join(' · ');
      if (m) lines.push(m);
      (e.filteredBullets || e.bullets).forEach((b) => lines.push(`  • ${b.text}`));
      lines.push('');
    });
  }

  download(filename, new Blob([lines.join('\n')], { type: 'text/plain' }));
}
