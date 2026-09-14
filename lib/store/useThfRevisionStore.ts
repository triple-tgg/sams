'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ThfMappingStatus, ThfDocumentState } from '@/lib/api/flight/filghtlist.interface';

export interface ThfRevisionRecord {
  flightId?: number | string | null;
  lineMaintenanceId?: number | string | null;
  thfNumber?: string | null;
  mappingStatus: ThfMappingStatus;
  state: ThfDocumentState;
  category?: string;
  reason?: string;
  requestedBy?: string;
  requestedAt?: string;
  submittedAt?: string;
  unlockReason?: string;
  unlockRequestedAt?: string;
  revisionCount: number;
}

const STORAGE_KEY = 'sams_thf_revision_store_v1';
const EVENT_NAME = 'sams_thf_revision_change';

// In-memory cache
let memoryStore: Record<string, ThfRevisionRecord> = {};

// Load from localStorage if in browser
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      memoryStore = JSON.parse(cached);
    }
  } catch (err) {
    console.error('Failed to load THF revision store:', err);
  }
}

function saveStore() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch (err) {
      console.error('Failed to save THF revision store:', err);
    }
  }
}

function emitChange(record: ThfRevisionRecord) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: record }));
  }
}

function getKey(flightId?: number | string | null, lineMaintenanceId?: number | string | null, thfNumber?: string | null): string {
  if (lineMaintenanceId) return `lm_${lineMaintenanceId}`;
  if (thfNumber) return `thf_${thfNumber}`;
  if (flightId) return `fl_${flightId}`;
  return 'unknown';
}

/**
 * Direct API for reading and mutating revision status
 */
export const thfRevisionService = {
  get(flightId?: number | string | null, lineMaintenanceId?: number | string | null, thfNumber?: string | null): ThfRevisionRecord | undefined {
    // Try matching by lineMaintenanceId first, then thfNumber, then flightId
    if (lineMaintenanceId && memoryStore[`lm_${lineMaintenanceId}`]) {
      return memoryStore[`lm_${lineMaintenanceId}`];
    }
    if (thfNumber && memoryStore[`thf_${thfNumber}`]) {
      return memoryStore[`thf_${thfNumber}`];
    }
    if (flightId && memoryStore[`fl_${flightId}`]) {
      return memoryStore[`fl_${flightId}`];
    }

    // Secondary scan in case keys are mapped differently
    const records = Object.values(memoryStore);
    return records.find(r =>
      (lineMaintenanceId && String(r.lineMaintenanceId) === String(lineMaintenanceId)) ||
      (thfNumber && r.thfNumber === thfNumber) ||
      (flightId && String(r.flightId) === String(flightId))
    );
  },

  getAll(): Record<string, ThfRevisionRecord> {
    return { ...memoryStore };
  },

  set(record: ThfRevisionRecord) {
    const key = getKey(record.flightId, record.lineMaintenanceId, record.thfNumber);
    // Also mirror to other keys if available for robust lookup
    memoryStore[key] = record;
    if (record.lineMaintenanceId) memoryStore[`lm_${record.lineMaintenanceId}`] = record;
    if (record.thfNumber) memoryStore[`thf_${record.thfNumber}`] = record;
    if (record.flightId) memoryStore[`fl_${record.flightId}`] = record;

    saveStore();
    emitChange(record);
  },

  /**
   * Accounting requests revision for a THF document
   */
  requestRevision(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
    category: string;
    reason: string;
    requestedBy?: string;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: 'REVISION_REQUESTED',
      state: 'revision_required',
      category: params.category,
      reason: params.reason,
      requestedBy: params.requestedBy || 'Accounting',
      requestedAt: new Date().toISOString(),
      revisionCount: (existing?.revisionCount ?? 0),
    };
    this.set(updated);
    return updated;
  },

  /**
   * Engineer submits revised THF
   */
  submitRevision(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: 'REVISED',
      state: 'save',
      category: existing?.category,
      reason: existing?.reason,
      requestedBy: existing?.requestedBy,
      requestedAt: existing?.requestedAt,
      submittedAt: new Date().toISOString(),
      revisionCount: (existing?.revisionCount ?? 0) + 1,
    };
    this.set(updated);
    return updated;
  },

  /**
   * Engineer requests unlock to edit a saved/mapped THF
   */
  requestUnlock(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
    reason: string;
    requestedBy?: string;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: existing?.mappingStatus ?? 'MAPPED',
      state: 'pending_unlock',
      unlockReason: params.reason,
      unlockRequestedAt: new Date().toISOString(),
      requestedBy: params.requestedBy || 'Engineer',
      revisionCount: existing?.revisionCount ?? 0,
    };
    this.set(updated);
    return updated;
  },

  /**
   * Accounting approves the unlock request
   */
  approveUnlock(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: 'REVISION_REQUESTED',
      state: 'revision_required',
      reason: existing?.unlockReason || 'Approved for edit by Accounting',
      category: 'User Request',
      requestedBy: 'Accounting',
      requestedAt: new Date().toISOString(),
      revisionCount: existing?.revisionCount ?? 0,
    };
    this.set(updated);
    return updated;
  },

  /**
   * Accounting rejects the unlock request
   */
  rejectUnlock(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
    reason?: string;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: existing?.mappingStatus ?? 'MAPPED',
      state: 'save',
      revisionCount: existing?.revisionCount ?? 0,
    };
    this.set(updated);
    return updated;
  },

  /**
   * Re-map successful: status returns to MAPPED
   */
  reMapSuccess(params: {
    flightId?: number | string | null;
    lineMaintenanceId?: number | string | null;
    thfNumber?: string | null;
  }) {
    const existing = this.get(params.flightId, params.lineMaintenanceId, params.thfNumber);
    const updated: ThfRevisionRecord = {
      flightId: params.flightId ?? existing?.flightId ?? null,
      lineMaintenanceId: params.lineMaintenanceId ?? existing?.lineMaintenanceId ?? null,
      thfNumber: params.thfNumber ?? existing?.thfNumber ?? null,
      mappingStatus: 'MAPPED',
      state: 'save',
      revisionCount: existing?.revisionCount ?? 0,
    };
    this.set(updated);
    return updated;
  },
};

