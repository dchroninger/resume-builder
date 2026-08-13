import type { Application, ResumeData } from '../types/resume';
import { supabase } from './supabase';

// Row shape for public.applications (snake_case).
interface AppRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  jd_url: string | null;
  jd_text: string | null;
  jd_analysis: Application['jdAnalysis'] | null;
  included: Application['included'];
  overrides: Application['overrides'];
  gaps: string[] | null;
  cover_letter: string | null;
  status: Application['status'];
  created_at: string;
  updated_at: string;
}

function toRow(userId: string, a: Application): AppRow {
  return {
    id: a.id,
    user_id: userId,
    company: a.company,
    role: a.role,
    jd_url: a.jdUrl ?? null,
    jd_text: a.jdText ?? null,
    jd_analysis: a.jdAnalysis ?? null,
    included: a.included,
    overrides: a.overrides,
    gaps: a.gaps ?? null,
    cover_letter: a.coverLetter ?? null,
    status: a.status,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

function fromRow(r: AppRow): Application {
  return {
    id: r.id,
    company: r.company,
    role: r.role,
    jdUrl: r.jd_url ?? undefined,
    jdText: r.jd_text ?? undefined,
    jdAnalysis: r.jd_analysis ?? undefined,
    included: r.included,
    overrides: r.overrides ?? {},
    gaps: r.gaps ?? undefined,
    coverLetter: r.cover_letter ?? undefined,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchRemote(): Promise<{
  resume: ResumeData | null;
  apps: Application[];
}> {
  if (!supabase) throw new Error('Supabase not configured');
  const [resumeRes, appsRes] = await Promise.all([
    supabase.from('resumes').select('data').maybeSingle(),
    supabase.from('applications').select('*').order('updated_at', { ascending: false }),
  ]);
  if (resumeRes.error) throw resumeRes.error;
  if (appsRes.error) throw appsRes.error;
  const resume = (resumeRes.data?.data as ResumeData | undefined) ?? null;
  const hasContent =
    resume &&
    (resume.jobs?.length ||
      resume.skillCategories?.length ||
      resume.education?.length ||
      resume.projects?.length ||
      resume.personalInfo?.name);
  return {
    resume: hasContent ? resume : null,
    apps: ((appsRes.data as AppRow[]) || []).map(fromRow),
  };
}

export async function pushResume(userId: string, data: ResumeData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('resumes')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function pushApplications(userId: string, apps: Application[]): Promise<void> {
  if (!supabase) return;
  if (apps.length) {
    const { error } = await supabase
      .from('applications')
      .upsert(apps.map((a) => toRow(userId, a)), { onConflict: 'user_id,id' });
    if (error) throw error;
  }
  // Remove rows deleted locally.
  const ids = apps.map((a) => a.id);
  const del = supabase.from('applications').delete().eq('user_id', userId);
  const { error: delError } = ids.length
    ? await del.not('id', 'in', `(${ids.map((i) => `"${i}"`).join(',')})`)
    : await del;
  if (delError) throw delError;
}
