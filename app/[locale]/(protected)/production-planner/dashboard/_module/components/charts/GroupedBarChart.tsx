'use client';

import '../../lib/chart-setup';
import { Bar } from 'react-chartjs-2';
import { baseBarOptions, defaultTooltipFormatter } from '../../lib/chart-theme';

export interface BarSeries {
  label: string;
  data: number[];
  color: string;
}

interface GroupedBarChartProps {
  labels: string[];
  series: BarSeries[];
  height?: number;
  indexAxis?: 'x' | 'y';
  stacked?: boolean;
  showLegend?: boolean;
  tickFormatter?: (v: number) => string;
  tooltipPrefix?: string;
}

/** Drop-in replacement for the original inline `new Chart(...)` bar
 *  configs — feed it labels + colored series and it renders a grouped
 *  or stacked bar chart matching the dashboard's visual language. */
export function GroupedBarChart({
  labels,
  series,
  height = 260,
  indexAxis = 'x',
  stacked = false,
  showLegend = false,
  tickFormatter,
  tooltipPrefix = '',
}: GroupedBarChartProps) {
  const options = baseBarOptions(indexAxis, tickFormatter, showLegend);
  if (stacked && options.scales) {
    (options.scales.x as Record<string, unknown>).stacked = true;
    (options.scales.y as Record<string, unknown>).stacked = true;
  }
  options.plugins = {
    ...options.plugins,
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label ? ctx.dataset.label + ': ' : ''}${defaultTooltipFormatter(tooltipPrefix)(ctx.raw as number)}`,
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <Bar
        data={{
          labels,
          datasets: series.map((s) => ({
            label: s.label,
            data: s.data,
            backgroundColor: s.color,
            borderRadius: 3,
            stack: stacked ? 's' : undefined,
          })),
        }}
        options={options}
      />
    </div>
  );
}
