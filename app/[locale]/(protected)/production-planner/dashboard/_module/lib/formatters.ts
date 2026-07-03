/** Formatting helpers shared by tables and charts. All amounts are THB. */

export function formatBaht(value: number): string {
  return '฿' + value.toLocaleString('en-US');
}

/** Compact "฿1.2M" style, used on axis ticks and metric cards. */
export function formatBahtCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return sign + '฿' + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return sign + '฿' + Math.round(abs / 1_000) + 'K';
  return sign + '฿' + abs.toLocaleString('en-US');
}

/** Same as formatBahtCompact but rounds millions to whole numbers (chart axes). */
export function formatBahtMillions(value: number): string {
  return '฿' + (value / 1_000_000).toFixed(0) + 'M';
}

export function formatPercent(value: number, opts: { showSign?: boolean } = {}): string {
  const { showSign = true } = opts;
  const sign = showSign && value >= 0 ? '+' : '';
  return sign + value.toFixed(0) + '%';
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toneFromValue(value: number): 'up' | 'down' | 'flat' {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}
