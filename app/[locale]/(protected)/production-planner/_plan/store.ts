'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_FX, EDITABLE_VERSION_COUNT, buildInitialVersions, type PlanVersion } from './data';

// In-memory store shared by Production Plan and Revenue Plan, so units edited
// on one page flow into the other during the session. Replace with API calls.

export interface PlanStoreState {
    /** Newest first, across all retained years. */
    versions: PlanVersion[];
    /** THB per USD, per year and month. */
    fx: Record<number, number[]>;
    budgetImportedAt: string;
    actualSyncedAt: string;
}

let state: PlanStoreState = {
    versions: buildInitialVersions(),
    fx: Object.fromEntries(Object.entries(DEFAULT_FX).map(([y, v]) => [y, [...v]])),
    budgetImportedAt: '05 Jan 2026 10:30',
    actualSyncedAt: '13 Oct 2026 06:00',
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function usePlanStore(): PlanStoreState {
    return useSyncExternalStore(subscribe, () => state, () => state);
}

export function updatePlanStore(fn: (s: PlanStoreState) => PlanStoreState) {
    state = fn(state);
    listeners.forEach((l) => l());
}

export function isVersionEditable(versions: PlanVersion[], id: string) {
    const idx = versions.findIndex((v) => v.id === id);
    return idx >= 0 && idx < EDITABLE_VERSION_COUNT;
}