/**
 * React Hook for single item revision status
 */
export function useThfRevision(identifier?: {
  flightId?: number | string | null;
  lineMaintenanceId?: number | string | null;
  thfNumber?: string | null;
}) {
  const [record, setRecord] = useState<ThfRevisionRecord | undefined>(() =>
    thfRevisionService.get(identifier?.flightId, identifier?.lineMaintenanceId, identifier?.thfNumber)
  );

  useEffect(() => {
    // Initial fetch
    setRecord(thfRevisionService.get(identifier?.flightId, identifier?.lineMaintenanceId, identifier?.thfNumber));

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ThfRevisionRecord>;
      const changed = customEvent.detail;
      const isMatch =
        (identifier?.lineMaintenanceId && String(changed?.lineMaintenanceId) === String(identifier.lineMaintenanceId)) ||
        (identifier?.thfNumber && changed?.thfNumber === identifier.thfNumber) ||
        (identifier?.flightId && String(changed?.flightId) === String(identifier.flightId));

      if (isMatch) {
        setRecord(thfRevisionService.get(identifier?.flightId, identifier?.lineMaintenanceId, identifier?.thfNumber));
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) memoryStore = JSON.parse(cached);
        setRecord(thfRevisionService.get(identifier?.flightId, identifier?.lineMaintenanceId, identifier?.thfNumber));
      } catch { }
    });

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, [identifier?.flightId, identifier?.lineMaintenanceId, identifier?.thfNumber]);

  return {
    record,
    requestRevision: thfRevisionService.requestRevision.bind(thfRevisionService),
    submitRevision: thfRevisionService.submitRevision.bind(thfRevisionService),
    requestUnlock: thfRevisionService.requestUnlock.bind(thfRevisionService),
    approveUnlock: thfRevisionService.approveUnlock.bind(thfRevisionService),
    rejectUnlock: thfRevisionService.rejectUnlock.bind(thfRevisionService),
    reMapSuccess: thfRevisionService.reMapSuccess.bind(thfRevisionService),
  };
}

/**
 * React Hook for all revisions (e.g. for table summaries / counts)
 */
export function useAllThfRevisions() {
  const [records, setRecords] = useState<Record<string, ThfRevisionRecord>>(() => thfRevisionService.getAll());

  useEffect(() => {
    const handler = () => {
      setRecords(thfRevisionService.getAll());
    };

    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) memoryStore = JSON.parse(cached);
        setRecords(thfRevisionService.getAll());
      } catch { }
    });

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  }, []);

  const getRevisionForFlight = useCallback((flightId?: number | string | null, lineMaintenanceId?: number | string | null, thfNumber?: string | null) => {
    return thfRevisionService.get(flightId, lineMaintenanceId, thfNumber);
  }, []);

  return {
    records,
    getRevisionForFlight,
    requestRevision: thfRevisionService.requestRevision.bind(thfRevisionService),
    submitRevision: thfRevisionService.submitRevision.bind(thfRevisionService),
    requestUnlock: thfRevisionService.requestUnlock.bind(thfRevisionService),
    approveUnlock: thfRevisionService.approveUnlock.bind(thfRevisionService),
    rejectUnlock: thfRevisionService.rejectUnlock.bind(thfRevisionService),
    reMapSuccess: thfRevisionService.reMapSuccess.bind(thfRevisionService),
  };
}
