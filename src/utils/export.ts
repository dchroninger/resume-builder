import type { ResumeData } from '../types/resume';

export function exportToJson(data: ResumeData, filename = 'resume-data.json'): void {
  const json = JSON.stringify(data, null, 2);
  download(filename, new Blob([json], { type: 'application/json' }));
}

export function importFromJsonFile(): Promise<ResumeData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return reject(new Error('No file selected'));
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result as string);
          if (!data || typeof data !== 'object' || !data.personalInfo) {
            return reject(new Error('Not a resume JSON file (missing personalInfo).'));
          }
          data.jobs = Array.isArray(data.jobs) ? data.jobs : [];
          data.skillCategories = Array.isArray(data.skillCategories) ? data.skillCategories : [];
          data.education = Array.isArray(data.education) ? data.education : [];
          data.projects = Array.isArray(data.projects) ? data.projects : [];
          resolve(data as ResumeData);
        } catch (e) {
          reject(new Error('Invalid JSON: ' + (e as Error).message));
        }
      };
      r.onerror = () => reject(new Error('Read failed'));
      r.readAsText(f);
    };
    input.click();
  });
}

export function download(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
