import { useMemo } from 'react';
import type { ResumeData } from '../types/resume';

/** Returns a sorted list of every unique tag used in the resume + a count map. */
export function useTags(data: ResumeData) {
  return useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (t: string) => counts.set(t, (counts.get(t) || 0) + 1);

    data.jobs.forEach((j) => {
      j.tags.forEach(bump);
      j.bullets.forEach((b) => b.tags.forEach(bump));
    });
    data.skillCategories.forEach((c) => {
      c.tags.forEach(bump);
      c.skills.forEach((s) => s.tags.forEach(bump));
    });
    data.education.forEach((e) => {
      e.tags.forEach(bump);
      e.bullets.forEach((b) => b.tags.forEach(bump));
    });
    data.projects.forEach((p) => {
      p.tags.forEach(bump);
      p.bullets.forEach((b) => b.tags.forEach(bump));
    });

    const allTags = Array.from(counts.keys()).sort();
    const tagCounts: Record<string, number> = Object.fromEntries(counts.entries());
    return { allTags, tagCounts };
  }, [data]);
}
