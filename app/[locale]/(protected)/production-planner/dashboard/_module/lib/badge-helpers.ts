import type { TrendBadge } from '../types';

/** `bd` wraps a pre-formatted label (e.g. "+12%", "-6", "New", "—") with
 *  a semantic tone. The shorthand helpers below cover the tones used
 *  throughout the comparison tables and vs-strips. */
export function bd(label: string, tone: TrendBadge['tone']): TrendBadge {
  return { label, tone };
}
export const UP = (label: string): TrendBadge => bd(label, 'up');
export const DOWN = (label: string): TrendBadge => bd(label, 'down');
export const FLAT = (label: string): TrendBadge => bd(label, 'flat');
export const NA = (label = 'N/A'): TrendBadge => bd(label, 'na');
export const NEW = (label = 'New'): TrendBadge => bd(label, 'new');

/** Builds the full-year "plan" line for a solid/dashed line chart: the
 *  actual-period months are approximated at +3% (mirrors the source
 *  mockup's `act * 1.03` placeholder), followed by the forecast months. */
export function buildPlan(actual: (number | null)[], forecast: number[]): (number | null)[] {
  const actualPlan = actual.map((v) => (v != null ? Math.round(v * 1.03) : null));
  return [...actualPlan, ...forecast];
}
