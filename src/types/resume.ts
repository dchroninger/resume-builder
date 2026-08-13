export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

/**
 * An alternate rendering of the same underlying accomplishment. At most one
 * variant renders per bullet — chosen by `angle` overlap with the target
 * profile, falling back to the bullet's master `text`. Variants exist so the
 * same claim can be framed for different audiences (IC vs. manager) without
 * duplicating the bullet and colliding in tag filters.
 */
export interface BulletVariant {
  id: string;
  text: string;
  /** Profile/angle tags this phrasing is written for, e.g. ['em'] or ['swe']. */
  angle: string[];
  /** Budget instrument: `tight` variants exist to fit a page, not to read better. */
  length?: 'full' | 'tight';
}

export interface Bullet {
  id: string;
  text: string;
  tags: string[];
  /** Pinned bullets are pre-selected in every new application. */
  pinned?: boolean;
  /**
   * Retired from consideration without being deleted. Disabled bullets never
   * appear in pickers, never enter a new selection, and are filtered out at
   * render even if a stale selection still names them.
   *
   * This is a library-wide judgment ("this claim is dead"), NOT per-application
   * trimming — narrowing a role to its best six bullets is selection's job.
   */
  disabled?: boolean;
  /** Alternate phrasings of this same claim. Master `text` is the default. */
  variants?: BulletVariant[];
}

export interface Job {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  tags: string[];
  bullets: Bullet[];
}

export interface Skill {
  id: string;
  name: string;
  tags: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: Skill[];
  tags: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  tags: string[];
  bullets: Bullet[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  url?: string;
  tags: string[];
  bullets: Bullet[];
}

export type TemplateType =
  | 'modern'
  | 'executive'
  | 'compact'
  | 'sidebar'
  | 'single-column'
  | 'two-column';

/**
 * A complete, pre-approved summary written toward one target profile. Stored
 * whole rather than composed from fragments: summaries are short enough that
 * whole-text storage costs nothing and avoids the drift that fragment
 * assembly causes. Selection picks one by tag overlap; nothing generates prose
 * from scratch.
 */
export interface Summary {
  id: string;
  /** Short label for the picker, e.g. "Sr SDE" or "General". */
  label: string;
  text: string;
  tags: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  jobs: Job[];
  skillCategories: SkillCategory[];
  education: Education[];
  projects: Project[];
  /** Optional: absent on libraries created before summaries existed. */
  summaries?: Summary[];
}

export interface FilteredResumeData extends ResumeData {
  jobs: (Job & { filteredBullets: Bullet[] })[];
  skillCategories: (SkillCategory & { filteredSkills: Skill[] })[];
  education: (Education & { filteredBullets: Bullet[] })[];
  projects: (Project & { filteredBullets: Bullet[] })[];
  /** The one summary selected for this application, if any. */
  selectedSummary?: Summary;
}

// ── Applications (one per job you're applying to) ───────────────────────────

export interface JdAnalysis {
  company?: string;
  role?: string;
  keywords: string[];
  requirements: string[];
  tone?: string;
  notes?: string;
}

/**
 * Explicit id-based selection from the master library.
 * An entity (job/education/project/category) renders only if its id is
 * included; its bullets/skills render only if also individually included.
 */
export interface Selection {
  jobIds: string[];
  bulletIds: string[];
  skillCategoryIds: string[];
  skillIds: string[];
  educationIds: string[];
  projectIds: string[];
  /** Which summary variant renders. Undefined = no summary section. */
  summaryId?: string;
  /** bulletId -> variantId. Absent entries fall back to the bullet's master text. */
  variantIds?: Record<string, string>;
}

export type ApplicationStatus = 'draft' | 'applied' | 'archived';

export interface Application {
  id: string;
  company: string;
  role: string;
  jdUrl?: string;
  jdText?: string;
  jdAnalysis?: JdAnalysis;
  included: Selection;
  /** bulletId -> job-specific rewrite. Master text is never mutated. */
  overrides: Record<string, string>;
  /** JD requirements the library doesn't cover (from the tailor agent). */
  gaps?: string[];
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}
