import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { FilteredResumeData, TemplateType } from '../../types/resume';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    color: '#666',
    fontSize: 9,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 6,
    paddingBottom: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: '#666',
  },
  itemDate: {
    color: '#666',
    fontSize: 9,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 10,
    marginTop: 2,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
    color: '#444',
  },
  skillRow: {
    marginBottom: 3,
  },
  skillCategory: {
    fontWeight: 'bold',
  },
  // Two-column styles
  twoColContainer: {
    flexDirection: 'row',
  },
  sidebar: {
    width: '33%',
    backgroundColor: '#333',
    padding: 15,
    color: 'white',
  },
  sidebarSection: {
    marginBottom: 15,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    marginBottom: 6,
    paddingBottom: 2,
    color: 'white',
  },
  sidebarText: {
    color: '#ccc',
    fontSize: 9,
    marginBottom: 2,
  },
  mainContent: {
    width: '67%',
    padding: 15,
  },
  mainHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  link: {
    color: '#0066cc',
    textDecoration: 'none',
  },
});

interface ResumePDFProps {
  data: FilteredResumeData;
  template: TemplateType;
}

function SingleColumnPDF({ data }: { data: FilteredResumeData }) {
  const { personalInfo, jobs, skillCategories, education, projects } = data;

  return (
    <Page size="LETTER" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
        <View style={styles.contactRow}>
          {personalInfo.email && <Text>{personalInfo.email}</Text>}
          {personalInfo.phone && <Text>{personalInfo.phone}</Text>}
          {personalInfo.location && <Text>{personalInfo.location}</Text>}
          {personalInfo.linkedin && <Text>{personalInfo.linkedin}</Text>}
          {personalInfo.website && <Text>{personalInfo.website}</Text>}
        </View>
      </View>

      {skillCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {skillCategories.map((cat) => (
            <View key={cat.id} style={styles.skillRow}>
              <Text>
                <Text style={styles.skillCategory}>{cat.name}: </Text>
                {cat.filteredSkills.map((s) => s.name).join(', ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {jobs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {jobs.map((job) => (
            <View key={job.id} style={{ marginBottom: 8 }}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemTitle}>{job.title}</Text>
                  <Text style={styles.itemSubtitle}>
                    {job.company}{job.location && ` • ${job.location}`}
                  </Text>
                </View>
                <Text style={styles.itemDate}>
                  {job.startDate} – {job.endDate || 'Present'}
                </Text>
              </View>
              {job.filteredBullets.map((bullet) => (
                <View key={bullet.id} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map((proj) => (
            <View key={proj.id} style={{ marginBottom: 8 }}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemTitle}>{proj.name}</Text>
                  {proj.description && <Text style={styles.itemSubtitle}>{proj.description}</Text>}
                </View>
                {proj.url && <Link src={proj.url} style={styles.link}><Text>{proj.url}</Text></Link>}
              </View>
              {proj.filteredBullets.map((bullet) => (
                <View key={bullet.id} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 8 }}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemTitle}>
                    {edu.degree}{edu.field && ` in ${edu.field}`}
                  </Text>
                  <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                </View>
                {edu.graduationDate && <Text style={styles.itemDate}>{edu.graduationDate}</Text>}
              </View>
              {edu.filteredBullets.map((bullet) => (
                <View key={bullet.id} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

function TwoColumnPDF({ data }: { data: FilteredResumeData }) {
  const { personalInfo, jobs, skillCategories, education, projects } = data;

  return (
    <Page size="LETTER" style={{ fontFamily: 'Helvetica', fontSize: 10 }}>
      <View style={styles.twoColContainer}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {personalInfo.email && <Text style={styles.sidebarText}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.sidebarText}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.sidebarText}>{personalInfo.location}</Text>}
            {personalInfo.linkedin && <Text style={styles.sidebarText}>{personalInfo.linkedin}</Text>}
            {personalInfo.website && <Text style={styles.sidebarText}>{personalInfo.website}</Text>}
          </View>

          {skillCategories.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skillCategories.map((cat) => (
                <View key={cat.id} style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#ddd', fontWeight: 'bold', fontSize: 9 }}>{cat.name}</Text>
                  <Text style={styles.sidebarText}>
                    {cat.filteredSkills.map((s) => s.name).join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {education.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 6 }}>
                  <Text style={{ color: '#ddd', fontWeight: 'bold', fontSize: 9 }}>
                    {edu.degree}{edu.field && ` in ${edu.field}`}
                  </Text>
                  <Text style={styles.sidebarText}>{edu.institution}</Text>
                  {edu.graduationDate && (
                    <Text style={{ color: '#999', fontSize: 8 }}>{edu.graduationDate}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.mainContent}>
          <View style={styles.mainHeader}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{personalInfo.name || 'Your Name'}</Text>
          </View>

          {jobs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {jobs.map((job) => (
                <View key={job.id} style={{ marginBottom: 8 }}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{job.title}</Text>
                      <Text style={styles.itemSubtitle}>
                        {job.company}{job.location && ` • ${job.location}`}
                      </Text>
                    </View>
                    <Text style={styles.itemDate}>
                      {job.startDate} – {job.endDate || 'Present'}
                    </Text>
                  </View>
                  {job.filteredBullets.map((bullet) => (
                    <View key={bullet.id} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.map((proj) => (
                <View key={proj.id} style={{ marginBottom: 8 }}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{proj.name}</Text>
                      {proj.description && <Text style={styles.itemSubtitle}>{proj.description}</Text>}
                    </View>
                    {proj.url && <Link src={proj.url} style={styles.link}><Text style={{ fontSize: 8 }}>{proj.url}</Text></Link>}
                  </View>
                  {proj.filteredBullets.map((bullet) => (
                    <View key={bullet.id} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Page>
  );
}

export function ResumePDF({ data, template }: ResumePDFProps) {
  return (
    <Document>
      {template === 'two-column' ? (
        <TwoColumnPDF data={data} />
      ) : (
        <SingleColumnPDF data={data} />
      )}
    </Document>
  );
}
