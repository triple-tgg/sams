'use client';

import '../../lib/chart-setup';
import { Doughnut } from 'react-chartjs-2';
import { palette } from '../../lib/chart-theme';
import { formatBahtCompact } from '../../lib/formatters';

interface CategoryDoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  height?: number;
  /** Border color drawn between slices — set to match the card background. */
  sliceBorderColor?: string;
}

export function CategoryDoughnutChart({
  labels,
  data,
  colors,
  height = 200,
  sliceBorderColor = '#ffffff',
}: CategoryDoughnutChartProps) {
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <Doughnut
        data={{ labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: sliceBorderColor }] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { color: palette.axisText, font: { size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw as number;
                  const pct = ((raw / total) * 100).toFixed(1);
                  return ` ${ctx.label}: ${formatBahtCompact(raw)} (${pct}%)`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
