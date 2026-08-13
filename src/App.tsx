import { useEffect, useMemo, useState } from 'react';

import type { Application, ResumeData } from './types/resume';
import {
  loadResumeData,
  saveResumeData,
  getEmptyResumeData,
  loadApplications,
  saveApplications,
  loadSettings,
  saveSettings,
  type AppSettings,
} from './utils/storage';
import { exportToJson, importFromJsonFile, generateId } from './utils/export';
import { parseResume, fileToBase64 } from './lib/ai';

import { useUndoRedo } from './hooks/useUndoRedo';
import { useTags } from './hooks/useTags';
import { useSaveStatus } from './hooks/useSaveStatus';
import { useKeyboard } from './hooks/useKeyboard';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';

import { Button } from './components/ui/Button';
import { SaveStatus } from './components/ui/SaveStatus';
import { Icon, Kbd } from './components/ui/Icons';

import { JobCard } from './components/Editor/JobCard';
import { SkillCategoryCard } from './components/Editor/SkillCategoryCard';
import { EducationCard } from './components/Editor/EducationCard';
import { ProjectCard } from './components/Editor/ProjectCard';
import { PersonalInfoEditor } from './components/Editor/PersonalInfoEditor';
import { BulkBar } from './components/Editor/BulkBar';
import { useDragReorder, reorderById } from './components/Editor/useDragReorder';

import { TagManager } from './components/TagManager/TagManager';
import { CommandPalette, type CommandTarget } from './components/CommandPalette/CommandPalette';
import { ApplicationsView } from './components/Applications/ApplicationsView';
import { AuthModal } from './components/Auth/AuthModal';

type SectionKey = 'personal' | 'jobs' | 'skills' | 'education' | 'projects';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: typeof Icon.User }> = [
  { key: 'personal', label: 'Personal Info', icon: Icon.User },
  { key: 'jobs', label: 'Work Experience', icon: Icon.Briefcase },
  { key: 'skills', label: 'Skills', icon: Icon.Wrench },
  { key: 'education', label: 'Education', icon: Icon.GraduationCap },
  { key: 'projects', label: 'Projects', icon: Icon.Folder },
];

