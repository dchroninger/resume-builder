import type { JdAnalysis, ResumeData, Selection } from '../types/resume';
import { supabase } from './supabase';
import { generateId } from '../utils/export';

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // FunctionsHttpError carries the response; surface the server's message.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const payload = await ctx.json();
        if (payload?.error) throw new Error(payload.error);
      } catch (e) {
        if ((e as Error).message !== error.message) throw e;
      }
    }
    throw new Error(error.message);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export function analyzeJd(input: { url?: string; text?: string }) {
  return invoke<{ analysis: JdAnalysis; jdText: string }>('analyze-jd', input);
}

export interface TailorResult {
  included: Selection;
  overrides: Array<{ bulletId: string; text: string }>;
  gaps: string[];
  rationale: string;
}

export function tailorResume(input: {
  resumeData: ResumeData;
  jdText: string;
  jdAnalysis?: JdAnalysis;
}) {
  return invoke<TailorResult>('tailor', input);
}

export function generateCoverLetter(input: {
  resumeData: unknown;
  jdText: string;
  company: string;
  role: string;
}) {
  return invoke<{ coverLetter: string }>('cover-letter', input);
}

// parse-resume returns entities without ids; assign them client-side.
interface ParsedBullet { text: string; tags: string[]; pinned: boolean }
interface ParsedResume {
  personalInfo: ResumeData['personalInfo'];
  jobs: Array<Omit<ResumeData['jobs'][number], 'id' | 'bullets'> & { bullets: ParsedBullet[] }>;
  skillCategories: Array<{ name: string; tags: string[]; skills: Array<{ name: string; tags: string[] }> }>;
  education: Array<Omit<ResumeData['education'][number], 'id' | 'bullets'> & { bullets: ParsedBullet[] }>;
  projects: Array<Omit<ResumeData['projects'][number], 'id' | 'bullets'> & { bullets: ParsedBullet[] }>;
}

const withIds = (bullets: ParsedBullet[]) =>
  bullets.map((b) => ({ id: generateId(), text: b.text, tags: b.tags, ...(b.pinned ? { pinned: true } : {}) }));

export async function parseResume(input: { fileBase64?: string; mediaType?: string; text?: string }): Promise<ResumeData> {
  const { parsed } = await invoke<{ parsed: ParsedResume }>('parse-resume', input);
  return {
    personalInfo: parsed.personalInfo,
    jobs: parsed.jobs.map((j) => ({ ...j, id: generateId(), bullets: withIds(j.bullets) })),
    skillCategories: parsed.skillCategories.map((c) => ({
      ...c,
      id: generateId(),
      skills: c.skills.map((s) => ({ ...s, id: generateId() })),
    })),
    education: parsed.education.map((e) => ({ ...e, id: generateId(), bullets: withIds(e.bullets) })),
    projects: parsed.projects.map((p) => ({ ...p, id: generateId(), bullets: withIds(p.bullets) })),
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = () => reject(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}
