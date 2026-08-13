// @react-pdf/renderer templates that visually match the HTML preview.
// Used for PDF export only; the on-screen preview stays HTML (cheaper to
// re-render than the PDF document tree).

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Summary, FilteredResumeData, TemplateType, PersonalInfo, Bullet, Skill } from '../../types/resume';
import { fmtDateRange } from '../../utils/date';

type Font = 'sans' | 'plex' | 'serif';

// Keep in sync with --accent in src/index.css.
const ACCENT = '#3B82F6';

interface ResumePDFProps {
  data: FilteredResumeData;
  template: TemplateType;
  font: Font;
  hideSections?: { jobs?: boolean; skills?: boolean; education?: boolean; projects?: boolean };
}

// react-pdf ships these font families by default — no Font.register needed.
const fontFamily = (f: Font) => (f === 'serif' ? 'Times-Roman' : 'Helvetica');
const fontBold = (f: Font) => (f === 'serif' ? 'Times-Bold' : 'Helvetica-Bold');
const fontItalic = (f: Font) => (f === 'serif' ? 'Times-Italic' : 'Helvetica-Oblique');

function makeStyles(accent: string, f: Font, template: TemplateType) {
  // Executive is a serif design regardless of the font toggle.
  const ff: Font = template === 'executive' ? 'serif' : f;
  const modern = template === 'modern';
  const executive = template === 'executive';
  const compact = template === 'compact';
  const singleColumn = template === 'single-column';

  return StyleSheet.create({
    page: {
      paddingTop: compact ? 30 : executive ? 46 : modern ? 44 : 42,
      paddingHorizontal: compact ? 36 : executive ? 56 : modern ? 50 : 48,
      paddingBottom: compact ? 28 : 36,
      fontSize: compact ? 8.5 : 10,
      fontFamily: fontFamily(ff),
      color: '#1A1A1A',
      lineHeight: compact ? 1.32 : executive || modern ? 1.45 : 1.4,
    },
    headerRow: compact
      ? { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }
      : {},
    name: executive
      ? {
          fontSize: 15.5,
          fontFamily: fontBold(ff),
          letterSpacing: 3,
          textAlign: 'center',
          textTransform: 'uppercase',
          marginBottom: 6,
        }
      : {
          fontSize: compact ? 15 : modern ? 24 : 22,
          fontFamily: fontBold(ff),
          letterSpacing: -0.4,
          // 'modern' gets its clearance from the accent bar rendered below the
          // name; everything else here has no spacer element, so at this font
          // size 3pt isn't enough and the contact line visually creeps into
          // the name's descenders.
          marginBottom: compact ? 0 : modern ? 3 : 14,
        },
    accentBar: { width: 34, height: 3.5, backgroundColor: accent, borderRadius: 2, marginTop: 4, marginBottom: 8 },
    contact: compact
      ? { flexDirection: 'column', alignItems: 'flex-end', color: '#52525B', fontSize: 7.5, maxWidth: '46%' }
      : {
          color: executive ? '#3F3F46' : '#555',
          fontSize: 9,
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 12,
          justifyContent: executive ? 'center' : 'flex-start',
        },
    contactPart: { color: executive ? '#3F3F46' : compact ? '#52525B' : '#555' },
    sectionHeading: executive
      ? {
          fontSize: 10,
          fontFamily: fontBold(ff),
          letterSpacing: 2.6,
          color: '#18181B',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginTop: 16,
          marginBottom: 6,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: '#27272A',
        }
      : modern
        ? {
            fontSize: 9.5,
            fontFamily: fontBold(ff),
            letterSpacing: 1.8,
            color: '#18181B',
            textTransform: 'uppercase',
            marginTop: 15,
            marginBottom: 3,
          }
        : compact
          ? {
              fontSize: 8.5,
              fontFamily: fontBold(ff),
              letterSpacing: 1,
              color: '#18181B',
              textTransform: 'uppercase',
              marginTop: 10,
              marginBottom: 2,
              paddingBottom: 2,
              borderBottomWidth: 1,
              borderBottomColor: '#D4D4D8',
            }
          : {
              fontSize: 11,
              fontFamily: fontBold(ff),
              letterSpacing: 1.2,
              color: accent,
              textTransform: 'uppercase',
              marginTop: 14,
              marginBottom: 4,
              paddingBottom: 3,
              borderBottomWidth: 1,
              borderBottomColor: '#E4E4E7',
            },
    role: { marginTop: compact ? 5 : 8 },
    summary: { marginTop: compact ? 6 : 9, marginBottom: compact ? 8 : 11 },
    roleHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' },
    roleHeaderMain: { flex: 1 },
    roleTitle: { fontSize: compact ? 9.5 : 10.5, fontFamily: fontBold(ff), color: '#18181B' },
    roleCompany: { color: modern ? '#52525B' : '#444', fontFamily: modern ? fontFamily(ff) : undefined },
    roleDate: { color: modern ? '#71717A' : '#666', fontSize: compact ? 7.5 : 9, flexShrink: 0 },
    // Executive company-first rows
    xCompany: { fontSize: 10.5, fontFamily: fontBold(ff), color: '#18181B', flex: 1 },
    xTitle: { fontFamily: fontItalic(ff), color: '#27272A' },
    bulletRow: { flexDirection: 'row', marginLeft: compact ? 8 : 10, marginTop: compact ? 1 : 2 },
    bulletDot: { width: compact ? 8 : 10, color: modern ? accent : executive ? '#18181B' : '#444' },
    bulletText: { flex: 1, color: executive ? '#1F1F23' : '#222' },
    skillRow: { flexDirection: 'row', marginTop: compact ? 1.5 : 3 },
    skillLabel: {
      width: executive ? 130 : compact ? 95 : singleColumn ? 220 : 110,
      fontFamily: fontBold(ff),
      color: '#222',
    },
    skillValues: { flex: 1, color: '#333' },
    twoColRow: { flexDirection: 'row', marginTop: 8, gap: 24 },
    twoColLeft: { flex: 1.4 },
    twoColRight: { flex: 1 },
    projHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    projName: { fontFamily: fontBold(ff) },
    projDesc: { color: '#444', fontSize: compact ? 8.5 : 10 },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function Header({ info, styles, template }: { info: PersonalInfo; styles: Styles; template: TemplateType }) {
  const parts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean) as string[];
  const compact = template === 'compact';
  return (
    <View style={styles.headerRow}>
      <Text style={styles.name}>{info.name || 'Your Name'}</Text>
      {template === 'modern' ? <View style={styles.accentBar} /> : null}
      <View style={styles.contact}>
        {compact
          ? parts.map((p, i) => (
              <Text key={i} style={styles.contactPart}>
                {p}
              </Text>
            ))
          : parts.map((p, i) => (
              <Text key={i} style={styles.contactPart}>
                {i > 0 ? '· ' : ''}
                {p}
              </Text>
            ))}
      </View>
    </View>
  );
}

function Bullets({ items, styles }: { items: Bullet[]; styles: Styles }) {
  return (
    <>
      {items.map((b) => (
        <View key={b.id} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b.text}</Text>
        </View>
      ))}
    </>
  );
}

/** Renders above Experience. Absent when the application selects no summary. */
function SummarySection({ summary, styles }: { summary?: Summary; styles: Styles }) {
  if (!summary?.text.trim()) return null;
  return (
    <View style={styles.summary}>
      <Text>{summary.text}</Text>
    </View>
  );
}

function ExperienceSection({
  jobs,
  styles,
  executive,
}: {
  jobs: FilteredResumeData['jobs'];
  styles: Styles;
  executive: boolean;
}) {
  if (!jobs.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Experience</Text>
      {jobs.map((j) => (
        <View key={j.id} style={styles.role} minPresenceAhead={36}>
          {executive ? (
            <>
              <View style={styles.roleHeader}>
                <Text style={styles.xCompany}>{j.company}</Text>
                <Text style={styles.roleDate}>{fmtDateRange(j.startDate, j.endDate)}</Text>
              </View>
              <View style={styles.roleHeader}>
                <Text style={styles.xTitle}>{j.title}</Text>
                {j.location ? <Text style={styles.roleDate}>{j.location}</Text> : null}
              </View>
            </>
          ) : (
            <View style={styles.roleHeader}>
              <View style={styles.roleHeaderMain}>
                <Text style={styles.roleTitle}>
                  {j.title}
                  <Text style={{ color: '#666' }}> · </Text>
                  <Text style={styles.roleCompany}>{j.company}</Text>
                </Text>
              </View>
              <Text style={styles.roleDate}>
                {fmtDateRange(j.startDate, j.endDate)}
                {j.location ? ` · ${j.location}` : ''}
              </Text>
            </View>
          )}
          <Bullets items={j.filteredBullets} styles={styles} />
        </View>
      ))}
    </View>
  );
}

function SkillsSection({
  cats,
  styles,
}: {
  cats: FilteredResumeData['skillCategories'];
  styles: Styles;
}) {
  if (!cats.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Skills</Text>
      {cats.map((c) => (
        <View key={c.id} style={styles.skillRow} wrap={false}>
          <Text style={styles.skillLabel}>{c.name}</Text>
          <Text style={styles.skillValues}>{(c.filteredSkills as Skill[]).map((s) => s.name).join(' · ')}</Text>
        </View>
      ))}
    </View>
  );
}

function ProjectsSection({
  projects,
  styles,
}: {
  projects: FilteredResumeData['projects'];
  styles: Styles;
}) {
  if (!projects.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Projects</Text>
      {projects.map((p) => (
        <View key={p.id} style={styles.role} wrap={false}>
          <View style={styles.projHeader}>
            <Text style={styles.projName}>{p.name}</Text>
            {p.url ? <Text style={styles.roleDate}>{p.url}</Text> : null}
          </View>
          {p.description ? <Text style={styles.projDesc}>{p.description}</Text> : null}
          <Bullets items={p.filteredBullets} styles={styles} />
        </View>
      ))}
    </View>
  );
}

function EducationSection({
  education,
  styles,
  executive,
}: {
  education: FilteredResumeData['education'];
  styles: Styles;
  executive: boolean;
}) {
  if (!education.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Education</Text>
      {education.map((ed) => (
        <View key={ed.id} style={styles.role} wrap={false}>
          {executive ? (
            <>
              <View style={styles.roleHeader}>
                <Text style={styles.xCompany}>{ed.institution}</Text>
                <Text style={styles.roleDate}>{ed.graduationDate || ''}</Text>
              </View>
              <Text style={styles.xTitle}>
                {ed.degree}
                {ed.field ? ` · ${ed.field}` : ''}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.roleHeader}>
                <View>
                  <Text style={styles.roleTitle}>
                    {ed.degree}
                    {ed.field ? <Text style={styles.roleCompany}> · {ed.field}</Text> : null}
                  </Text>
                </View>
                <Text style={styles.roleDate}>{ed.graduationDate || ''}</Text>
              </View>
              <Text style={styles.roleCompany}>{ed.institution}</Text>
            </>
          )}
          <Bullets items={ed.filteredBullets} styles={styles} />
        </View>
      ))}
    </View>
  );
}

