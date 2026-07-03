import type { ChartOptions } from 'chart.js';
import { formatBahtCompact } from './formatters';

/** Palette — mirrors the CSS custom properties in styles/globals.css so
 *  charts and DOM badges always agree. Keep these two in sync. */
export const palette = {
  /* Project primary blue — matches hsl(221.2, 83.2%, 53.3%) */
  p1: '#3b82f6',
  p2: '#1D9E75',
  loss: '#ef4444',
  gridLine: 'rgba(0,0,0,0.06)',
  axisText: '#9096a3',
  categoryA: '#3b82f6',
  categoryB: '#1a7a47',
  categoryC: '#a05c00',
  categoryD: '#b0377a',
  categoryE: '#6b4fc4',
  station: ['#3b82f6', '#1a7a47', '#b0377a', '#a05c00', '#6b4fc4', '#1a8c84', '#7a5c00'],
  budget: '#d5d5d5',
  plan: '#F4A93A',
  gain: '#1a7a47',
  lossDark: '#c0392b',
  seriesCycle: [
    '#1a6fd4', '#c0580a', '#1a7a47', '#b0377a', '#6b4fc4', '#1a8c84', '#c0392b',
    '#7a5c00', '#7c3aed', '#0e7490', '#b45309', '#0f766e', '#be185d', '#4d7c0f',
  ],
} as const;

/** Category → color lookup (keys match the `Category` type). */
export const categoryColor: Record<string, string> = {
  'CAT-A': palette.categoryA,
  'CAT-B': palette.categoryB,
  'CAT-C': palette.categoryC,
  'CAT-D': palette.categoryD,
  'CAT-E': palette.categoryE,
};

type TickFormatter = (value: number) => string;

/** Shared axis/legend defaults, parameterised the same way the original
 *  dashboard's `baseOpts(isHorizontal, tickFormatter)` helper worked. */
export function baseBarOptions(
  indexAxis: 'x' | 'y',
  tickFormatter?: TickFormatter,
  showLegend = false
): ChartOptions<'bar'> {
  const valueAxisTicks = {
    color: palette.axisText,
    font: { size: 10 },
    callback: (v: number | string) => (tickFormatter ? tickFormatter(Number(v)) : v),
  };
  const categoryAxisTicks = { color: palette.axisText, font: { size: 11 }, autoSkip: false };

  return {
    indexAxis,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: showLegend
        ? { display: true, position: 'top', labels: { color: palette.axisText, font: { size: 10 }, boxWidth: 10, boxHeight: 10, padding: 8 } }
        : { display: false },
    },
    scales:
      indexAxis === 'y'
        ? {
            x: { ticks: valueAxisTicks, grid: { color: palette.gridLine } },
            y: { ticks: categoryAxisTicks, grid: { display: false } },
          }
        : {
            x: { ticks: categoryAxisTicks, grid: { display: false } },
            y: { ticks: valueAxisTicks, grid: { color: palette.gridLine } },
          },
  };
}

export function defaultTooltipFormatter(prefix = '') {
  return (raw: number) => ` ${prefix}${formatBahtCompact(raw)}`;
}
