'use client';

import '../../lib/chart-setup';
import { Bar } from 'react-chartjs-2';
import { baseBarOptions } from '../../lib/chart-theme';
import { formatBahtCompact } from '../../lib/formatters';

interface SingleSeriesBarChartProps {
  labels: string[];
  data: number[];
  /** One color for every bar, or one color per bar (e.g. gain/loss diverging). */
  colors: string | string[];
  height?: number;
  indexAxis?: 'x' | 'y';
  tickFormatter?: (v: number) => string;
  /** Widen the value axis beyond the data range, e.g. 1.3 = +30% padding. */
  axisPadding?: number;
  /** Prefix sign (+/-) explicitly in tooltips/labels — useful for delta charts. */
  signed?: boolean;
}

export function SingleSeriesBarChart({
  labels,
  data,
  colors,
  height = 260,
  indexAxis = 'x',
  tickFormatter,
  axisPadding,
  signed = false,
}: SingleSeriesBarChartProps) {
  const options = baseBarOptions(indexAxis, tickFormatter);
  options.plugins = {
    ...options.plugins,
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const v = ctx.raw as number;
          if (signed) return ` ${v >= 0 ? '+' : '-'}${formatBahtCompact(Math.abs(v))}`;
          return ` ${formatBahtCompact(v)}`;
        },
      },
    },
  };

  if (axisPadding && options.scales) {
    const valueAxisKey = indexAxis === 'y' ? 'x' : 'y';
    const min = Math.min(...data);
    const max = Math.max(...data);
    (options.scales[valueAxisKey] as Record<string, unknown>).min = min < 0 ? min * axisPadding : undefined;
    (options.scales[valueAxisKey] as Record<string, unknown>).max = max * axisPadding;
  }

  const backgroundColor = Array.isArray(colors) ? colors : labels.map(() => colors);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <Bar
        data={{ labels, datasets: [{ data, backgroundColor, borderRadius: 3 }] }}
        options={options}
      />
    </div>
  );
}
