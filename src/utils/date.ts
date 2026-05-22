export function fmtDateRange(start: string, end?: string): string {
  const f = (s?: string) => {
    if (!s) return '';
    const [y, m] = s.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return m ? `${months[+m - 1] ?? ''} ${y}`.trim() : y;
  };
  return `${f(start) || '—'} – ${end ? f(end) : 'Present'}`;
}
