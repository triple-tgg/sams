'use client';

import { useState } from 'react';
import type { CompareData, StationCode } from '../../types';
import { palette } from '../../lib/chart-theme';
import { formatBahtCompact } from '../../lib/formatters';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { KpiCard, StatTile } from '../shared/MetricCard';
import { Badge } from '../shared/Badge';
import { DataTable, type DataTableColumn } from '../shared/DataTable';
import { SectionLabel } from '../shared/Layout';
import { StationDetailPanel } from './StationDetailPanel';
import type { StationSummaryRow } from '../../types';

interface CompareTabProps {
  data: CompareData;
}

const summaryColumns: DataTableColumn<StationSummaryRow>[] = [
  { key: 'station', header: 'Station', render: (r) => r.displayLabel ?? r.station },
  { key: 'p1Prod', header: 'P1 Prod', align: 'right', render: (r) => r.p1Prod.toLocaleString() },
  { key: 'p2Prod', header: 'P2 Prod', align: 'right', render: (r) => r.p2Prod.toLocaleString() },
  { key: 'prodDelta', header: 'Prod Δ', align: 'right', render: (r) => <Badge badge={r.prodDelta} /> },
  { key: 'p1Rev', header: 'P1 Rev (฿)', align: 'right', render: (r) => r.p1Rev.toLocaleString() },
  { key: 'p2Rev', header: 'P2 Rev (฿)', align: 'right', render: (r) => r.p2Rev.toLocaleString() },
  { key: 'revDelta', header: 'Rev Δ', align: 'right', render: (r) => <Badge badge={r.revDelta} /> },
  { key: 'p1VsPlan', header: 'P1 vs Plan', align: 'right', render: (r) => <Badge badge={r.p1VsPlan} /> },
  { key: 'p1VsBudget', header: 'P1 vs Bud', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsBudget} /> },
  { key: 'p2VsPlan', header: 'P2 vs Plan', align: 'right', render: (r) => <Badge badge={r.p2VsPlan} /> },
  { key: 'p2VsBudget', header: 'P2 vs Bud', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsBudget} /> },
];

export function CompareTab({ data }: CompareTabProps) {
  const [activeStation, setActiveStation] = useState<StationCode>(data.stationDetails[data.stationDetails.length - 1].station);
  const activeDetail = data.stationDetails.find((d) => d.station === activeStation) ?? data.stationDetails[0];

  return (
    <div className="text-[13px] text-[color:var(--rcd-text)]">
      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <SectionLabel note="All stations · Production & Revenue · P1 vs P2">Station Overview</SectionLabel>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
          <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">Production by station — P1 vs P2 (services)</p>
          <ChartLegend />
          <GroupedBarChart
            height={260}
            labels={data.productionByStation.map((s) => s.station)}
            series={[
              { label: 'P1', data: data.productionByStation.map((s) => s.p1), color: palette.p1 },
              { label: 'P2', data: data.productionByStation.map((s) => s.p2), color: palette.p2 },
            ]}
          />
        </div>
        <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
          <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">Revenue by station — P1 vs P2 (THB)</p>
          <ChartLegend />
          <GroupedBarChart
            height={260}
            labels={data.revenueByStation.map((s) => s.station)}
            tickFormatter={(v) => formatBahtCompact(v)}
            series={[
              { label: 'P1', data: data.revenueByStation.map((s) => s.p1), color: palette.p1 },
              { label: 'P2', data: data.revenueByStation.map((s) => s.p2), color: palette.p2 },
            ]}
          />
        </div>
      </div>

      <div className="mt-3.5 rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
        <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">Station revenue change — P2 minus P1 (% change)</p>
        <div className="flex flex-wrap gap-2">
          {data.stationChange.map((s) => (
            <StatTile
              key={s.station}
              label={s.station}
              value={`${s.pctChange >= 0 ? '+' : ''}${s.pctChange.toFixed(1)}%`}
              valueTone={s.pctChange >= 0 ? 'up' : 'down'}
              sub={`${s.absChange >= 0 ? '+' : '-'}${formatBahtCompact(Math.abs(s.absChange))}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3.5 rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
        <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">Station summary — Production &amp; Revenue</p>
        <DataTable columns={summaryColumns} rows={data.stationSummary} getRowKey={(r, i) => `${r.station}-${i}`} isTotalRow={(r) => Boolean(r.isTotal)} />
      </div>

      <SectionLabel note="Production & Revenue · P1 vs P2">Customer Detail by Station</SectionLabel>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {data.stationDetails.map((d) => (
          <button
            key={d.station}
            type="button"
            onClick={() => setActiveStation(d.station)}
            className={`rounded-md border px-3 py-1 text-[11px] font-medium transition-colors ${
              activeStation === d.station
                ? 'border-[#bbb] bg-[var(--rcd-surface-alt)] text-[var(--rcd-text)]'
                : 'border-[#ddd] bg-white text-[var(--rcd-text-2)]'
            }`}
          >
            {d.station}
          </button>
        ))}
      </div>

      <StationDetailPanel detail={activeDetail} />
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="mb-2 flex flex-wrap gap-3.5 text-[11px] text-[var(--rcd-text-2)]">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: palette.p1 }} /> P1
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: palette.p2 }} /> P2
      </span>
    </div>
  );
}
