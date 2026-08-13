import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icons';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onEmail: (email: string) => Promise<void>;
  onGithub: () => Promise<void>;
}

export function AuthModal({ open, onClose, onEmail, onGithub }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const send = async () => {
    if (!email.trim()) return;
    setState('sending');
    setError('');
    try {
      await onEmail(email.trim());
      setState('sent');
    } catch (e) {
      setState('error');
      setError((e as Error).message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign in">
      <div style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Sign in to sync your library and applications across devices and unlock AI tailoring.
        </div>
        {state === 'sent' ? (
          <div className="empty" style={{ padding: '24px 16px' }}>
            <div className="e-title">Check your email</div>
            <div className="e-sub">Magic link sent to {email}. Click it to sign in.</div>
          </div>
        ) : (
          <>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
            </div>
            {error ? (
              <div style={{ color: 'var(--warn)', fontSize: 12 }}>{error}</div>
            ) : null}
            <Button variant="primary" onClick={send} disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send magic link'}
            </Button>
            <Button
              variant="subtle"
              onClick={() => onGithub().catch((e) => { setState('error'); setError((e as Error).message); })}
            >
              <Icon.Star size={13} /> Continue with GitHub
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
