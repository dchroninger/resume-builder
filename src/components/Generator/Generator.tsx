import { useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { ResumeData, TemplateType, FilteredResumeData } from '../../types/resume';
import { applyFilters, countFilteredBullets } from '../../utils/filter';
import { NS_ORDER, parseTag, nsColor, type Namespace } from '../../utils/tag-namespace';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Icon } from '../ui/Icons';
import { Chip } from '../TagInput/Chip';
import { ResumeSheet } from '../Preview/ResumeSheet';
import { ResumePDF } from '../PDF/ResumePDF';
import { usePresets } from '../../hooks/usePresets';
import { exportToJson, download } from '../../utils/export';
import { exportMarkdown } from '../../utils/export-markdown';
import { exportPlainText } from '../../utils/export-text';

interface GeneratorProps {
  data: ResumeData;
  allTags: string[];
  template: TemplateType;
  setTemplate: (v: TemplateType) => void;
  font: 'sans' | 'plex' | 'serif';
  setFont: (v: 'sans' | 'plex' | 'serif') => void;
}

export function Generator({
  data, allTags,
  template, setTemplate, font, setFont,
}: GeneratorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [logicByNs, setLogicByNs] = useState<Record<string, 'or' | 'and'>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hideSections, setHideSections] = useState<{ jobs?: boolean; skills?: boolean; education?: boolean; projects?: boolean }>({});
  const [previewScale, setPreviewScale] = useState(0.78);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { presets, create, remove } = usePresets();

  const filtered: FilteredResumeData = useMemo(
    () => applyFilters(data, { selected, logicByNs }),
    [data, selected, logicByNs],
  );
  const bulletCount = useMemo(() => countFilteredBullets(filtered), [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, Set<string>> = {};
    allTags.forEach((t) => {
      const { ns } = parseTag(t);
      (g[ns] ||= new Set()).add(t);
    });
    return NS_ORDER
      .map((ns) => ({ ns, tags: g[ns] ? Array.from(g[ns]).sort() : [] }))
      .filter((x) => x.tags.length);
  }, [allTags]);

  const toggleTag = (t: string) => {
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
    setActivePreset(null);
  };
  const clearAll = () => {
    setSelected([]);
    setLogicByNs({});
    setActivePreset(null);
  };
  const setLogic = (ns: string, mode: 'or' | 'and') =>
    setLogicByNs((l) => ({ ...l, [ns]: mode }));

  const onSavePreset = () => {
    const name = prompt('Preset name', `Preset ${presets.length + 1}`);
    if (!name) return;
    const id = create(name, selected, logicByNs);
    setActivePreset(id);
  };

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const doc = (
        <ResumePDF
          data={filtered}
          template={template}
          font={font}
          hideSections={hideSections}
        />
      );
      const blob = await pdf(doc).toBlob();
      const safeName =
        (data.personalInfo.name || 'resume').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume';
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
        {/* Presets */}
        <div style={{ marginBottom: 6 }}>
          <div className="fg-head" style={{ marginBottom: 6 }}>
            <span>Presets</span>
            <span className="grow" />
            <Button size="sm" variant="ghost" icon={Icon.Plus} onClick={onSavePreset} tip="Save current filter as preset">
              Save
            </Button>
          </div>
          <div className="preset-bar">
            {presets.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: 11, padding: '4px 4px 0' }}>
                No saved presets yet. Tune the filter, then click Save.
              </div>
            ) : (
              presets.map((p) => (
                <div
                  key={p.id}
                  className={'preset' + (activePreset === p.id ? ' active' : '')}
                  onClick={() => {
                    setSelected(p.tags);
                    setLogicByNs(p.logicByNs || {});
                    setActivePreset(p.id);
                  }}
                >
                  <Icon.Star size={11} />
                  {p.name}
                  <span
                    className="x"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(p.id);
                      if (activePreset === p.id) setActivePreset(null);
                    }}
                  >
                    <Icon.X size={10} />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div
              style={{
                fontSize: 'var(--fs-xl)',
                fontWeight: 600,
                color: bulletCount === 0 ? 'var(--warn)' : 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {bulletCount}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>
              bullets across <span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.jobs.length}</span> roles
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {selected.length === 0 ? (
              'No filters — showing full master resume.'
            ) : (
              <>
                Cross-namespace:{' '}
                <span
                  className="mono"
                  style={{ background: 'var(--surface-2)', padding: '0 4px', borderRadius: 3 }}
                >
                  AND
                </span>
                . Within a namespace, choose OR/AND below.
              </>
            )}
          </div>
          {selected.length ? (
            <div style={{ marginTop: 8 }}>
              <Button size="sm" variant="ghost" onClick={clearAll}>Clear all</Button>
            </div>
          ) : null}
        </div>

        {/* Filter groups */}
        <div>
          {grouped.map((g) => {
            const isCollapsed = collapsed[g.ns];
            const nsSel = g.tags.filter((t) => selected.includes(t)).length;
            const mode = logicByNs[g.ns] || 'or';
            return (
              <div className="filter-group" key={g.ns}>
                <div
                  className="fg-head"
                  onClick={() => setCollapsed((c) => ({ ...c, [g.ns]: !c[g.ns] }))}
                >
                  <span
                    className="ns-swatch"
                    style={{ ['--ns-color' as string]: nsColor(g.ns as Namespace) }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{g.ns}</span>
                  {nsSel ? (
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontVariantNumeric: 'tabular-nums',
                        textTransform: 'none',
                        letterSpacing: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                      }}
                    >
                      {nsSel}/{g.tags.length}
                    </span>
                  ) : null}
                  <span className="grow" />
                  {nsSel > 1 ? (
                    <span className="logic" onClick={(e) => e.stopPropagation()}>
                      <button className={mode === 'or' ? 'on' : ''} onClick={() => setLogic(g.ns, 'or')}>OR</button>
                      <button className={mode === 'and' ? 'on' : ''} onClick={() => setLogic(g.ns, 'and')}>AND</button>
                    </span>
                  ) : null}
                  <span
                    style={{
                      color: 'var(--text-faint)',
                      transform: isCollapsed ? 'none' : 'rotate(90deg)',
                      transition: 'transform 180ms',
                    }}
                  >
                    <Icon.ChevronRight size={12} />
                  </span>
                </div>
                {!isCollapsed ? (
                  <div className="fg-list">
                    {g.tags.map((t) => {
                      const on = selected.includes(t);
                      return (
                        <span key={t} onClick={() => toggleTag(t)}>
                          <Chip tag={t} variant={on ? 'bar' : 'outline'} size="sm" />
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Sections */}
        <div className="filter-group">
          <div className="fg-head"><span>Sections</span></div>
          {[
            ['jobs', 'Experience', data.jobs.length],
            ['skills', 'Skills', data.skillCategories.length],
            ['projects', 'Projects', data.projects.length],
            ['education', 'Education', data.education.length],
          ].map(([k, label, n]) => (
            <div
              key={k as string}
              className={'section-toggle' + (hideSections[k as keyof typeof hideSections] ? ' off' : '')}
            >
              <div className="st-label">
                <Icon.Square size={12} />
                {label}
                <span className="st-count">{n}</span>
              </div>
              <Switch
                checked={!hideSections[k as keyof typeof hideSections]}
                onChange={(v) =>
                  setHideSections((h) => ({ ...h, [k as keyof typeof hideSections]: !v }))
                }
              />
            </div>
          ))}
        </div>

        {/* Template */}
        <div className="filter-group">
          <div className="fg-head"><span>Template</span></div>
          <div className="tpl-grid">
            <div
              className={'tpl-thumb' + (template === 'single-column' ? ' active' : '')}
              onClick={() => setTemplate('single-column')}
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
              onClick={() => setTemplate('two-column')}
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
                  onClick={() => setFont(k)}
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
              onClick={() => exportToJson(filtered, 'resume-filtered.json')}
            >
              Export filtered JSON
            </Button>
            <div
              style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4, padding: '0 4px', lineHeight: 1.4 }}
            >
              PDF uses @react-pdf/renderer with the current template, accent, and font.
            </div>
          </div>
        </div>
      </div>

      {/* Preview pane */}
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
            Preview · {template === 'two-column' ? 'Two column' : 'Single column'}
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
          {bulletCount === 0 && selected.length ? (
            <div className="empty" style={{ alignSelf: 'flex-start', maxWidth: 480, marginTop: 60 }}>
              <div className="e-title">No bullets match your filter.</div>
              <div className="e-sub">Try loosening a namespace to OR, or remove a filter.</div>
              <Button variant="primary" onClick={clearAll}>Clear all filters</Button>
            </div>
          ) : (
            <div
              style={{
                transformOrigin: 'top center',
                transform: `scale(${previewScale})`,
                height: 1056 * previewScale,
              }}
            >
              <ResumeSheet
                data={filtered}
                template={template}
                font={font}
                hideSections={hideSections}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
