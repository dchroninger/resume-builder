import { useState } from 'react';
import type { Application, ApplicationStatus, ResumeData } from '../../types/resume';
import type { AppSettings } from '../../utils/storage';
import { fullSelection, applySelection, countSelectedBullets } from '../../utils/selection';
import { generateId } from '../../utils/export';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { Wizard } from './Wizard';

interface ApplicationsViewProps {
  data: ResumeData;
  apps: Application[];
  setApps: (updater: (prev: Application[]) => Application[]) => void;
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  aiEnabled: boolean;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  archived: 'Archived',
};

export function ApplicationsView({ data, apps, setApps, settings, setSetting, aiEnabled }: ApplicationsViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = apps.find((a) => a.id === activeId) || null;

  const createApp = () => {
    const now = new Date().toISOString();
    const app: Application = {
      id: generateId(),
      company: '',
      role: '',
      included: fullSelection(data),
      overrides: {},
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    setApps((prev) => [app, ...prev]);
    setActiveId(app.id);
  };

  const updateApp = (next: Application) =>
    setApps((prev) =>
      prev.map((a) => (a.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : a)),
    );

  const deleteApp = (app: Application) => {
    if (!confirm(`Delete application for ${app.company || 'untitled'}?`)) return;
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    if (activeId === app.id) setActiveId(null);
  };

  if (active) {
    return (
      <Wizard
        data={data}
        app={active}
        onChange={updateApp}
        onClose={() => setActiveId(null)}
        settings={settings}
        setSetting={setSetting}
        aiEnabled={aiEnabled}
      />
    );
  }

  return (
    <main className="main" style={{ width: '100%' }}>
      <div className="main-head">
        <div>
          <h1>Applications</h1>
          <div className="subtitle">
            {apps.length === 0
              ? 'One tailored resume per job you apply to.'
              : `${apps.length} application${apps.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <div className="actions">
          <Button variant="primary" icon={Icon.Plus} onClick={createApp}>
            New application
          </Button>
        </div>
      </div>
      <div className="main-body scroller">
        <div className="list">
          {apps.length === 0 ? (
            <div className="empty">
              <div className="e-title">No applications yet</div>
              <div className="e-sub">
                Create one, paste the job description, and pick what to include from your library.
              </div>
              <Button variant="primary" icon={Icon.Plus} onClick={createApp}>
                New application
              </Button>
            </div>
          ) : (
            apps.map((app) => {
              const bullets = countSelectedBullets(applySelection(data, app));
              return (
                <div key={app.id} className="card app-card" onClick={() => setActiveId(app.id)}>
                  <div className="card-head" style={{ cursor: 'pointer' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="title-line">
                        <span className="t-title">{app.role || 'Untitled role'}</span>
                        <span className="t-sub">· {app.company || 'Company'}</span>
                      </div>
                      <div className="meta-line">
                        <span className={'badge' + (app.status === 'draft' ? ' warn' : '')}>
                          {STATUS_LABELS[app.status]}
                        </span>
                        <span className="dot" />
                        <span>{bullets} bullets selected</span>
                        <span className="dot" />
                        <span className="mono-num">
                          {new Date(app.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="row" style={{ gap: 2 }} onClick={(e) => e.stopPropagation()}>
                      <select
                        className="input"
                        style={{ height: 26, width: 'auto', fontSize: 12 }}
                        value={app.status}
                        onChange={(e) =>
                          updateApp({ ...app, status: e.target.value as ApplicationStatus })
                        }
                      >
                        {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Icon.Trash}
                        tip="Delete application"
                        onClick={() => deleteApp(app)}
                      />
                    </span>
                    <span className="chev">
                      <Icon.ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