// ── Sidebar template: tinted left rail, its own layout ──────────────────────

function makeSidebarStyles(accent: string, f: Font) {
  return StyleSheet.create({
    page: { padding: 0, fontSize: 9, fontFamily: fontFamily(f), color: '#1A1A1A', lineHeight: 1.45 },
    sideBand: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 168,
      backgroundColor: '#EEF2F7', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
    side: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 168,
      paddingTop: 46,
      paddingHorizontal: 18,
      paddingBottom: 36,
    },
    main: { paddingTop: 42, paddingRight: 40, paddingLeft: 194, paddingBottom: 36 },
    name: { fontSize: 22, fontFamily: fontBold(f), letterSpacing: -0.4 },
    accentBar: { width: 34, height: 3.5, backgroundColor: accent, borderRadius: 2, marginTop: 5, marginBottom: 4 },
    h2: {
      fontSize: 9,
      fontFamily: fontBold(f),
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: '#18181B',
      marginTop: 14,
      marginBottom: 4,
    },
    sideH2: {
      fontSize: 8.5,
      fontFamily: fontBold(f),
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: '#18181B',
      marginTop: 18,
      marginBottom: 4,
    },
    contactLine: { fontSize: 8, color: '#334155', marginBottom: 3 },
    catLbl: { fontSize: 8.5, fontFamily: fontBold(f), color: '#18181B' },
    catVals: { fontSize: 8.5, color: '#334155', marginBottom: 6, lineHeight: 1.5 },
    eduDeg: { fontSize: 8.5, fontFamily: fontBold(f), color: '#18181B' },
    eduInst: { fontSize: 8.5, color: '#334155' },
    eduDate: { fontSize: 8, color: '#64748B', marginBottom: 6 },
    role: { marginTop: 8 },
    summary: { marginTop: 6, marginBottom: 10, fontSize: 9 },
    roleHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' },
    roleHeaderMain: { flex: 1 },
    roleTitle: { fontSize: 10.5, fontFamily: fontBold(f), color: '#18181B' },
    roleCompany: { color: '#52525B', fontFamily: fontFamily(f) },
    roleDate: { color: '#64748B', fontSize: 9, flexShrink: 0 },
    bulletRow: { flexDirection: 'row', marginLeft: 10, marginTop: 2 },
    bulletDot: { width: 10, color: accent },
    bulletText: { flex: 1, color: '#222' },
    projHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    projName: { fontFamily: fontBold(f) },
    projDesc: { color: '#444', fontSize: 9 },
  });
}

