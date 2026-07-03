import type { CategoryTabData, CategorySummaryRow } from '../../types';
import { palette } from '../../lib/chart-theme';
import { CategorySixBarChart } from '../charts/CategorySixBarChart';
import { KpiCard } from '../shared/MetricCard';
import { Badge } from '../shared/Badge';
import { DataTable, type DataTableColumn } from '../shared/DataTable';
import { CategoryDrillDownCard } from './CategoryDrillDownCard';

interface CategoryTabProps {
  data: CategoryTabData;
}

const SIX_BAR_LEGEND = [
  { label: 'P1 Budget', color: '#B8D4F0', border: '#7AAAD8' },
  { label: 'P1 Plan', color: '#6AAAE0', border: '#378ADD' },
  { label: 'P1 Actual', color: palette.p1, border: palette.p1 },
  { label: 'P2 Budget', color: '#A8D9C4', border: '#6DC4A4' },
  { label: 'P2 Plan', color: '#5CB898', border: '#1D9E75' },
  { label: 'P2 Actual', color: palette.p2, border: palette.p2 },
];

const summaryColumns: DataTableColumn<CategorySummaryRow>[] = [
  { key: 'category', header: 'Category', render: (r) => <strong>{r.displayLabel ?? r.category}</strong> },
  { key: 'p1Budget', header: 'P1 Bud', headerColor: palette.p1, align: 'right', render: (r) => r.p1Budget.toLocaleString() },
  { key: 'p1Plan', header: 'P1 Plan', headerColor: palette.p1, align: 'right', render: (r) => r.p1Plan.toLocaleString() },
  { key: 'p1Actual', header: 'P1 Act', headerColor: palette.p1, align: 'right', render: (r) => <span style={{ color: palette.p1, fontWeight: 600 }}>{r.p1Actual.toLocaleString()}</span> },
  { key: 'p1VsPlan', header: 'P1 vs Plan', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsPlan} /> },
  { key: 'p1VsBudget', header: 'P1 vs Bud', headerColor: palette.p1, align: 'right', render: (r) => <Badge badge={r.p1VsBudget} /> },
  { key: 'p2Budget', header: 'P2 Bud', headerColor: palette.p2, align: 'right', render: (r) => r.p2Budget.toLocaleString() },
  { key: 'p2Plan', header: 'P2 Plan', headerColor: palette.p2, align: 'right', render: (r) => r.p2Plan.toLocaleString() },
  { key: 'p2Actual', header: 'P2 Act', headerColor: palette.p2, align: 'right', render: (r) => <span style={{ color: palette.p2, fontWeight: 600 }}>{r.p2Actual.toLocaleString()}</span> },
  { key: 'p2VsPlan', header: 'P2 vs Plan', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsPlan} /> },
  { key: 'p2VsBudget', header: 'P2 vs Bud', headerColor: palette.p2, align: 'right', render: (r) => <Badge badge={r.p2VsBudget} /> },
  { key: 'popDelta', header: 'PoP Δ', align: 'right', render: (r) => <Badge badge={r.popDelta} /> },
];

export function CategoryTab({ data }: CategoryTabProps) {
  return (
    <div className="text-[13px] text-[color:var(--rcd-text)]">
      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
        <p className="mb-1 text-[11px] font-semibold text-[var(--rcd-text-3)]">
          Revenue by category — Budget vs Plan vs Actual (P1 vs P2) with % vs Plan
        </p>
        <p className="mb-3 text-[11px] text-[var(--rcd-text-3)]">
          6 bars per category: P1 Budget · P1 Plan · P1 Actual · P2 Budget · P2 Plan · P2 Actual. % labels show Actual vs Plan variance.
        </p>
        <div className="mb-3.5 flex flex-wrap gap-3.5">
          {SIX_BAR_LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-[var(--rcd-text-2)]">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border-[1.5px]" style={{ background: l.color, borderColor: l.border }} />
              {l.label}
            </span>
          ))}
        </div>
        <CategorySixBarChart data={data.sixBarChart} height={380} />

        <div className="mt-3.5 border-t border-[var(--rcd-hairline)] pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--rcd-text-3)]">Actual vs Plan &amp; Budget %</p>
          <div className="flex flex-wrap gap-2.5">
            {data.vsPlanBudgetCards.map((card) => {
              const isTotal = card.category === 'TOTAL';
              return (
                <div key={card.category} className={`min-w-[80px] flex-1 rounded-lg px-3.5 py-2 ${isTotal ? 'bg-[var(--rcd-text)]' : 'bg-[var(--rcd-surface-alt)]'}`}>
                  <p className={`mb-1 text-[10px] font-semibold ${isTotal ? 'text-[#aaa]' : 'text-[var(--rcd-text-3)]'}`}>{card.category}</p>
                  <p className="mb-0.5 text-[11px]">
                    <span className={`font-semibold ${isTotal ? 'text-[#7bc4f8]' : ''}`} style={!isTotal ? { color: palette.p1 } : undefined}>P1:</span>{' '}
                    <Badge badge={card.p1VsPlan} /> <span className="text-[10px] text-[var(--rcd-text-3)]">Plan</span> &nbsp;
                    <Badge badge={card.p1VsBudget} /> <span className="text-[10px] text-[var(--rcd-text-3)]">Bud</span>
                  </p>
                  <p className="text-[11px]">
                    <span className={`font-semibold ${isTotal ? 'text-[#6ddab0]' : ''}`} style={!isTotal ? { color: palette.p2 } : undefined}>P2:</span>{' '}
                    <Badge badge={card.p2VsPlan} /> <span className="text-[10px] text-[var(--rcd-text-3)]">Plan</span> &nbsp;
                    <Badge badge={card.p2VsBudget} /> <span className="text-[10px] text-[var(--rcd-text-3)]">Bud</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3.5 rounded-xl border border-[var(--rcd-border)] bg-white p-3.5">
        <p className="mb-2 text-[11px] font-semibold text-[var(--rcd-text-3)]">Full category summary — P1 vs P2</p>
        <DataTable columns={summaryColumns} rows={data.summary} getRowKey={(r, i) => `${r.category}-${i}`} isTotalRow={(r) => Boolean(r.isTotal)} />
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {data.drillDowns.map((d) => (
          <CategoryDrillDownCard key={d.category} drillDown={d} />
        ))}
      </div>
    </div>
  );
}
