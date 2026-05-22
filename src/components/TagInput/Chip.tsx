import type { CSSProperties } from 'react';
import { parseTag, nsColor } from '../../utils/tag-namespace';
import { Icon } from '../ui/Icons';

export type ChipVariant = 'bar' | 'pill' | 'outline' | 'minimal';

interface ChipProps {
  tag: string;
  variant?: ChipVariant;
  size?: 'sm' | 'xs';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Chip({ tag, variant = 'bar', size, removable, onRemove, onClick, style }: ChipProps) {
  const { ns, value } = parseTag(tag);
  const color = nsColor(ns);
  const showNs = ns !== 'general';
  const cls = ['chip'];
  if (removable) cls.push('removable');
  if (size === 'sm' || size === 'xs') cls.push('sm');

  return (
    <span
      className={cls.join(' ')}
      data-variant={variant}
      style={{ ['--ns-color' as string]: color, ...style }}
      onClick={onClick}
    >
      <span className="ns-bar" />
      <span className="chip-body">
        {showNs ? <span className="ns-label">{ns}</span> : null}
        {showNs ? <span style={{ color: 'var(--text-faint)', margin: '0 -1px' }}>:</span> : null}
        <span className="val">{value}</span>
      </span>
      {removable ? (
        <button
          className="chip-x"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          title="Remove tag"
          type="button"
        >
          <Icon.X size={11} stroke={2.2} />
        </button>
      ) : null}
    </span>
  );
}
