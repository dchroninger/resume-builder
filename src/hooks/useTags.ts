import { useMemo } from 'react';
import { ResumeData, FilteredResumeData } from '../types/resume';

export function useTags(data: ResumeData) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();

    data.jobs.forEach((job) => {
      job.tags.forEach((t) => tags.add(t));
      job.bullets.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    });

    data.skillCategories.forEach((cat) => {
      cat.tags.forEach((t) => tags.add(t));
      cat.skills.forEach((s) => s.tags.forEach((t) => tags.add(t)));
    });

    data.education.forEach((edu) => {
      edu.tags.forEach((t) => tags.add(t));
      edu.bullets.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    });

    data.projects.forEach((proj) => {
      proj.tags.forEach((t) => tags.add(t));
      proj.bullets.forEach((b) => b.tags.forEach((t) => tags.add(t)));
    });

    return Array.from(tags).sort();
  }, [data]);

  return allTags;
}

export function filterResumeData(data: ResumeData, selectedTags: string[]): FilteredResumeData {
  if (selectedTags.length === 0) {
    return {
      ...data,
      jobs: data.jobs.map((j) => ({ ...j, filteredBullets: j.bullets })),
      skillCategories: data.skillCategories.map((c) => ({ ...c, filteredSkills: c.skills })),
      education: data.education.map((e) => ({ ...e, filteredBullets: e.bullets })),
      projects: data.projects.map((p) => ({ ...p, filteredBullets: p.bullets })),
    };
  }

  const hasTag = (tags: string[]) => tags.some((t) => selectedTags.includes(t));

  const jobs = data.jobs
    .filter((job) => hasTag(job.tags) || job.bullets.some((b) => hasTag(b.tags)))
    .map((job) => ({
      ...job,
      filteredBullets: job.bullets.filter((b) => hasTag(job.tags) || hasTag(b.tags)),
    }));

  const skillCategories = data.skillCategories
    .filter((cat) => hasTag(cat.tags) || cat.skills.some((s) => hasTag(s.tags)))
    .map((cat) => ({
      ...cat,
      filteredSkills: cat.skills.filter((s) => hasTag(cat.tags) || hasTag(s.tags)),
    }));

  const education = data.education
    .filter((edu) => hasTag(edu.tags) || edu.bullets.some((b) => hasTag(b.tags)))
    .map((edu) => ({
      ...edu,
      filteredBullets: edu.bullets.filter((b) => hasTag(edu.tags) || hasTag(b.tags)),
    }));

  const projects = data.projects
    .filter((proj) => hasTag(proj.tags) || proj.bullets.some((b) => hasTag(b.tags)))
    .map((proj) => ({
      ...proj,
      filteredBullets: proj.bullets.filter((b) => hasTag(proj.tags) || hasTag(b.tags)),
    }));

  return {
    personalInfo: data.personalInfo,
    jobs,
    skillCategories,
    education,
    projects,
  };
}
