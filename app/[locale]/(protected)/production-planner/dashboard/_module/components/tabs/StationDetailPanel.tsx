import { palette } from '../../lib/chart-theme';
import { formatBahtCompact } from '../../lib/formatters';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { Badge } from '../shared/Badge';
import { DataTable, type DataTableColumn } from '../shared/DataTable';
import type { StationDetail, CustomerCompareRow } from '../../types';

const LEGEND = [
  { label: 'Budget', color: palette.budget },
  { label: 'Plan', color: palette.plan },
  { label: 'P1', color: palette.p1 },
  { label: 'P2', color: palette.p2 },
];

const customerColumns: DataTableColumn<CustomerCompareRow>[] = [
  { key: 'customer', header: 'Customer', render: (r) => r.customer },
  { key: 'p1Prod', header: 'P1 Prod', align: 'right', render: (r) => r.p1Prod.toLocaleString() },
  { key: 'p2Prod', header: 'P2 Prod', align: 'right', render: (r) => r.p2Prod.toLocaleString() },
  { key: 'prodDelta', header: 'Prod Δ', align: 'right', render: (r) => <Badge badge={r.prodDelta} /> },
  { key: 'p1Rev', header: 'P1 Rev (฿)', align: 'right', render: (r) => r.p1Rev.toLocaleString() },
  { key: 'p2Rev', header: 'P2 Rev (฿)', align: 'right', render: (r) => r.p2Rev.toLocaleString() },
  { key: 'revDeltaPct', header: 'Rev Δ%', align: 'right', render: (r) => <Badge badge={r.revDeltaPct} /> },
  { key: 'p1VsPlan', header: 'P1 vs Plan', align: 'right', render: (r) => <Badge badge={r.p1VsPlan} /> },
  { key: 'p1VsBudget', header: 'P1 vs Bud', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsBudget} /> },
  { key: 'p2VsPlan', header: 'P2 vs Plan', align: 'right', render: (r) => <Badge badge={r.p2VsPlan} /> },
  { key: 'p2VsBudget', header: 'P2 vs Bud', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsBudget} /> },
];

export function StationDetailPanel({ detail }: { detail: StationDetail }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
          <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">{detail.label} — Production P1 vs P2 (services)</p>
          <Legend />
          <GroupedBarChart
            height={detail.chartHeight}
            indexAxis="y"
            labels={detail.production.labels}
            showLegend
            series={[
              { label: 'Budget', data: detail.production.budget, color: palette.budget },
              { label: 'Plan', data: detail.production.plan, color: palette.plan },
              { label: 'P1', data: detail.production.p1, color: palette.p1 },
              { label: 'P2', data: detail.production.p2, color: palette.p2 },
            ]}
          />
        </div>
        <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
          <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">{detail.label} — Revenue P1 vs P2 (THB)</p>
          <Legend />
          <GroupedBarChart
            height={detail.chartHeight}
            indexAxis="y"
            labels={detail.revenue.labels}
            showLegend
            tickFormatter={(v) => formatBahtCompact(v)}
            series={[
              { label: 'Budget', data: detail.revenue.budget, color: palette.budget },
              { label: 'Plan', data: detail.revenue.plan, color: palette.plan },
              { label: 'P1', data: detail.revenue.p1, color: palette.p1 },
              { label: 'P2', data: detail.revenue.p2, color: palette.p2 },
            ]}
          />
        </div>
      </div>

      {detail.customers.length > 0 && (
        <div className="mt-3.5 rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
          <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">{detail.label} — Customer detail</p>
          <DataTable columns={customerColumns} rows={detail.customers} getRowKey={(r) => r.customer} isTotalRow={(r) => Boolean(r.isTotal)} />
        </div>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mb-2 flex flex-wrap gap-3.5">
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-[var(--rcd-text-2)]">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}
