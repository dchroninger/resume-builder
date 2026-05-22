import { useEffect, useLayoutEffect, useRef } from 'react';

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> & {
  // When true (default), Enter is swallowed so the value stays a single logical line.
  singleLine?: boolean;
};

export function AutoTextarea({
  singleLine = true,
  className = '',
  value,
  onKeyDown,
  onInput,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    // box-sizing: border-box → height includes border; scrollHeight does not.
    const borderY = ta.offsetHeight - ta.clientHeight;
    ta.style.height = ta.scrollHeight + borderY + 'px';
  };

  useLayoutEffect(resize, [value]);
  useEffect(() => {
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={'input auto ' + className}
      onKeyDown={(e) => {
        if (singleLine && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.currentTarget as HTMLTextAreaElement).blur();
        }
        onKeyDown?.(e);
      }}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      {...rest}
    />
  );
}