export default function App() {
  // ── Settings (theme/density/template/font) ────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  useEffect(() => {
    saveSettings(settings);
    const r = document.documentElement;
    r.dataset.mode = settings.dark ? 'dark' : 'light';
    r.dataset.aesthetic = settings.aesthetic;
    r.dataset.density = settings.density;
  }, [settings]);

  const setSetting = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  // ── Resume data with undo/redo + localStorage persistence ─────────────────
  const initialData = useMemo<ResumeData>(() => loadResumeData() || getEmptyResumeData(), []);
  const { state: data, set: setData, undo, redo, replace, canUndo, canRedo } = useUndoRedo(initialData);
  const saveStatus = useSaveStatus(data, 700);

  useEffect(() => {
    saveResumeData(data);
  }, [data]);

  // ── Applications (per-job tailored resumes) ───────────────────────────────
  const [apps, setApps] = useState<Application[]>(loadApplications);
  useEffect(() => {
    saveApplications(apps);
  }, [apps]);

  // ── Auth + cloud sync ─────────────────────────────────────────────────────
  const auth = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const syncState = useSync({
    user: auth.user,
    data,
    apps,
    onRemote: (remoteResume, remoteApps) => {
      if (remoteResume) replace(remoteResume);
      if (remoteApps.length) setApps(() => remoteApps);
      setAuthOpen(false);
    },
  });

  // ── App state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'edit' | 'applications'>('edit');
  const [section, setSection] = useState<SectionKey>('jobs');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tagMgrOpen, setTagMgrOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [selectedBullets, setSelectedBullets] = useState<Set<string>>(() => new Set());

  // Derive allTags + tagCounts
  const { allTags, tagCounts } = useTags(data);

  // Hotkeys
  useKeyboard('mod+k', () => setCmdOpen((o) => !o), []);
  useKeyboard('mod+z', () => undo(), [undo]);
  useKeyboard('mod+shift+z', () => redo(), [redo]);

  // Editor section drag-reorder (jobs / skill cats / education / projects)
  const editorDnd = useDragReorder((from, to) => {
    if (section === 'jobs') setData((d) => ({ ...d, jobs: reorderById(d.jobs, from, to) }));
    if (section === 'skills')
      setData((d) => ({ ...d, skillCategories: reorderById(d.skillCategories, from, to) }));
    if (section === 'education')
      setData((d) => ({ ...d, education: reorderById(d.education, from, to) }));
    if (section === 'projects')
      setData((d) => ({ ...d, projects: reorderById(d.projects, from, to) }));
  });

  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const onSelectBullet = (id: string) =>
    setSelectedBullets((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Bulk operations
  const bulkAddTag = (tag: string) => {
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) => ({
        ...j,
        bullets: j.bullets.map((b) =>
          selectedBullets.has(b.id) && !b.tags.includes(tag) ? { ...b, tags: [...b.tags, tag] } : b,
        ),
      })),
      education: d.education.map((e) => ({
        ...e,
        bullets: e.bullets.map((b) =>
          selectedBullets.has(b.id) && !b.tags.includes(tag) ? { ...b, tags: [...b.tags, tag] } : b,
        ),
      })),
      projects: d.projects.map((p) => ({
        ...p,
        bullets: p.bullets.map((b) =>
          selectedBullets.has(b.id) && !b.tags.includes(tag) ? { ...b, tags: [...b.tags, tag] } : b,
        ),
      })),
    }));
  };
  const bulkDelete = () => {
    if (!confirm(`Delete ${selectedBullets.size} bullets?`)) return;
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) => ({ ...j, bullets: j.bullets.filter((b) => !selectedBullets.has(b.id)) })),
      education: d.education.map((e) => ({ ...e, bullets: e.bullets.filter((b) => !selectedBullets.has(b.id)) })),
      projects: d.projects.map((p) => ({ ...p, bullets: p.bullets.filter((b) => !selectedBullets.has(b.id)) })),
    }));
    setSelectedBullets(new Set());
  };

  // Tag manager global rename / delete
  const globalRename = (oldTag: string, newTag: string) => {
    if (!newTag || newTag === oldTag) return;
    const map = (tags: string[]) =>
      tags.map((t) => (t === oldTag ? newTag : t)).filter((t, i, a) => a.indexOf(t) === i);
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) => ({
        ...j,
        tags: map(j.tags),
        bullets: j.bullets.map((b) => ({ ...b, tags: map(b.tags) })),
      })),
      skillCategories: d.skillCategories.map((c) => ({
        ...c,
        tags: map(c.tags),
        skills: c.skills.map((s) => ({ ...s, tags: map(s.tags) })),
      })),
      education: d.education.map((e) => ({
        ...e,
        tags: map(e.tags),
        bullets: e.bullets.map((b) => ({ ...b, tags: map(b.tags) })),
      })),
      projects: d.projects.map((p) => ({
        ...p,
        tags: map(p.tags),
        bullets: p.bullets.map((b) => ({ ...b, tags: map(b.tags) })),
      })),
    }));
  };
  const globalDelete = (tag: string) => {
    const drop = (tags: string[]) => tags.filter((t) => t !== tag);
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) => ({
        ...j,
        tags: drop(j.tags),
        bullets: j.bullets.map((b) => ({ ...b, tags: drop(b.tags) })),
      })),
      skillCategories: d.skillCategories.map((c) => ({
        ...c,
        tags: drop(c.tags),
        skills: c.skills.map((s) => ({ ...s, tags: drop(s.tags) })),
      })),
      education: d.education.map((e) => ({
        ...e,
        tags: drop(e.tags),
        bullets: e.bullets.map((b) => ({ ...b, tags: drop(b.tags) })),
      })),
      projects: d.projects.map((p) => ({
        ...p,
        tags: drop(p.tags),
        bullets: p.bullets.map((b) => ({ ...b, tags: drop(b.tags) })),
      })),
    }));
  };

  // AI import: resume PDF -> parsed library
  const [importingPdf, setImportingPdf] = useState(false);
  const handleImportPdf = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      setImportingPdf(true);
      try {
        const fileBase64 = await fileToBase64(f);
        const parsed = await parseResume({ fileBase64, mediaType: 'application/pdf' });
        const counts = `${parsed.jobs.length} roles, ${parsed.jobs.reduce((n, j) => n + j.bullets.length, 0)} bullets, ${parsed.skillCategories.length} skill categories`;
        if (!confirm(`Parsed ${counts}. Replace current library? You can Undo afterward.`)) return;
        replace(parsed);
        setExpanded(new Set());
      } catch (e) {
        alert('Import failed: ' + (e as Error).message);
      } finally {
        setImportingPdf(false);
      }
    };
    input.click();
  };

  // Import / Export
  const handleImportJson = async () => {
    try {
      const imported = await importFromJsonFile();
      if (!confirm('Replace current resume data with imported JSON? You can Undo afterward.')) return;
      replace(imported);
      setExpanded(new Set());
    } catch (e) {
      alert('Import failed: ' + (e as Error).message);
    }
  };
  const handleExportJson = () => exportToJson(data);
  const handleClear = () => {
    if (!confirm('Clear ALL resume data? This can be undone with ⌘Z.')) return;
    setData(getEmptyResumeData());
  };

  const sectionCounts: Record<SectionKey, number> = {
    personal: 1,
    jobs: data.jobs.length,
    skills: data.skillCategories.length,
    education: data.education.length,
    projects: data.projects.length,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <svg className="brand-mark" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 1 14.5 9.5 23 12 14.5 14.5 12 23 9.5 14.5 1 12 9.5 9.5Z"
              fill="currentColor"
            />
          </svg>
          <span>CV Studio</span>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        <div className="mode-switch">
          <button className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>
            <Icon.Sliders size={12} stroke={2} /> Edit
          </button>
          <button
            className={mode === 'applications' ? 'active' : ''}
            onClick={() => setMode('applications')}
          >
            <Icon.Sparkles size={12} stroke={2} /> Applications
            {apps.length ? <span className="nav-count">{apps.length}</span> : null}
          </button>
        </div>

        <span style={{ flex: 1 }} />

        <SaveStatus status={saveStatus} />

        {auth.configured ? (
          auth.user ? (
            <Button
              size="sm"
              variant="ghost"
              tip={
                syncState === 'synced'
                  ? 'Synced to cloud — click to sign out'
                  : syncState === 'pulling'
                    ? 'Syncing…'
                    : syncState === 'error'
                      ? 'Sync error — see console'
                      : 'Signed in'
              }
              onClick={() => {
                if (confirm(`Sign out ${auth.user?.email}?`)) auth.signOut();
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 99,
                  background:
                    syncState === 'error' ? 'var(--warn)' : syncState === 'synced' ? 'var(--ok, #4CC58C)' : 'var(--text-faint)',
                }}
              />
              {auth.user.email}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" icon={Icon.User} onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )
        ) : null}

        <button
          className="btn ghost sm"
          onClick={() => setCmdOpen(true)}
          style={{ gap: 8, paddingLeft: 8 }}
        >
          <Icon.Search size={13} />
          <span style={{ color: 'var(--text-muted)' }}>Search</span>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </button>

        <Button size="sm" variant="ghost" icon={Icon.Tags} onClick={() => setTagMgrOpen(true)} tip="Tag manager">
          Tags
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={!canUndo}
          icon={Icon.Undo}
          onClick={undo}
          tip="Undo (⌘Z)"
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={!canRedo}
          icon={Icon.Redo}
          onClick={redo}
          tip="Redo (⌘⇧Z)"
        />
        <Button
          size="sm"
          variant="ghost"
          icon={settings.dark ? Icon.Sun : Icon.Moon}
          onClick={() => setSetting('dark', !settings.dark)}
          tip={settings.dark ? 'Light mode' : 'Dark mode'}
        />
      </div>

      {mode === 'edit' ? (
        <div className="body">
          <aside className="sidebar">
            <div className="sidebar-head">Sections</div>
            <nav className="sidebar-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  className={'nav-item' + (section === s.key ? ' active' : '')}
                  onClick={() => setSection(s.key)}
                >
                  <span className="nav-icon"><s.icon size={15} /></span>
                  <span className="nav-label">{s.label}</span>
                  <span className="nav-count">{sectionCounts[s.key]}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-foot">
              <Button
                size="sm"
                variant="ghost"
                icon={Icon.Sparkles}
                disabled={!auth.user || importingPdf}
                onClick={handleImportPdf}
                tip={auth.user ? 'Parse a resume PDF into your library with AI' : 'Sign in to import a PDF'}
              >
                {importingPdf ? 'Parsing…' : 'Import resume (PDF)'}
              </Button>
              <Button size="sm" variant="ghost" icon={Icon.Upload} onClick={handleImportJson}>
                Import JSON
              </Button>
              <Button size="sm" variant="ghost" icon={Icon.Download} onClick={handleExportJson}>
                Export JSON
              </Button>
              {(data.jobs.length || data.skillCategories.length || data.education.length || data.projects.length) ? (
                <Button size="sm" variant="ghost" icon={Icon.Trash} onClick={handleClear}>
                  Clear all data
                </Button>
              ) : null}
            </div>
          </aside>

          <main className="main">
            <EditorSection
              section={section}
              data={data}
              setData={setData}
              expanded={expanded}
              setExpanded={setExpanded}
              allTags={allTags}
              tagCounts={tagCounts}
              chipVariant={settings.chipVariant}
              editorDnd={editorDnd}
              selectedBullets={selectedBullets}
              onSelectBullet={onSelectBullet}
              toggleExpanded={toggleExpanded}
            />
          </main>
        </div>
      ) : (
        <div className="body no-sidebar">
          <ApplicationsView
            data={data}
            apps={apps}
            setApps={setApps}
            settings={settings}
            setSetting={setSetting}
            aiEnabled={!!auth.user}
          />
        </div>
      )}

      {selectedBullets.size > 0 && mode === 'edit' && (
        <BulkBar
          count={selectedBullets.size}
          allTags={allTags}
          tagCounts={tagCounts}
          onAddTag={bulkAddTag}
          onDelete={bulkDelete}
          onClear={() => setSelectedBullets(new Set())}
        />
      )}

      {cmdOpen && (
        <CommandPalette
          data={data}
          onClose={() => setCmdOpen(false)}
          onJump={(target: CommandTarget) => {
            setCmdOpen(false);
            setSection(target.section);
            if (target.parentId) setExpanded((s) => new Set([...s, target.parentId!]));
          }}
        />
      )}

      <TagManager
        open={tagMgrOpen}
        onClose={() => setTagMgrOpen(false)}
        data={data}
        onRename={globalRename}
        onDelete={globalDelete}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onEmail={auth.signInWithEmail}
        onGithub={auth.signInWithGithub}
      />
    </div>
  );
}

