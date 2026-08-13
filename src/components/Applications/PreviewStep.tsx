import { useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { Application, FilteredResumeData, ResumeData } from '../../types/resume';
import type { AppSettings } from '../../utils/storage';
import { generateCoverLetter } from '../../lib/ai';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';
import { AutoTextarea } from '../ui/AutoTextarea';
import { ResumeSheet } from '../Preview/ResumeSheet';
import { ResumePDF } from '../PDF/ResumePDF';
import { download, exportToJson } from '../../utils/export';
import { exportMarkdown } from '../../utils/export-markdown';
import { exportPlainText } from '../../utils/export-text';

interface PreviewStepProps {
  data: ResumeData;
  app: Application;
  onChange: (next: Application) => void;
  filtered: FilteredResumeData;
  bulletCount: number;
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  aiEnabled: boolean;
}

export function PreviewStep({
  data, app, onChange, filtered, bulletCount, settings, setSetting, aiEnabled,
}: PreviewStepProps) {
  const [previewScale, setPreviewScale] = useState(0.78);
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [letterError, setLetterError] = useState('');
  const [showLetter, setShowLetter] = useState(!!app.coverLetter);

  const onGenerateLetter = async () => {
    if (!app.jdText) {
      setLetterError('Add the job description in step 1 first.');
      return;
    }
    setGenerating(true);
    setLetterError('');
    try {
      const { coverLetter } = await generateCoverLetter({
        resumeData: filtered,
        jdText: app.jdText,
        company: app.company,
        role: app.role,
      });
      onChange({ ...app, coverLetter });
      setShowLetter(true);
    } catch (e) {
      setLetterError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const { template, font } = settings;

  // Sections with nothing selected disappear from the output.
  const hideSections = useMemo(
    () => ({
      jobs: filtered.jobs.length === 0,
      skills: filtered.skillCategories.length === 0,
      education: filtered.education.length === 0,
      projects: filtered.projects.length === 0,
    }),
    [filtered],
  );

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const doc = (
        <ResumePDF data={filtered} template={template} font={font} hideSections={hideSections} />
      );
      const blob = await pdf(doc).toBlob();
      const safeName =
        (data.personalInfo.name || 'resume').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ||
        'resume';
      download(`${safeName}.pdf`, blob);
    } catch (e) {
      console.error(e);
      alert('PDF export failed: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="gen-layout">
      <div className="gen-controls scroller">
        {/* Template */}
        <div className="filter-group">
          <div className="fg-head"><span>Template</span></div>
          <div className="tpl-grid">
            <div
              className={'tpl-thumb' + (template === 'modern' ? ' active' : '')}
              onClick={() => setSetting('template', 'modern')}
            >
              <div className="preview">
                <div className="ln dk" style={{ width: '45%', height: 5 }} />
                <div className="ln acc" style={{ width: 14, height: 3 }} />
                <div className="ln" style={{ width: '65%' }} />
                <div className="ln dk" style={{ width: '30%', marginTop: 5 }} />
                <div className="ln" /><div className="ln" /><div className="ln" />
                <div className="ln dk" style={{ width: '30%', marginTop: 5 }} />
                <div className="ln" /><div className="ln" />
              </div>
              <div className="lbl">Modern</div>
            </div>
            <div
              className={'tpl-thumb' + (template === 'executive' ? ' active' : '')}
              onClick={() => setSetting('template', 'executive')}
            >
              <div className="preview">
                <div className="ln dk" style={{ width: '50%', height: 4, margin: '0 auto' }} />
                <div className="ln" style={{ width: '60%', margin: '0 auto' }} />
                <div className="ln dk" style={{ width: '100%', height: 1, marginTop: 6 }} />
                <div className="ln" /><div className="ln" /><div className="ln" />
                <div className="ln dk" style={{ width: '100%', height: 1, marginTop: 6 }} />
                <div className="ln" /><div className="ln" />
              </div>
              <div className="lbl">Executive</div>
            </div>
            <div
              className={'tpl-thumb' + (template === 'compact' ? ' active' : '')}
              onClick={() => setSetting('template', 'compact')}
            >
              <div className="preview">
                <div className="ln dk" style={{ width: '35%', height: 4 }} />
                <div className="ln dk" style={{ width: '25%', height: 1, marginTop: 4 }} />
                <div className="ln" /><div className="ln" /><div className="ln" />
                <div className="ln" /><div className="ln" />
                <div className="ln dk" style={{ width: '25%', height: 1, marginTop: 4 }} />
                <div className="ln" /><div className="ln" /><div className="ln" />
              </div>
              <div className="lbl">Compact</div>
            </div>
            <div
              className={'tpl-thumb' + (template === 'sidebar' ? ' active' : '')}
              onClick={() => setSetting('template', 'sidebar')}
            >
              <div className="preview two" style={{ gap: 6 }}>
                <div className="col" style={{ flex: '0 0 30%', background: '#e2e8f0', borderRadius: 2, padding: 3 }}>
                  <div className="ln" style={{ width: '80%' }} />
                  <div className="ln" style={{ width: '70%' }} />
                  <div className="ln" style={{ width: '75%' }} />
                </div>
                <div className="col">
                  <div className="ln dk" style={{ width: '55%', height: 4 }} />
                  <div className="ln acc" style={{ width: 12, height: 3 }} />
                  <div className="ln" /><div className="ln" /><div className="ln" />
                </div>
              </div>
              <div className="lbl">Sidebar</div>
            </div>
            <div
              className={'tpl-thumb' + (template === 'single-column' ? ' active' : '')}
              onClick={() => setSetting('template', 'single-column')}
            >
              <div className="preview">
                <div className="ln dk" style={{ width: '40%', height: 4 }} />
                <div className="ln" style={{ width: '70%' }} />
                <div className="ln acc" />
                <div className="ln" /><div className="ln" /><div className="ln" />
                <div className="ln acc" />
                <div className="ln" /><div className="ln" />
              </div>
              <div className="lbl">Single column</div>
            </div>
            <div
              className={'tpl-thumb' + (template === 'two-column' ? ' active' : '')}
              onClick={() => setSetting('template', 'two-column')}
            >
              <div className="preview two">
                <div className="col">
                  <div className="ln dk" style={{ width: '60%' }} />
                  <div className="ln acc" />
                  <div className="ln" /><div className="ln" /><div className="ln" />
                </div>
                <div className="col">
                  <div className="ln acc" />
                  <div className="ln" /><div className="ln" /><div className="ln" />
                </div>
              </div>
              <div className="lbl">Two column</div>
            </div>
          </div>
        </div>

        {/* Font */}
        <div className="filter-group">
          <div className="fg-head"><span>Resume font</span></div>
          <div className="row" style={{ padding: '0 4px', gap: 6 }}>
            {([['sans', 'Inter'], ['plex', 'IBM Plex'], ['serif', 'Source Serif']] as const).map(
              ([k, label]) => (
                <button
                  key={k}
                  className={'btn sm' + (font === k ? ' primary' : '')}
                  onClick={() => setSetting('font', k)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Export */}
        <div className="filter-group" style={{ borderBottom: 0 }}>
          <div className="fg-head"><span>Export</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 4px' }}>
            <Button icon={Icon.FileDown} variant="primary" onClick={onExportPdf} disabled={exporting}>
              {exporting ? 'Generating PDF…' : 'Export PDF'}
            </Button>
            <Button icon={Icon.Download} onClick={() => exportMarkdown(filtered)}>
              Export Markdown
            </Button>
            <Button icon={Icon.Download} onClick={() => exportPlainText(filtered)}>
              Export plain text
            </Button>
            <Button
              icon={Icon.Download}
              variant="subtle"
              onClick={() => exportToJson(filtered, 'resume-tailored.json')}
            >
              Export tailored JSON
            </Button>
          </div>
        </div>

        {/* Cover letter */}
        <div className="filter-group" style={{ borderBottom: 0 }}>
          <div className="fg-head"><span>Cover letter</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 4px' }}>
            <Button
              icon={Icon.Sparkles}
              disabled={!aiEnabled || generating}
              onClick={onGenerateLetter}
              tip={aiEnabled ? 'Generate from the tailored resume + JD' : 'Sign in to generate a cover letter'}
            >
              {generating ? 'Writing…' : app.coverLetter ? 'Regenerate cover letter' : 'Generate cover letter'}
            </Button>
            {app.coverLetter ? (
              <>
                <Button
                  icon={Icon.Download}
                  variant="subtle"
                  onClick={() => {
                    const safe = (app.company || 'cover-letter').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    download(`${safe}-cover-letter.txt`, new Blob([app.coverLetter!], { type: 'text/plain' }));
                  }}
                >
                  Download .txt
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowLetter((s) => !s)}>
                  {showLetter ? 'Show resume preview' : 'Show cover letter'}
                </Button>
              </>
            ) : null}
            {letterError ? (
              <div style={{ color: 'var(--warn)', fontSize: 11 }}>{letterError}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="gen-preview">
        <div className="preview-toolbar">
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Preview · {{ modern: 'Modern', executive: 'Executive', compact: 'Compact', sidebar: 'Sidebar', 'single-column': 'Single column', 'two-column': 'Two column' }[template]}
          </div>
          <span style={{ flex: 1 }} />
          <div className="row" style={{ gap: 6 }}>
            <Button
              size="sm"
              variant="ghost"
              icon={Icon.Minus}
              onClick={() => setPreviewScale((s) => Math.max(0.4, s - 0.1))}
            />
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {Math.round(previewScale * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={Icon.Plus}
              onClick={() => setPreviewScale((s) => Math.min(1.2, s + 0.1))}
            />
          </div>
        </div>
        <div className="preview-stage scroller">
          {showLetter && app.coverLetter ? (
            <div className="letter-sheet">
              <AutoTextarea
                singleLine={false}
                value={app.coverLetter}
                onChange={(e) => onChange({ ...app, coverLetter: e.target.value })}
              />
            </div>
          ) : bulletCount === 0 ? (
            <div className="empty" style={{ alignSelf: 'flex-start', maxWidth: 480, marginTop: 60 }}>
              <div className="e-title">Nothing selected.</div>
              <div className="e-sub">Go back to Select content and check some bullets.</div>
            </div>
          ) : (
            <div
              style={{
                transformOrigin: 'top center',
                transform: `scale(${previewScale})`,
                height: 1056 * previewScale,
              }}
            >
              <ResumeSheet data={filtered} template={template} font={font} hideSections={hideSections} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
