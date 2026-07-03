'use client';

import { useComment } from '../../hooks/useComment';

interface CommentBoxProps {
  storageKey: string;
  title: string;
  placeholder?: string;
}

/** Freeform analysis/notes box. Persists to localStorage client-side by
 *  default via `useComment` — swap that hook for an API-backed one to
 *  persist comments server-side instead. */
export function CommentBox({ storageKey, title, placeholder }: CommentBoxProps) {
  const { value, setValue, save, clear, justSaved } = useComment(storageKey);

  return (
    <div className="mt-3.5 rounded-md border border-amber-200 bg-amber-50/50 p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
        <span aria-hidden>✎</span> {title}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Add your analysis, observations, or follow-up actions here…'}
        className="min-h-[90px] w-full resize-y rounded-md border border-amber-200 bg-white p-2.5 text-xs leading-relaxed text-foreground outline-none placeholder:italic placeholder:text-amber-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {justSaved && <span className="flex items-center gap-1 text-[10px] font-medium text-success">✓ Saved</span>}
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-border bg-card px-3.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={save}
          className="rounded-md bg-primary px-3.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-primary/90"
        >
          Save Comment
        </button>
      </div>
    </div>
  );
}
