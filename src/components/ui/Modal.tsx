import { useEffect } from 'react';
import { Icon } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  headExtras?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, headExtras, footer, children, width }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="modal"
        style={width ? { maxWidth: width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          {headExtras}
          <button className="close" onClick={onClose} title="Close (Esc)">
            <Icon.X size={16} />
          </button>
        </div>
        <div className="modal-body scroller">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
