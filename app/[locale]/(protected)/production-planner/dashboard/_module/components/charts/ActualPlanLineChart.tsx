'use client';

import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';
import type { Plugin } from 'chart.js';
import { palette } from '../../lib/chart-theme';
import { formatBahtCompact } from '../../lib/formatters';
import type { ActualPlanSeries } from '../../types';

interface ActualPlanLineChartProps {
  /** Full year timeline shown on the x-axis, e.g. Jan..Dec. */
  allMonths: string[];
  /** How many leading months in `allMonths` are "actual" (solid line). The
   *  remainder is treated as the forecast/plan-only region and shaded. */
  actualMonthsCount: number;
  series: ActualPlanSeries[];
  height?: number;
  /** Show a legend row above the chart (one swatch per series). Set to
   *  false if the parent renders its own legend (e.g. a shared station legend). */
  showLegend?: boolean;
}

function forecastShadePlugin(splitIndex: number): Plugin<'line'> {
  return {
    id: 'forecastShade',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;
      const xSplit = scales.x.getPixelForValue(splitIndex);
      ctx.save();
      ctx.fillStyle = 'rgba(200,200,180,0.08)';
      ctx.fillRect(xSplit, chartArea.top, chartArea.right - xSplit, chartArea.bottom - chartArea.top);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = 'rgba(150,140,100,0.5)';
      ctx.font = '9px sans-serif';
      ctx.fillText('▷ PLAN', xSplit + 6, chartArea.top + 14);
      ctx.restore();
    },
  };
}

export function ActualPlanLineChart({
  allMonths,
  actualMonthsCount,
  series,
  height = 320,
  showLegend = true,
}: ActualPlanLineChartProps) {
  const forecastLen = allMonths.length - actualMonthsCount;

  const datasets = series.flatMap((s) => [
    {
      label: `${s.label} (Actual)`,
      data: [...s.actual, ...Array(forecastLen).fill(null)],
      borderColor: s.color,
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      borderDash: [],
      pointRadius: [...s.actual.map((v) => (v != null ? 4 : 0)), ...Array(forecastLen).fill(0)],
      pointHoverRadius: 6,
      spanGaps: false,
      tension: 0.3,
    },
    {
      label: `${s.label} (Plan)`,
      data: s.plan,
      borderColor: s.color,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [6, 3],
      pointRadius: Array(allMonths.length).fill(0),
      pointHoverRadius: 4,
      spanGaps: true,
      tension: 0.3,
    },
  ]);

  return (
    <div>
      {showLegend && (
        <div className="mb-2 flex flex-wrap gap-3.5">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-[color:var(--rcd-text-2)]">
              <span className="inline-block h-0.5 w-[18px]" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="mb-2.5 flex gap-4 text-[11px] text-[color:var(--rcd-text-2)]">
        <span>
          <span className="mr-1 inline-block h-0.5 w-[22px] align-middle" style={{ background: 'currentColor' }} />
          Actual
        </span>
        <span>
          <span
            className="mr-1 inline-block w-[22px] align-middle border-t-2 border-dashed"
            style={{ borderColor: 'currentColor' }}
          />
          Plan
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%', height }}>
        <Line
          data={{ labels: allMonths, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.raw == null) return '';
                    const type = (ctx.dataset.label ?? '').includes('Plan') ? 'Plan' : 'Actual';
                    const seriesLabel = (ctx.dataset.label ?? '').replace(/ \((Actual|Plan)\)$/, '');
                    return ` ${seriesLabel} [${type}]: ${formatBahtCompact(ctx.raw as number)}`;
                  },
                  // Chart.js v4 typings: filter belongs alongside callbacks
                },
                filter: (item) => item.raw != null,
              },
            },
            scales: {
              x: { grid: { color: palette.gridLine }, ticks: { color: palette.axisText, autoSkip: false } },
              y: { grid: { color: palette.gridLine }, ticks: { color: palette.axisText, callback: (v) => formatBahtCompact(Number(v)) } },
            },
          }}
          plugins={[forecastShadePlugin(actualMonthsCount)]}
        />
      </div>
    </div>
  );
}
