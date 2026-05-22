import { Icon } from './Icons';

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={'cbx' + (checked ? ' on' : '')}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <Icon.Check size={11} stroke={2.4} />
    </button>
  );
}
