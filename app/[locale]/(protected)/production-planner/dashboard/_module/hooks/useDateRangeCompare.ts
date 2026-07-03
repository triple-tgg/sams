'use client';

import { useState } from 'react';
import { formatDateLabel } from '../lib/formatters';
import type { ComparePeriods } from '../types';

export function useDateRangeCompare(initial: ComparePeriods, onApply?: (periods: ComparePeriods) => void) {
  const [draft, setDraft] = useState<ComparePeriods>(initial);
  const [applied, setApplied] = useState<ComparePeriods>(initial);
  const [justApplied, setJustApplied] = useState(false);

  function updateDraft(field: 'p1Start' | 'p1End' | 'p2Start' | 'p2End', dateStr: string) {
    setDraft((prev) => {
      switch (field) {
        case 'p1Start':
          return { ...prev, p1: { ...prev.p1, start: dateStr } };
        case 'p1End':
          return { ...prev, p1: { ...prev.p1, end: dateStr } };
        case 'p2Start':
          return { ...prev, p2: { ...prev.p2, start: dateStr } };
        case 'p2End':
          return { ...prev, p2: { ...prev.p2, end: dateStr } };
      }
    });
  }

  function apply() {
    setApplied(draft);
    onApply?.(draft);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  }

  const p1Badge = `● ${formatDateLabel(applied.p1.start)} – ${formatDateLabel(applied.p1.end)}`;
  const p2Badge = `● ${formatDateLabel(applied.p2.start)} – ${formatDateLabel(applied.p2.end)}`;

  return { draft, updateDraft, apply, p1Badge, p2Badge, justApplied };
}
