import { useCallback, useEffect, useState } from 'react';

/** The program a user is following: which one, which week, and the Sprint number that week runs in. */
export interface ActiveProgram { id: string; week: number; sprint: number }

const key = (uid: string) => `lifeos.program.v1.${uid}`;
const EVENT = 'lifeos-program';

function read(uid: string | undefined): ActiveProgram | null {
  if (!uid) return null;
  try { const raw = localStorage.getItem(key(uid)); return raw ? (JSON.parse(raw) as ActiveProgram) : null; } catch { return null; }
}

/** Active program, saved on this device for this account. */
export function useActiveProgram(uid: string | undefined): [ActiveProgram | null, (p: ActiveProgram | null) => void] {
  const [value, setValue] = useState<ActiveProgram | null>(() => read(uid));
  useEffect(() => {
    setValue(read(uid));
    const on = () => setValue(read(uid));
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [uid]);
  const set = useCallback((p: ActiveProgram | null) => {
    if (!uid) return;
    try { if (p) localStorage.setItem(key(uid), JSON.stringify(p)); else localStorage.removeItem(key(uid)); } catch { /* ignore */ }
    setValue(p);
    window.dispatchEvent(new Event(EVENT));
  }, [uid]);
  return [value, set];
}
