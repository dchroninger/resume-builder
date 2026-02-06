import { ResumeData } from '../types/resume';

const STORAGE_KEY = 'resume-builder-data';

export function getEmptyResumeData(): ResumeData {
  return {
    personalInfo: {
      name: '',
      email: '',
    },
    jobs: [],
    skillCategories: [],
    education: [],
    projects: [],
  };
}

export function loadResumeData(): ResumeData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load resume data:', e);
  }
  return getEmptyResumeData();
}

export function saveResumeData(data: ResumeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save resume data:', e);
  }
}

export function clearResumeData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
