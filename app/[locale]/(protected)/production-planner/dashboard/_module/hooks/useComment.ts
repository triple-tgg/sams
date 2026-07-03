'use client';

import { useEffect, useState } from 'react';

/** Local, client-only persistence for a single comment/notes field.
 *  Swap the body of `save`/`clear` for an API call if comments should
 *  be shared across users/devices instead of per-browser. */
export function useComment(storageKey: string) {
  const [value, setValue] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (saved) setValue(saved);
  }, [storageKey]);

  function save() {
    window.localStorage.setItem(storageKey, value);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  function clear() {
    setValue('');
    window.localStorage.removeItem(storageKey);
  }

  return { value, setValue, save, clear, justSaved };
}
