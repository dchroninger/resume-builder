import type {
  ResumeData,
  FilteredResumeData,
  Application,
  Selection,
  Bullet,
  Job,
  Education,
  Project,
} from '../types/resume';

/** Bullets still in play. Disabled ones are retired, not deleted. */
export const isActive = (b: Bullet): boolean => !b.disabled;

/** A selection that includes every *active* entity/bullet/skill in the library. */
export function fullSelection(data: ResumeData): Selection {
  return {
    jobIds: data.jobs.map((j) => j.id),
    bulletIds: [
      ...data.jobs.flatMap((j) => j.bullets.filter(isActive).map((b) => b.id)),
      ...data.education.flatMap((e) => e.bullets.filter(isActive).map((b) => b.id)),
      ...data.projects.flatMap((p) => p.bullets.filter(isActive).map((b) => b.id)),
    ],
    skillCategoryIds: data.skillCategories.map((c) => c.id),
    skillIds: data.skillCategories.flatMap((c) => c.skills.map((s) => s.id)),
    educationIds: data.education.map((e) => e.id),
    projectIds: data.projects.map((p) => p.id),
  };
}

export function emptySelection(): Selection {
  return {
    jobIds: [],
    bulletIds: [],
    skillCategoryIds: [],
    skillIds: [],
    educationIds: [],
    projectIds: [],
  };
}

/**
 * applySelection — id-based projection of the master library into the
 * FilteredResumeData shape consumed by ResumeSheet / ResumePDF / exports.
 * Bullet overrides replace text per-application; master data is untouched.
 */
export function applySelection(data: ResumeData, app: Application): FilteredResumeData {
  const sel = app.included;
  const jobIds = new Set(sel.jobIds);
  const bulletIds = new Set(sel.bulletIds);
  const catIds = new Set(sel.skillCategoryIds);
  const skillIds = new Set(sel.skillIds);
  const eduIds = new Set(sel.educationIds);
  const projIds = new Set(sel.projectIds);

  // The id arrays are ordered, and that order is the resume's order — the top
  // bullets in a role do most of the work, so it can't be left to whatever
  // sequence the master library happens to be in. Anything not named in the
  // selection sorts last rather than jumping to the front.
  const rank = (ids: string[]) => {
    const m = new Map(ids.map((id, i) => [id, i]));
    return (id: string) => m.get(id) ?? Number.MAX_SAFE_INTEGER;
  };
  const bulletRank = rank(sel.bulletIds);
  const jobRank = rank(sel.jobIds);
  const eduRank = rank(sel.educationIds);
  const projRank = rank(sel.projectIds);
  const byRank = <T extends { id: string }>(r: (id: string) => number) =>
    (a: T, b: T) => r(a.id) - r(b.id);

  // Resolution order per bullet: application override > selected variant >
  // master text. Overrides win because they're a deliberate per-application
  // edit; variants are reusable defaults.
  const variantIds = sel.variantIds ?? {};
  const pickBullets = (bullets: Bullet[]): Bullet[] =>
    bullets
      // `isActive` guards here too, not just in fullSelection: a bullet disabled
      // after an application was built must stop rendering in that application.
      .filter((b) => isActive(b) && bulletIds.has(b.id))
      .sort(byRank<Bullet>(bulletRank))
      .map((b) => {
        if (app.overrides[b.id]) return { ...b, text: app.overrides[b.id] };
        const vid = variantIds[b.id];
        const v = vid ? b.variants?.find((x) => x.id === vid) : undefined;
        return v ? { ...b, text: v.text } : b;
      });

  return {
    personalInfo: data.personalInfo,
    summaries: data.summaries,
    selectedSummary: (data.summaries ?? []).find((s) => s.id === sel.summaryId),
    jobs: data.jobs
      .filter((j) => jobIds.has(j.id))
      .sort(byRank<Job>(jobRank))
      .map((j) => ({ ...j, filteredBullets: pickBullets(j.bullets) })),
    skillCategories: data.skillCategories
      .filter((c) => catIds.has(c.id))
      .map((c) => ({ ...c, filteredSkills: c.skills.filter((s) => skillIds.has(s.id)) }))
      .filter((c) => c.filteredSkills.length > 0),
    education: data.education
      .filter((e) => eduIds.has(e.id))
      .sort(byRank<Education>(eduRank))
      .map((e) => ({ ...e, filteredBullets: pickBullets(e.bullets) })),
    projects: data.projects
      .filter((p) => projIds.has(p.id))
      .sort(byRank<Project>(projRank))
      .map((p) => ({ ...p, filteredBullets: pickBullets(p.bullets) })),
  };
}

export function countSelectedBullets(filtered: FilteredResumeData): number {
  let c = 0;
  filtered.jobs.forEach((j) => (c += j.filteredBullets.length));
  filtered.education.forEach((e) => (c += e.filteredBullets.length));
  filtered.projects.forEach((p) => (c += p.filteredBullets.length));
  return c;
}

/**
 * Drop ids that no longer exist in the library (bullets deleted/edited since
 * the application was created) so stale selections don't linger.
 */
export function pruneSelection(data: ResumeData, sel: Selection): Selection {
  const full = fullSelection(data);
  const keep = (ids: string[], valid: string[]) => {
    const v = new Set(valid);
    return ids.filter((id) => v.has(id));
  };
  // Variant ids can go stale two ways: the bullet was deleted, or the variant
  // was. Check both, or a removed variant leaves the bullet rendering nothing.
  const validVariants = new Map(
    [
      ...data.jobs.flatMap((j) => j.bullets),
      ...data.education.flatMap((e) => e.bullets),
      ...data.projects.flatMap((p) => p.bullets),
    ].map((b) => [b.id, new Set((b.variants ?? []).map((v) => v.id))]),
  );
  const variantIds = Object.fromEntries(
    Object.entries(sel.variantIds ?? {}).filter(([bId, vId]) => validVariants.get(bId)?.has(vId)),
  );

  return {
    jobIds: keep(sel.jobIds, full.jobIds),
    bulletIds: keep(sel.bulletIds, full.bulletIds),
    skillCategoryIds: keep(sel.skillCategoryIds, full.skillCategoryIds),
    skillIds: keep(sel.skillIds, full.skillIds),
    educationIds: keep(sel.educationIds, full.educationIds),
    projectIds: keep(sel.projectIds, full.projectIds),
    summaryId: (data.summaries ?? []).some((s) => s.id === sel.summaryId)
      ? sel.summaryId
      : undefined,
    variantIds,
  };
}
