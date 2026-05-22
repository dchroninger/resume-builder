import type { ResumeData, FilteredResumeData, Job, SkillCategory, Education, Project } from '../types/resume';
import { parseTag } from './tag-namespace';

export interface FilterOptions {
  selected: string[];
  logicByNs: Record<string, 'or' | 'and'>;
}

/**
 * applyFilters
 *
 * Rules:
 *   • Within a namespace: OR (default) or AND, configurable per namespace.
 *   • Across namespaces: always AND (an entity must satisfy every active namespace filter).
 *   • flag:must-include — entity always passes regardless of filters.
 *   • flag:opt-in       — entity excluded unless 'flag:opt-in' is in `selected`.
 *
 * Inheritance: a bullet "inherits" the tags of its parent (job/edu/project).
 * Same for skills under categories.
 */
export function applyFilters(data: ResumeData, opts: FilterOptions): FilteredResumeData {
  const { selected, logicByNs } = opts;
  const selByNs: Record<string, string[]> = {};
  for (const t of selected) {
    const { ns } = parseTag(t);
    (selByNs[ns] ||= []).push(t);
  }
  const activeNs = Object.keys(selByNs);

  const matches = (tags: string[]): boolean => {
    if (tags.includes('flag:must-include')) return true;
    if (tags.includes('flag:opt-in') && !selected.includes('flag:opt-in')) return false;
    if (activeNs.length === 0) return true;
    return activeNs.every((ns) => {
      const want = selByNs[ns];
      const mode = logicByNs[ns] || 'or';
      return mode === 'and'
        ? want.every((t) => tags.includes(t))
        : want.some((t) => tags.includes(t));
    });
  };

  const jobs = data.jobs
    .map((j: Job) => ({
      ...j,
      filteredBullets: j.bullets.filter((b) => matches([...j.tags, ...b.tags])),
    }))
    // Keep the role if it matches at the role level OR if any of its bullets
    // pass the filter. Previously these were AND'd, which dropped roles whose
    // own tags didn't satisfy the filter even when bullets clearly did.
    .filter((j) => matches(j.tags) || j.filteredBullets.length > 0);

  const skillCategories = data.skillCategories
    .map((c: SkillCategory) => ({
      ...c,
      filteredSkills: c.skills.filter((s) => matches([...c.tags, ...s.tags])),
    }))
    .filter((c) => c.filteredSkills.length > 0);

  const education = data.education
    .map((e: Education) => ({
      ...e,
      filteredBullets: e.bullets.filter((b) => matches([...e.tags, ...b.tags])),
    }))
    .filter((e) => matches(e.tags) || e.filteredBullets.length > 0);

  const projects = data.projects
    .map((p: Project) => ({
      ...p,
      filteredBullets: p.bullets.filter((b) => matches([...p.tags, ...b.tags])),
    }))
    .filter((p) => matches(p.tags) || p.filteredBullets.length > 0);

  return {
    personalInfo: data.personalInfo,
    jobs,
    skillCategories,
    education,
    projects,
  };
}

export function countFilteredBullets(filtered: FilteredResumeData): number {
  let c = 0;
  filtered.jobs.forEach((j) => (c += j.filteredBullets.length));
  filtered.education.forEach((e) => (c += e.filteredBullets.length));
  filtered.projects.forEach((p) => (c += p.filteredBullets.length));
  return c;
}
