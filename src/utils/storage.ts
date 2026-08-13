import type { ResumeData, Application, TemplateType } from '../types/resume';
import { migrateResumeData } from './migrate';

const STORAGE_KEY = 'resume-builder-data';
const SCHEMA_KEY = 'cv-studio-schema-version';
const SCHEMA_VERSION = 2;

export function getEmptyResumeData(): ResumeData {
  return {
    personalInfo: { name: '', email: '' },
    jobs: [],
    skillCategories: [],
    education: [],
    projects: [],
    summaries: [],
  };
}

export function loadResumeData(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let data: ResumeData = JSON.parse(raw);
      const ver = Number(localStorage.getItem(SCHEMA_KEY) || 1);
      if (ver < SCHEMA_VERSION) {
        data = migrateResumeData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
      }
      return data;
    }
  } catch (e) {
    console.error('Failed to load resume data:', e);
  }
  localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  return getEmptyResumeData();
}

export function saveResumeData(data: ResumeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  } catch (e) {
    console.error('Failed to save resume data:', e);
  }
}

export function clearResumeData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Applications ────────────────────────────────────────────────────────────
const APPLICATIONS_KEY = 'cv-studio-applications';

export function loadApplications(): Application[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load applications:', e);
  }
  return [];
}

export function saveApplications(apps: Application[]): void {
  try {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save applications:', e);
  }
}

// ── Settings (template, font, etc.) ─────────────────────────────────────────
const SETTINGS_KEY = 'resume-builder-settings';

export interface AppSettings {
  template: TemplateType;
  font: 'sans' | 'plex' | 'serif';
  aesthetic: 'linear' | 'vercel' | 'anthropic' | 'editorial';
  dark: boolean;
  density: 'comfortable' | 'compact';
  chipVariant: 'bar' | 'pill' | 'outline' | 'minimal';
}

export const DEFAULT_SETTINGS: AppSettings = {
  template: 'modern',
  font: 'sans',
  aesthetic: 'linear',
  dark: true,
  density: 'comfortable',
  chipVariant: 'bar',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
