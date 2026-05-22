import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface PopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start';
  width?: number;
}

export function Popover({ anchor, open, onClose, children, placement = 'bottom-start', width = 320 }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const r = anchor.getBoundingClientRect();
    let top: number, left: number;
    if (placement === 'bottom-start') {
      top = r.bottom + 6;
      left = r.left;
    } else if (placement === 'bottom-end') {
      top = r.bottom + 6;
      left = r.right - width;
    } else {
      top = r.top - 6;
      left = r.left;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setPos({ top, left });
  }, [open, anchor, placement, width]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !pos) return null;
  return (
    <>
      {/* Scrim absorbs all clicks outside the popover so they don't fire underlying UI. */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        style={{ position: 'fixed', inset: 0, zIndex: 100 }}
      />
      <div
        ref={ref}
        className="pop"
        style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 101 }}
      >
        {children}
      </div>
    </>
  );
}
