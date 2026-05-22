// Unchanged from your existing types — this is the contract.
export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface Bullet {
  id: string;
  text: string;
  tags: string[];
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

export type TemplateType = 'single-column' | 'two-column';

export interface ResumeData {
  personalInfo: PersonalInfo;
  jobs: Job[];
  skillCategories: SkillCategory[];
  education: Education[];
  projects: Project[];
}

export interface FilteredResumeData extends ResumeData {
  jobs: (Job & { filteredBullets: Bullet[] })[];
  skillCategories: (SkillCategory & { filteredSkills: Skill[] })[];
  education: (Education & { filteredBullets: Bullet[] })[];
  projects: (Project & { filteredBullets: Bullet[] })[];
}
