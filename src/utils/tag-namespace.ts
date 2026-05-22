// Tag namespace helpers — parses `prefix:value` tags and groups by namespace.

export const NAMESPACES = {
  target:     { label: 'target',     values: ['swe', 'fe', 'architect', 'em'] },
  skill:      { label: 'skill',      values: ['frontend', 'backend', 'infra', 'identity', 'observability', 'ai', 'leadership', 'data', 'devops', 'security'] },
  narrative:  { label: 'narrative',  values: ['technical', 'impact', 'leadership'] },
  era:        { label: 'era',        values: ['current', 'lead-swe', 'jr-swe', 'sd', 'military', 'pre-empres'] },
  audience:   { label: 'audience',   values: ['tech-first', 'healthcare', 'regulated', 'startup', 'enterprise'] },
  confidence: { label: 'confidence', values: ['high', 'medium', 'low'] },
  flag:       { label: 'flag',       values: ['must-include', 'opt-in'] },
} as const;

export type Namespace = keyof typeof NAMESPACES | 'general';

export const NS_ORDER: Namespace[] = [
  'target', 'skill', 'narrative', 'era', 'audience', 'confidence', 'flag', 'general',
];

export function parseTag(tag: string): { ns: Namespace; value: string } {
  const i = tag.indexOf(':');
  if (i === -1) return { ns: 'general', value: tag };
  const ns = tag.slice(0, i);
  return {
    ns: (ns in NAMESPACES ? ns : 'general') as Namespace,
    value: tag.slice(i + 1),
  };
}

export function nsColor(ns: Namespace | string): string {
  return `var(--ns-${ns === 'general' ? 'general' : (ns in NAMESPACES ? ns : 'general')})`;
}

// Group an array of tags by namespace.
export function groupByNamespace(tags: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of tags) {
    const { ns } = parseTag(t);
    (out[ns] ||= []).push(t);
  }
  return out;
}
