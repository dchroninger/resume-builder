// @react-pdf/renderer template that visually matches the HTML preview.
// Used for PDF export only; the on-screen preview stays HTML (cheaper to
// re-render than the PDF document tree).

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FilteredResumeData, TemplateType, PersonalInfo, Bullet, Skill } from '../../types/resume';
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

// react-pdf ships these three font families by default — no Font.register needed.
const fontFamily = (f: Font) => (f === 'serif' ? 'Times-Roman' : 'Helvetica');
const fontBold = (f: Font) => (f === 'serif' ? 'Times-Bold' : 'Helvetica-Bold');

function makeStyles(accent: string, f: Font) {
  return StyleSheet.create({
    page: {
      paddingTop: 42,
      paddingHorizontal: 48,
      paddingBottom: 36,
      fontSize: 10,
      fontFamily: fontFamily(f),
      color: '#1A1A1A',
      lineHeight: 1.4,
    },
    name: { fontSize: 22, fontFamily: fontBold(f), letterSpacing: -0.4, marginBottom: 3 },
    contact: { color: '#555', fontSize: 9.5, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
    contactPart: { color: '#555' },
    sectionHeading: {
      fontSize: 11,
      fontFamily: fontBold(f),
      letterSpacing: 1.2,
      color: accent,
      textTransform: 'uppercase',
      marginTop: 14,
      marginBottom: 4,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: '#E4E4E7',
    },
    role: { marginTop: 8 },
    roleHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    roleTitle: { fontSize: 10.5, fontFamily: fontBold(f) },
    roleCompany: { color: '#444' },
    roleDate: { color: '#666', fontSize: 9.5 },
    bulletRow: { flexDirection: 'row', marginLeft: 10, marginTop: 2 },
    bulletDot: { width: 10, color: '#444' },
    bulletText: { flex: 1, color: '#222' },
    skillRow: { flexDirection: 'row', marginTop: 3 },
    skillLabel: { width: 110, fontFamily: fontBold(f), color: '#222' },
    skillValues: { flex: 1, color: '#333' },
    twoColRow: { flexDirection: 'row', marginTop: 8, gap: 24 },
    twoColLeft: { flex: 1.4 },
    twoColRight: { flex: 1 },
    projHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    projName: { fontFamily: fontBold(f) },
    projDesc: { color: '#444', fontSize: 10 },
  });
}

function Header({ info, styles }: { info: PersonalInfo; styles: ReturnType<typeof makeStyles> }) {
  const parts = [info.email, info.phone, info.location, info.linkedin, info.website].filter(Boolean) as string[];
  return (
    <View>
      <Text style={styles.name}>{info.name || 'Your Name'}</Text>
      <View style={styles.contact}>
        {parts.map((p, i) => (
          <Text key={i} style={styles.contactPart}>
            {i > 0 ? '· ' : ''}
            {p}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Bullets({ items, styles }: { items: Bullet[]; styles: ReturnType<typeof makeStyles> }) {
  return (
    <>
      {items.map((b) => (
        <View key={b.id} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b.text}</Text>
        </View>
      ))}
    </>
  );
}

function ExperienceSection({
  jobs,
  styles,
}: {
  jobs: FilteredResumeData['jobs'];
  styles: ReturnType<typeof makeStyles>;
}) {
  if (!jobs.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Experience</Text>
      {jobs.map((j) => (
        <View key={j.id} style={styles.role} wrap={false}>
          <View style={styles.roleHeader}>
            <View>
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
  styles: ReturnType<typeof makeStyles>;
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
  styles: ReturnType<typeof makeStyles>;
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
}: {
  education: FilteredResumeData['education'];
  styles: ReturnType<typeof makeStyles>;
}) {
  if (!education.length) return null;
  return (
    <View>
      <Text style={styles.sectionHeading}>Education</Text>
      {education.map((ed) => (
        <View key={ed.id} style={styles.role} wrap={false}>
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
          <Bullets items={ed.filteredBullets} styles={styles} />
        </View>
      ))}
    </View>
  );
}

export function ResumePDF({ data, template, font, hideSections = {} }: ResumePDFProps) {
  const styles = makeStyles(ACCENT, font);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header info={data.personalInfo} styles={styles} />
        {template === 'two-column' ? (
          <>
            {!hideSections.jobs ? <ExperienceSection jobs={data.jobs} styles={styles} /> : null}
            <View style={styles.twoColRow}>
              <View style={styles.twoColLeft}>
                {!hideSections.projects ? <ProjectsSection projects={data.projects} styles={styles} /> : null}
                {!hideSections.education ? <EducationSection education={data.education} styles={styles} /> : null}
              </View>
              <View style={styles.twoColRight}>
                {!hideSections.skills ? <SkillsSection cats={data.skillCategories} styles={styles} /> : null}
              </View>
            </View>
          </>
        ) : (
          <>
            {!hideSections.jobs ? <ExperienceSection jobs={data.jobs} styles={styles} /> : null}
            {!hideSections.skills ? <SkillsSection cats={data.skillCategories} styles={styles} /> : null}
            {!hideSections.projects ? <ProjectsSection projects={data.projects} styles={styles} /> : null}
            {!hideSections.education ? <EducationSection education={data.education} styles={styles} /> : null}
          </>
        )}
      </Page>
    </Document>
  );
}
