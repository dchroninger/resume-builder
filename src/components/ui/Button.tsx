import type { ButtonHTMLAttributes, ComponentType } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'default' | 'primary' | 'ghost' | 'subtle' | 'danger';
  size?: 'sm';
  icon?: ComponentType<{ size?: number; stroke?: number }>;
  tip?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size,
  icon: I,
  children,
  tip,
  className,
  ...rest
}: ButtonProps) {
  const classes = ['btn'];
  if (variant === 'primary') classes.push('primary');
  if (variant === 'ghost') classes.push('ghost');
  if (variant === 'subtle') classes.push('subtle');
  if (variant === 'danger') classes.push('danger');
  if (size === 'sm') classes.push('sm');
  if (!children) classes.push('icon');
  if (tip) classes.push('tip');
  if (className) classes.push(className);
  return (
    <button className={classes.join(' ')} data-tip={tip} {...rest}>
      {I ? <I size={size === 'sm' ? 13 : 14} /> : null}
      {children}
    </button>
  );
}
