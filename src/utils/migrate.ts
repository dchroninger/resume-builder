import type { ResumeData, Bullet } from '../types/resume';

/**
 * One-time migration from the namespaced-tag era (v1) to flat tags (v2):
 *   • `flag:must-include` on a bullet        → bullet.pinned = true
 *   • `flag:*` / `confidence:*` anywhere     → dropped (meaningless flat)
 *   • any other `ns:value`                   → `value`
 * Runs once, guarded by a schema-version key in localStorage.
 */

const KNOWN_NS = ['target', 'skill', 'narrative', 'era', 'audience', 'confidence', 'flag'];

function migrateTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const i = t.indexOf(':');
    if (i === -1) {
      out.push(t);
      continue;
    }
    const ns = t.slice(0, i);
    if (!KNOWN_NS.includes(ns)) {
      out.push(t); // freeform tag that happens to contain a colon
      continue;
    }
    if (ns === 'flag' || ns === 'confidence') continue;
    out.push(t.slice(i + 1));
  }
  return out.filter((t, i, a) => t && a.indexOf(t) === i);
}

function migrateBullet(b: Bullet): Bullet {
  const pinned = b.pinned || b.tags.includes('flag:must-include');
  const next: Bullet = { ...b, tags: migrateTags(b.tags) };
  if (pinned) next.pinned = true;
  return next;
}

export function migrateResumeData(data: ResumeData): ResumeData {
  return {
    personalInfo: data.personalInfo,
    jobs: data.jobs.map((j) => ({
      ...j,
      tags: migrateTags(j.tags),
      bullets: j.bullets.map(migrateBullet),
    })),
    skillCategories: data.skillCategories.map((c) => ({
      ...c,
      tags: migrateTags(c.tags),
      skills: c.skills.map((s) => ({ ...s, tags: migrateTags(s.tags) })),
    })),
    education: data.education.map((e) => ({
      ...e,
      tags: migrateTags(e.tags),
      bullets: e.bullets.map(migrateBullet),
    })),
    projects: data.projects.map((p) => ({
      ...p,
      tags: migrateTags(p.tags),
      bullets: p.bullets.map(migrateBullet),
    })),
    // Rebuilt explicitly above, so anything not named here is dropped.
    summaries: (data.summaries ?? []).map((s) => ({ ...s, tags: migrateTags(s.tags) })),
  };
}
