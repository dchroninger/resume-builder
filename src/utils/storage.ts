import type { ResumeData } from '../types/resume';

const STORAGE_KEY = 'resume-builder-data';

export function getEmptyResumeData(): ResumeData {
  return {
    personalInfo: { name: '', email: '' },
    jobs: [],
    skillCategories: [],
    education: [],
    projects: [],
  };
}

export function loadResumeData(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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

// Saved tag-filter presets (separate localStorage key).
const PRESETS_KEY = 'resume-builder-presets';

export interface TagPreset {
  id: string;
  name: string;
  tags: string[];
  logicByNs?: Record<string, 'or' | 'and'>;
}

export function loadPresets(): TagPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load presets:', e);
  }
  return [];
}

export function savePresets(presets: TagPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save presets:', e);
  }
}

// Generator settings (template, font, etc.) persisted separately.
const SETTINGS_KEY = 'resume-builder-settings';

export interface AppSettings {
  template: 'single-column' | 'two-column';
  font: 'sans' | 'plex' | 'serif';
  aesthetic: 'linear' | 'vercel' | 'anthropic' | 'editorial';
  dark: boolean;
  density: 'comfortable' | 'compact';
  chipVariant: 'bar' | 'pill' | 'outline' | 'minimal';
}

export const DEFAULT_SETTINGS: AppSettings = {
  template: 'single-column',
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
