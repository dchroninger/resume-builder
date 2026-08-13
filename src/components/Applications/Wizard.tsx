import { useMemo, useState } from 'react';
import type { Application, ResumeData } from '../../types/resume';
import type { AppSettings } from '../../utils/storage';
import { applySelection, countSelectedBullets, pruneSelection } from '../../utils/selection';
import { analyzeJd, tailorResume } from '../../lib/ai';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { AutoTextarea } from '../ui/AutoTextarea';
import { SelectStep } from './SelectStep';
import { PreviewStep } from './PreviewStep';

export type WizardStep = 'job' | 'select' | 'preview';

const STEPS: Array<{ key: WizardStep; label: string }> = [
  { key: 'job', label: 'Job' },
  { key: 'select', label: 'Select content' },
  { key: 'preview', label: 'Preview & export' },
];

interface WizardProps {
  data: ResumeData;
  app: Application;
  onChange: (next: Application) => void;
  onClose: () => void;
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  aiEnabled: boolean;
}

export function Wizard({ data, app, onChange, onClose, settings, setSetting, aiEnabled }: WizardProps) {
  const [step, setStep] = useState<WizardStep>(app.company || app.jdText ? 'select' : 'job');
  const [tailoring, setTailoring] = useState(false);
  const [aiError, setAiError] = useState('');

  const filtered = useMemo(() => applySelection(data, app), [data, app]);
  const bulletCount = useMemo(() => countSelectedBullets(filtered), [filtered]);

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const onTailor = async () => {
    if (!app.jdText) {
      setAiError('Add the job description first (step 1).');
      setStep('job');
      return;
    }
    setTailoring(true);
    setAiError('');
    try {
      const result = await tailorResume({
        resumeData: data,
        jdText: app.jdText,
        jdAnalysis: app.jdAnalysis,
      });
      const overrides: Record<string, string> = {};
      for (const o of result.overrides) overrides[o.bulletId] = o.text;
      onChange({
        ...app,
        included: {
          // The agent returns ids only — its schema has no summaryId/variantIds,
          // so a wholesale replace would silently drop both. Carry them over.
          ...pruneSelection(data, result.included),
          summaryId: app.included.summaryId,
          variantIds: app.included.variantIds,
        },
        overrides,
        gaps: result.gaps,
        jdAnalysis: app.jdAnalysis
          ? { ...app.jdAnalysis, notes: result.rationale }
          : { keywords: [], requirements: [], notes: result.rationale },
      });
      setStep('select');
    } catch (e) {
      setAiError('Tailoring failed: ' + (e as Error).message);
    } finally {
      setTailoring(false);
    }
  };

  return (
    <main className="main" style={{ width: '100%' }}>
      <div className="main-head wiz-head">
        <div className="row" style={{ gap: 10, minWidth: 0 }}>
          <Button size="sm" variant="ghost" icon={Icon.Undo} onClick={onClose} tip="Back to applications">
            All applications
          </Button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {app.role || 'Untitled role'}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                {' '}· {app.company || 'Company'}
              </span>
            </h1>
          </div>
        </div>
        <div className="wiz-steps">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              className={'wiz-step' + (step === s.key ? ' active' : '') + (i < stepIdx ? ' done' : '')}
              onClick={() => setStep(s.key)}
            >
              <span className="wiz-num">{i < stepIdx ? <Icon.Check size={11} stroke={2.5} /> : i + 1}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="actions row" style={{ gap: 8 }}>
          <span className="badge" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {bulletCount} bullets
          </span>
          {step === 'select' ? (
            <Button
              icon={Icon.Sparkles}
              disabled={!aiEnabled || tailoring}
              onClick={onTailor}
              tip={
                !aiEnabled
                  ? 'Sign in to use AI tailoring'
                  : 'Let the agent pick and rephrase bullets for this job'
              }
            >
              {tailoring ? 'Tailoring…' : 'Tailor with AI'}
            </Button>
          ) : null}
          {step !== 'preview' ? (
            <Button variant="primary" onClick={() => setStep(STEPS[stepIdx + 1].key)}>
              Next: {STEPS[stepIdx + 1].label}
            </Button>
          ) : null}
        </div>
      </div>

      {aiError ? (
        <div className="wiz-error">
          {aiError}
          <Button size="sm" variant="ghost" icon={Icon.X} onClick={() => setAiError('')} />
        </div>
      ) : null}

      {step === 'job' ? (
        <div className="main-body scroller">
          <JobStep app={app} onChange={onChange} aiEnabled={aiEnabled} onError={setAiError} />
        </div>
      ) : step === 'select' ? (
        <SelectStep data={data} app={app} onChange={onChange} />
      ) : (
        <PreviewStep
          data={data}
          app={app}
          onChange={onChange}
          filtered={filtered}
          bulletCount={bulletCount}
          settings={settings}
          setSetting={setSetting}
          aiEnabled={aiEnabled}
        />
      )}
    </main>
  );
}

// ── Step 1: job details + JD ────────────────────────────────────────────────

function JobStep({
  app,
  onChange,
  aiEnabled,
  onError,
}: {
  app: Application;
  onChange: (a: Application) => void;
  aiEnabled: boolean;
  onError: (msg: string) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);

  const set = <K extends keyof Application>(k: K, v: Application[K]) =>
    onChange({ ...app, [k]: v });

  const onAnalyze = async () => {
    if (!app.jdUrl && !app.jdText) {
      onError('Paste a job posting URL or the description text first.');
      return;
    }
    setAnalyzing(true);
    onError('');
    try {
      const { analysis, jdText } = await analyzeJd(
        app.jdText ? { text: app.jdText } : { url: app.jdUrl },
      );
      onChange({
        ...app,
        company: app.company || analysis.company || '',
        role: app.role || analysis.role || '',
        jdText: app.jdText || jdText,
        jdAnalysis: analysis,
      });
    } catch (e) {
      onError('Analysis failed: ' + (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="grid-2">
        <div className="field">
          <label className="field-label">Company</label>
          <input
            className="input"
            value={app.company}
            placeholder="Acme Corp"
            onChange={(e) => set('company', e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label">Role</label>
          <input
            className="input"
            value={app.role}
            placeholder="Senior Software Engineer"
            onChange={(e) => set('role', e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label className="field-label">Job posting URL</label>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            value={app.jdUrl || ''}
            placeholder="https://…"
            onChange={(e) => set('jdUrl', e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            icon={Icon.Sparkles}
            disabled={!aiEnabled || analyzing}
            onClick={onAnalyze}
            tip={aiEnabled ? 'Fetch and analyze the posting' : 'Sign in to use AI analysis'}
          >
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </Button>
        </div>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label className="field-label">Job description</label>
        <AutoTextarea
          singleLine={false}
          value={app.jdText || ''}
          placeholder="Paste the job description here (or provide a URL above and hit Analyze)…"
          onChange={(e) => set('jdText', e.target.value)}
          style={{ minHeight: 220 }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
          Used by the tailoring agent to pick and rewrite bullets. Optional for manual selection.
        </div>
      </div>

      {app.jdAnalysis ? (
        <div className="jd-analysis">
          <div className="fg-head" style={{ marginBottom: 6 }}>
            <Icon.Sparkles size={12} /> <span>Analysis</span>
          </div>
          {app.jdAnalysis.keywords.length ? (
            <div className="row" style={{ flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {app.jdAnalysis.keywords.map((k) => (
                <span key={k} className="badge">{k}</span>
              ))}
            </div>
          ) : null}
          {app.jdAnalysis.requirements.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {app.jdAnalysis.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
          {app.jdAnalysis.tone ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Tone: {app.jdAnalysis.tone}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
