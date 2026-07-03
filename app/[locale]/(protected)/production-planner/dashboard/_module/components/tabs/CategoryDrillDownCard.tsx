import { palette } from '../../lib/chart-theme';
import { formatBaht } from '../../lib/formatters';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { Badge } from '../shared/Badge';
import { DataTable, type DataTableColumn } from '../shared/DataTable';
import type { CategoryDrillDown, CategorySubBreakdownRow } from '../../types';

const rowColumns: DataTableColumn<CategorySubBreakdownRow>[] = [
  { key: 'label', header: 'Sub-item', render: (r) => r.label },
  { key: 'p1Actual', header: 'P1 Act', headerColor: palette.p1, align: 'right', render: (r) => r.p1Actual.toLocaleString() },
  { key: 'p1VsPlan', header: 'P1 vs Plan', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsPlan} /> },
  { key: 'p1VsBudget', header: 'P1 vs Bud', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsBudget} /> },
  { key: 'p2Actual', header: 'P2 Act', headerColor: palette.p2, align: 'right', render: (r) => r.p2Actual.toLocaleString() },
  { key: 'p2VsPlan', header: 'P2 vs Plan', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsPlan} /> },
  { key: 'p2VsBudget', header: 'P2 vs Bud', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsBudget} /> },
  { key: 'popDelta', header: 'PoP Δ', align: 'right', render: (r) => <Badge badge={r.popDelta} /> },
];

export function CategoryDrillDownCard({ drillDown }: { drillDown: CategoryDrillDown }) {
  return (
    <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
      <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">{drillDown.title}</p>

      <div className="mb-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg bg-[#F0F7FF] px-3 py-2.5">
          <p className="mb-0.5 text-[11px] text-[var(--rcd-text-3)]">P1 actual</p>
          <p className="mb-0.5 text-[17px] font-bold" style={{ color: palette.p1 }}>{formatBaht(drillDown.p1Actual)}</p>
          <p className="mb-0.5 text-[11px] text-[var(--rcd-text-3)]">
            Budget {formatBaht(drillDown.p1Budget)} · Plan {formatBaht(drillDown.p1Plan)}
          </p>
          <p className="text-[11px] text-[var(--rcd-good)]">
            {drillDown.p1VsPlanPct} vs P1 plan · <strong>{drillDown.p1VsBudgetPct} vs Bud</strong>
          </p>
        </div>
        <div className="rounded-lg bg-[#F0FAF5] px-3 py-2.5">
          <p className="mb-0.5 text-[11px] text-[var(--rcd-text-3)]">P2 actual</p>
          <p className="mb-0.5 text-[17px] font-bold" style={{ color: palette.p2 }}>{formatBaht(drillDown.p2Actual)}</p>
          <p className="mb-0.5 text-[11px] text-[var(--rcd-text-3)]">
            Budget {formatBaht(drillDown.p2Budget)} · Plan {formatBaht(drillDown.p2Plan)}
          </p>
          <p className="text-[11px] text-[var(--rcd-good)]">
            {drillDown.p2VsPlanPct} vs P2 plan · <strong>{drillDown.p2VsBudgetPct} vs Bud</strong>
          </p>
        </div>
      </div>

      <DataTable columns={rowColumns} rows={drillDown.rows} getRowKey={(r) => r.label} isTotalRow={(r) => Boolean(r.isTotal)} />

      {drillDown.chart && (
        <div className="mt-3">
          <GroupedBarChart
            height={140}
            labels={drillDown.chart.labels}
            tickFormatter={(v) => '฿' + (v / 1e6).toFixed(1) + 'M'}
            series={[
              { label: 'P1', data: drillDown.chart.p1, color: palette.p1 },
              { label: 'P2', data: drillDown.chart.p2, color: palette.p2 },
            ]}
          />
        </div>
      )}
    </div>
  );
}
