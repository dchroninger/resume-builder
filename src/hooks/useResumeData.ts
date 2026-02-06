import { useState, useEffect, useCallback } from 'react';
import { ResumeData, Job, SkillCategory, Education, Project, Bullet, Skill } from '../types/resume';
import { loadResumeData, saveResumeData, getEmptyResumeData } from '../utils/storage';
import { generateId } from '../utils/export';

export function useResumeData() {
  const [data, setData] = useState<ResumeData>(getEmptyResumeData);

  useEffect(() => {
    setData(loadResumeData());
  }, []);

  useEffect(() => {
    saveResumeData(data);
  }, [data]);

  const updatePersonalInfo = useCallback((info: Partial<ResumeData['personalInfo']>) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info },
    }));
  }, []);

  // Jobs
  const addJob = useCallback(() => {
    const newJob: Job = {
      id: generateId(),
      company: '',
      title: '',
      startDate: '',
      tags: [],
      bullets: [],
    };
    setData((prev) => ({ ...prev, jobs: [...prev.jobs, newJob] }));
    return newJob.id;
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setData((prev) => ({ ...prev, jobs: prev.jobs.filter((j) => j.id !== id) }));
  }, []);

  const addJobBullet = useCallback((jobId: string) => {
    const newBullet: Bullet = { id: generateId(), text: '', tags: [] };
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId ? { ...j, bullets: [...j.bullets, newBullet] } : j
      ),
    }));
    return newBullet.id;
  }, []);

  const updateJobBullet = useCallback((jobId: string, bulletId: string, updates: Partial<Bullet>) => {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              bullets: j.bullets.map((b) => (b.id === bulletId ? { ...b, ...updates } : b)),
            }
          : j
      ),
    }));
  }, []);

  const deleteJobBullet = useCallback((jobId: string, bulletId: string) => {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) =>
        j.id === jobId ? { ...j, bullets: j.bullets.filter((b) => b.id !== bulletId) } : j
      ),
    }));
  }, []);

  // Skill Categories
  const addSkillCategory = useCallback(() => {
    const newCategory: SkillCategory = {
      id: generateId(),
      name: '',
      skills: [],
      tags: [],
    };
    setData((prev) => ({ ...prev, skillCategories: [...prev.skillCategories, newCategory] }));
    return newCategory.id;
  }, []);

  const updateSkillCategory = useCallback((id: string, updates: Partial<SkillCategory>) => {
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteSkillCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.filter((c) => c.id !== id),
    }));
  }, []);

  const addSkill = useCallback((categoryId: string) => {
    const newSkill: Skill = { id: generateId(), name: '', tags: [] };
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((c) =>
        c.id === categoryId ? { ...c, skills: [...c.skills, newSkill] } : c
      ),
    }));
    return newSkill.id;
  }, []);

  const updateSkill = useCallback((categoryId: string, skillId: string, updates: Partial<Skill>) => {
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              skills: c.skills.map((s) => (s.id === skillId ? { ...s, ...updates } : s)),
            }
          : c
      ),
    }));
  }, []);

  const deleteSkill = useCallback((categoryId: string, skillId: string) => {
    setData((prev) => ({
      ...prev,
      skillCategories: prev.skillCategories.map((c) =>
        c.id === categoryId ? { ...c, skills: c.skills.filter((s) => s.id !== skillId) } : c
      ),
    }));
  }, []);

  // Education
  const addEducation = useCallback(() => {
    const newEdu: Education = {
      id: generateId(),
      institution: '',
      degree: '',
      tags: [],
      bullets: [],
    };
    setData((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
    return newEdu.id;
  }, []);

  const updateEducation = useCallback((id: string, updates: Partial<Education>) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteEducation = useCallback((id: string) => {
    setData((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
  }, []);

  const addEducationBullet = useCallback((eduId: string) => {
    const newBullet: Bullet = { id: generateId(), text: '', tags: [] };
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === eduId ? { ...e, bullets: [...e.bullets, newBullet] } : e
      ),
    }));
    return newBullet.id;
  }, []);

  const updateEducationBullet = useCallback((eduId: string, bulletId: string, updates: Partial<Bullet>) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === eduId
          ? {
              ...e,
              bullets: e.bullets.map((b) => (b.id === bulletId ? { ...b, ...updates } : b)),
            }
          : e
      ),
    }));
  }, []);

  const deleteEducationBullet = useCallback((eduId: string, bulletId: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === eduId ? { ...e, bullets: e.bullets.filter((b) => b.id !== bulletId) } : e
      ),
    }));
  }, []);

  // Projects
  const addProject = useCallback(() => {
    const newProject: Project = {
      id: generateId(),
      name: '',
      tags: [],
      bullets: [],
    };
    setData((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
    return newProject.id;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
  }, []);

  const addProjectBullet = useCallback((projectId: string) => {
    const newBullet: Bullet = { id: generateId(), text: '', tags: [] };
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, bullets: [...p.bullets, newBullet] } : p
      ),
    }));
    return newBullet.id;
  }, []);

  const updateProjectBullet = useCallback((projectId: string, bulletId: string, updates: Partial<Bullet>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              bullets: p.bullets.map((b) => (b.id === bulletId ? { ...b, ...updates } : b)),
            }
          : p
      ),
    }));
  }, []);

  const deleteProjectBullet = useCallback((projectId: string, bulletId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, bullets: p.bullets.filter((b) => b.id !== bulletId) } : p
      ),
    }));
  }, []);

  const setFullData = useCallback((newData: ResumeData) => {
    setData(newData);
  }, []);

  return {
    data,
    setFullData,
    updatePersonalInfo,
    addJob,
    updateJob,
    deleteJob,
    addJobBullet,
    updateJobBullet,
    deleteJobBullet,
    addSkillCategory,
    updateSkillCategory,
    deleteSkillCategory,
    addSkill,
    updateSkill,
    deleteSkill,
    addEducation,
    updateEducation,
    deleteEducation,
    addEducationBullet,
    updateEducationBullet,
    deleteEducationBullet,
    addProject,
    updateProject,
    deleteProject,
    addProjectBullet,
    updateProjectBullet,
    deleteProjectBullet,
  };
}