// ── Editor section frame ────────────────────────────────────────────────────
interface EditorSectionProps {
  section: SectionKey;
  data: ResumeData;
  setData: (updater: (prev: ResumeData) => ResumeData) => void;
  expanded: Set<string>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  allTags: string[];
  tagCounts: Record<string, number>;
  chipVariant: AppSettings['chipVariant'];
  editorDnd: ReturnType<typeof useDragReorder>;
  selectedBullets: Set<string>;
  onSelectBullet: (id: string) => void;
  toggleExpanded: (id: string) => void;
}

function EditorSection(props: EditorSectionProps) {
  const {
    section, data, setData, expanded, setExpanded,
    allTags, tagCounts, chipVariant, editorDnd,
    selectedBullets, onSelectBullet, toggleExpanded,
  } = props;

  if (section === 'personal') {
    return (
      <>
        <Head title="Personal Info" subtitle="Contact info shown at the top of every generated resume." />
        <div className="main-body scroller">
          <PersonalInfoEditor
            info={data.personalInfo}
            onChange={(pi) => setData((d) => ({ ...d, personalInfo: pi }))}
          />
        </div>
      </>
    );
  }

  if (section === 'jobs') {
    const onAdd = () => {
      const n = { id: generateId(), company: '', title: '', startDate: '', endDate: '', tags: [], bullets: [] };
      setData((d) => ({ ...d, jobs: [n, ...d.jobs] }));
      setExpanded((s) => new Set([...s, n.id]));
    };
    return (
      <>
        <Head
          title="Work Experience"
          subtitle={`${data.jobs.length} role${data.jobs.length === 1 ? '' : 's'} · ${data.jobs.reduce(
            (n, j) => n + j.bullets.length,
            0,
          )} bullets · master resume`}
          onAdd={onAdd}
          addLabel="Add role"
        />
        <div className="main-body scroller">
          <div className="list">
            {data.jobs.length === 0 ? (
              <EmptyState title="No roles yet" sub="Start your master resume by adding the first role." onAdd={onAdd} addLabel="Add role" />
            ) : (
              data.jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  expanded={expanded.has(j.id)}
                  onToggle={() => toggleExpanded(j.id)}
                  onChange={(nj) =>
                    setData((d) => ({ ...d, jobs: d.jobs.map((x) => (x.id === nj.id ? nj : x)) }))
                  }
                  onDelete={() => {
                    if (confirm(`Delete role at ${j.company}?`)) {
                      setData((d) => ({ ...d, jobs: d.jobs.filter((x) => x.id !== j.id) }));
                    }
                  }}
                  allTags={allTags}
                  tagCounts={tagCounts}
                  chipVariant={chipVariant}
                  dragHandlers={editorDnd}
                  selectedBullets={selectedBullets}
                  onSelectBullet={onSelectBullet}
                />
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  if (section === 'skills') {
    const onAdd = () => {
      const n = { id: generateId(), name: '', skills: [], tags: [] };
      setData((d) => ({ ...d, skillCategories: [...d.skillCategories, n] }));
      setExpanded((s) => new Set([...s, n.id]));
    };
    return (
      <>
        <Head
          title="Skills"
          subtitle={`${data.skillCategories.length} categor${data.skillCategories.length === 1 ? 'y' : 'ies'}`}
          onAdd={onAdd}
          addLabel="Add category"
        />
        <div className="main-body scroller">
          <div className="list">
            {data.skillCategories.length === 0 ? (
              <EmptyState title="No skill categories" sub="Group skills by area: Languages, Cloud, Leadership…" onAdd={onAdd} addLabel="Add category" />
            ) : (
              data.skillCategories.map((c) => (
                <SkillCategoryCard
                  key={c.id}
                  cat={c}
                  expanded={expanded.has(c.id)}
                  onToggle={() => toggleExpanded(c.id)}
                  onChange={(nc) =>
                    setData((d) => ({
                      ...d,
                      skillCategories: d.skillCategories.map((x) => (x.id === nc.id ? nc : x)),
                    }))
                  }
                  onDelete={() =>
                    setData((d) => ({
                      ...d,
                      skillCategories: d.skillCategories.filter((x) => x.id !== c.id),
                    }))
                  }
                  allTags={allTags}
                  tagCounts={tagCounts}
                  chipVariant={chipVariant}
                  dragHandlers={editorDnd}
                />
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  if (section === 'education') {
    const onAdd = () => {
      const n = { id: generateId(), institution: '', degree: '', tags: [], bullets: [] };
      setData((d) => ({ ...d, education: [...d.education, n] }));
      setExpanded((s) => new Set([...s, n.id]));
    };
    return (
      <>
        <Head
          title="Education"
          subtitle={`${data.education.length} entr${data.education.length === 1 ? 'y' : 'ies'}`}
          onAdd={onAdd}
          addLabel="Add education"
        />
        <div className="main-body scroller">
          <div className="list">
            {data.education.length === 0 ? (
              <EmptyState title="No education entries" sub="" onAdd={onAdd} addLabel="Add education" />
            ) : (
              data.education.map((e) => (
                <EducationCard
                  key={e.id}
                  ed={e}
                  expanded={expanded.has(e.id)}
                  onToggle={() => toggleExpanded(e.id)}
                  onChange={(ne) =>
                    setData((d) => ({ ...d, education: d.education.map((x) => (x.id === ne.id ? ne : x)) }))
                  }
                  onDelete={() => setData((d) => ({ ...d, education: d.education.filter((x) => x.id !== e.id) }))}
                  allTags={allTags}
                  tagCounts={tagCounts}
                  chipVariant={chipVariant}
                  dragHandlers={editorDnd}
                  selectedBullets={selectedBullets}
                  onSelectBullet={onSelectBullet}
                />
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  // projects
  const onAdd = () => {
    const n = { id: generateId(), name: '', tags: [], bullets: [] };
    setData((d) => ({ ...d, projects: [n, ...d.projects] }));
    setExpanded((s) => new Set([...s, n.id]));
  };
  return (
    <>
      <Head
        title="Projects"
        subtitle={`${data.projects.length} project${data.projects.length === 1 ? '' : 's'}`}
        onAdd={onAdd}
        addLabel="Add project"
      />
      <div className="main-body scroller">
        <div className="list">
          {data.projects.length === 0 ? (
            <EmptyState title="No projects" sub="Side projects, OSS, anything you want to highlight." onAdd={onAdd} addLabel="Add project" />
          ) : (
            data.projects.map((p) => (
              <ProjectCard
                key={p.id}
                pr={p}
                expanded={expanded.has(p.id)}
                onToggle={() => toggleExpanded(p.id)}
                onChange={(np) =>
                  setData((d) => ({ ...d, projects: d.projects.map((x) => (x.id === np.id ? np : x)) }))
                }
                onDelete={() => setData((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id) }))}
                allTags={allTags}
                tagCounts={tagCounts}
                chipVariant={chipVariant}
                dragHandlers={editorDnd}
                selectedBullets={selectedBullets}
                onSelectBullet={onSelectBullet}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Head(props: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="main-head">
      <div>
        <h1>{props.title}</h1>
        {props.subtitle ? <div className="subtitle">{props.subtitle}</div> : null}
      </div>
      {props.onAdd ? (
        <div className="actions">
          <Button variant="primary" icon={Icon.Plus} onClick={props.onAdd}>
            {props.addLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState(props: { title: string; sub: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="empty">
      <div className="e-title">{props.title}</div>
      {props.sub ? <div className="e-sub">{props.sub}</div> : null}
      <Button variant="primary" icon={Icon.Plus} onClick={props.onAdd}>
        {props.addLabel}
      </Button>
    </div>
  );
}
