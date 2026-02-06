import { FilteredResumeData, TemplateType } from '../../types/resume';
import { SingleColumn } from '../Templates/SingleColumn';
import { TwoColumn } from '../Templates/TwoColumn';

interface ResumePreviewProps {
  data: FilteredResumeData;
  template: TemplateType;
}

export function ResumePreview({ data, template }: ResumePreviewProps) {
  if (template === 'two-column') {
    return <TwoColumn data={data} />;
  }
  return <SingleColumn data={data} />;
}
