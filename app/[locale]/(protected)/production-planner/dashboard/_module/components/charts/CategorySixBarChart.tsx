'use client';

import '../../lib/chart-setup';
import { Bar } from 'react-chartjs-2';
import type { Plugin } from 'chart.js';
import { palette } from '../../lib/chart-theme';
import { formatBahtMillions } from '../../lib/formatters';
import type { CategorySixBarSeries } from '../../types';

interface CategorySixBarChartProps {
  data: CategorySixBarSeries;
  height?: number;
}

const SIX_BAR_COLORS = ['#C5DDF5', '#6AAAE0', palette.p1, '#A8D9C4', '#5CB898', palette.p2];

function pctLabelPlugin(p1Plan: number[], p1Act: number[], p2Plan: number[], p2Act: number[]): Plugin<'bar'> {
  return {
    id: 'pctLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const actualIdxP1 = 2;
      const actualIdxP2 = 5;
      ctx.save();
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ([actualIdxP1, actualIdxP2] as const).forEach((dsIdx) => {
        const meta = chart.getDatasetMeta(dsIdx);
        const isP1 = dsIdx === actualIdxP1;
        const plans = isP1 ? p1Plan : p2Plan;
        const acts = isP1 ? p1Act : p2Act;
        meta.data.forEach((bar, i) => {
          if (!plans[i]) return;
          const pct = Math.round((acts[i] / plans[i] - 1) * 100);
          const sign = pct >= 0 ? '+' : '';
          ctx.fillStyle = pct >= 0 ? '#3B6D11' : '#993C1D';
          const point = bar as unknown as { x: number; y: number };
          ctx.fillText(`${sign}${pct}%`, point.x, point.y - 5);
        });
      });
      ctx.restore();
    },
  };
}

/** The "6 bars per category" comparison chart (P1/P2 × Budget/Plan/Actual)
 *  with +/- variance-vs-plan labels drawn above each Actual bar. */
export function CategorySixBarChart({ data, height = 380 }: CategorySixBarChartProps) {
  const { categories, p1Budget, p1Plan, p1Actual, p2Budget, p2Plan, p2Actual } = data;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <Bar
        data={{
          labels: categories,
          datasets: [
            { label: 'P1 Budget', data: p1Budget, backgroundColor: SIX_BAR_COLORS[0], borderRadius: 3 },
            { label: 'P1 Plan', data: p1Plan, backgroundColor: SIX_BAR_COLORS[1], borderRadius: 3 },
            { label: 'P1 Actual', data: p1Actual, backgroundColor: SIX_BAR_COLORS[2], borderRadius: 3 },
            { label: 'P2 Budget', data: p2Budget, backgroundColor: SIX_BAR_COLORS[3], borderRadius: 3 },
            { label: 'P2 Plan', data: p2Plan, backgroundColor: SIX_BAR_COLORS[4], borderRadius: 3 },
            { label: 'P2 Actual', data: p2Actual, backgroundColor: SIX_BAR_COLORS[5], borderRadius: 3 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ฿${((ctx.raw as number) / 1_000_000).toFixed(2)}M`,
              },
            },
          },
          scales: {
            x: { ticks: { color: palette.axisText, font: { size: 11 }, autoSkip: false }, grid: { display: false } },
            y: { ticks: { color: palette.axisText, font: { size: 10 }, callback: (v) => formatBahtMillions(Number(v)) }, grid: { color: palette.gridLine }, beginAtZero: true },
          },
        }}
        plugins={[pctLabelPlugin(p1Plan, p1Actual, p2Plan, p2Actual)]}
      />
    </div>
  );
}
