import type { PersonalInfo } from '../../types/resume';

interface PersonalInfoEditorProps {
  info: PersonalInfo;
  onChange: (next: PersonalInfo) => void;
}

export function PersonalInfoEditor({ info, onChange }: PersonalInfoEditorProps) {
  const f = (k: keyof PersonalInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...info, [k]: e.target.value });

  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Name</label>
          <input className="input" value={info.name} onChange={f('name')} />
        </div>
        <div className="field">
          <label className="field-label">Email</label>
          <input className="input" value={info.email} onChange={f('email')} />
        </div>
        <div className="field">
          <label className="field-label">Phone</label>
          <input className="input" value={info.phone || ''} onChange={f('phone')} />
        </div>
        <div className="field">
          <label className="field-label">Location</label>
          <input className="input" value={info.location || ''} onChange={f('location')} />
        </div>
        <div className="field">
          <label className="field-label">LinkedIn</label>
          <input className="input mono" value={info.linkedin || ''} onChange={f('linkedin')} />
        </div>
        <div className="field">
          <label className="field-label">Website</label>
          <input className="input mono" value={info.website || ''} onChange={f('website')} />
        </div>
      </div>
    </div>
  );
}