function SidebarPage({
  data,
  font,
  hideSections,
}: {
  data: FilteredResumeData;
  font: Font;
  hideSections: NonNullable<ResumePDFProps['hideSections']>;
}) {
  const s = makeSidebarStyles(ACCENT, font);
  const info = data.personalInfo;
  const contact = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean) as string[];
  return (
    <Page size="LETTER" style={s.page}>
      {/* Painted on every page; the content below sits on page one only. */}
      <View style={s.sideBand} fixed />
      <View style={s.side}>
          {contact.map((c, i) => (
            <Text key={i} style={s.contactLine}>{c}</Text>
          ))}
          {!hideSections.skills && data.skillCategories.length ? (
            <View>
              <Text style={s.sideH2}>Skills</Text>
              {data.skillCategories.map((c) => (
                <View key={c.id}>
                  <Text style={s.catLbl}>{c.name}</Text>
                  <Text style={s.catVals}>{(c.filteredSkills as Skill[]).map((x) => x.name).join(' · ')}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {!hideSections.education && data.education.length ? (
            <View>
              <Text style={s.sideH2}>Education</Text>
              {data.education.map((ed) => (
                <View key={ed.id}>
                  <Text style={s.eduDeg}>
                    {ed.degree}
                    {ed.field ? ` · ${ed.field}` : ''}
                  </Text>
                  <Text style={s.eduInst}>{ed.institution}</Text>
                  <Text style={s.eduDate}>{ed.graduationDate || ''}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={s.main}>
          <Text style={s.name}>{info.name || 'Your Name'}</Text>
          <View style={s.accentBar} />
          {data.selectedSummary?.text.trim() ? (
            <Text style={s.summary}>{data.selectedSummary.text}</Text>
          ) : null}
          {!hideSections.jobs && data.jobs.length ? (
            <View>
              <Text style={s.h2}>Experience</Text>
              {data.jobs.map((j) => (
                <View key={j.id} style={s.role} minPresenceAhead={36}>
                  <View style={s.roleHeader}>
                    <View style={s.roleHeaderMain}>
                      <Text style={s.roleTitle}>
                        {j.title}
                        <Text style={{ color: '#666' }}> · </Text>
                        <Text style={s.roleCompany}>{j.company}</Text>
                      </Text>
                    </View>
                    <Text style={s.roleDate}>
                      {fmtDateRange(j.startDate, j.endDate)}
                      {j.location ? ` · ${j.location}` : ''}
                    </Text>
                  </View>
                  {j.filteredBullets.map((b) => (
                    <View key={b.id} style={s.bulletRow} wrap={false}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
          {!hideSections.projects && data.projects.length ? (
            <View>
              <Text style={s.h2}>Projects</Text>
              {data.projects.map((p) => (
                <View key={p.id} style={s.role} wrap={false}>
                  <View style={s.projHeader}>
                    <Text style={s.projName}>{p.name}</Text>
                    {p.url ? <Text style={s.roleDate}>{p.url}</Text> : null}
                  </View>
                  {p.description ? <Text style={s.projDesc}>{p.description}</Text> : null}
                  {p.filteredBullets.map((b) => (
                    <View key={b.id} style={s.bulletRow} wrap={false}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
      </View>
    </Page>
  );
}

export function ResumePDF({ data, template, font, hideSections = {} }: ResumePDFProps) {
  if (template === 'sidebar') {
    return (
      <Document>
        <SidebarPage data={data} font={font} hideSections={hideSections} />
      </Document>
    );
  }

  const styles = makeStyles(ACCENT, font, template);
  const executive = template === 'executive';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header info={data.personalInfo} styles={styles} template={template} />
        <SummarySection summary={data.selectedSummary} styles={styles} />
        {template === 'two-column' ? (
          <>
            {!hideSections.jobs ? <ExperienceSection jobs={data.jobs} styles={styles} executive={false} /> : null}
            <View style={styles.twoColRow}>
              <View style={styles.twoColLeft}>
                {!hideSections.projects ? <ProjectsSection projects={data.projects} styles={styles} /> : null}
                {!hideSections.education ? <EducationSection education={data.education} styles={styles} executive={false} /> : null}
              </View>
              <View style={styles.twoColRight}>
                {!hideSections.skills ? <SkillsSection cats={data.skillCategories} styles={styles} /> : null}
              </View>
            </View>
          </>
        ) : (
          <>
            {!hideSections.jobs ? <ExperienceSection jobs={data.jobs} styles={styles} executive={executive} /> : null}
            {!hideSections.skills ? <SkillsSection cats={data.skillCategories} styles={styles} /> : null}
            {!hideSections.projects ? <ProjectsSection projects={data.projects} styles={styles} /> : null}
            {!hideSections.education ? <EducationSection education={data.education} styles={styles} executive={executive} /> : null}
          </>
        )}
      </Page>
    </Document>
  );
}
