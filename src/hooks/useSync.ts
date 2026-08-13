import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Application, ResumeData } from '../types/resume';
import { fetchRemote, pushResume, pushApplications } from '../lib/sync';

export type SyncState = 'off' | 'pulling' | 'synced' | 'error';

/**
 * Pull once per sign-in, then debounce-push on every local change.
 * Remote wins on pull when it has content; otherwise local data is kept and
 * uploaded by the first push (covers first-login import of local work).
 */
export function useSync(opts: {
  user: User | null;
  data: ResumeData;
  apps: Application[];
  onRemote: (resume: ResumeData | null, apps: Application[]) => void;
}) {
  const { user, data, apps, onRemote } = opts;
  const [state, setState] = useState<SyncState>('off');
  const loadedFor = useRef<string | null>(null);
  const onRemoteRef = useRef(onRemote);
  onRemoteRef.current = onRemote;

  useEffect(() => {
    if (!user) {
      loadedFor.current = null;
      setState('off');
      return;
    }
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    setState('pulling');
    fetchRemote()
      .then(({ resume, apps: remoteApps }) => {
        onRemoteRef.current(resume, remoteApps);
        setState('synced');
      })
      .catch((e) => {
        console.error('Sync pull failed:', e);
        setState('error');
      });
  }, [user]);

  useEffect(() => {
    if (!user || state !== 'synced') return;
    const t = setTimeout(() => {
      Promise.all([pushResume(user.id, data), pushApplications(user.id, apps)]).catch((e) => {
        console.error('Sync push failed:', e);
        setState('error');
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [user, state, data, apps]);

  return state;
}
