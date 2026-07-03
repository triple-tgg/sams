'use client';

import { useState } from 'react';
import type { OverviewData, StationCode } from '../../types';
import { formatBahtCompact, formatBaht } from '../../lib/formatters';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { CategoryDoughnutChart } from '../charts/CategoryDoughnutChart';
import { SingleSeriesBarChart } from '../charts/SingleSeriesBarChart';
import { ActualPlanLineChart } from '../charts/ActualPlanLineChart';
import { MetricCard } from '../shared/MetricCard';
import { VsStrip } from '../shared/VsStrip';
import { Badge } from '../shared/Badge';
import { CommentBox } from '../shared/CommentBox';
import { ChartCard, CardTitle, SectionLabel, SectionDivider } from '../shared/Layout';

interface OverviewTabProps {
  data: OverviewData;
}

const STATIONS: StationCode[] = ['BKK', 'HKT', 'CNX', 'DMK', 'HDY', 'CEI', 'KBV'];

export function OverviewTab({ data }: OverviewTabProps) {
  const [activeStation, setActiveStation] = useState<StationCode>('BKK');
  const totalTopRev = data.topCustomers.reduce((s, c) => s + c.ytdRevenue, 0);
  const activeLines = data.customerLinesByStation.find((s) => s.station === activeStation)?.series ?? [];

  return (
    <div className="font-sans text-[color:var(--rcd-text)]">
      {/* Header */}
      <div className="mb-7 flex items-start justify-between border-b border-[var(--rcd-border)] pb-5">
        <div>
          <h1 className="text-[22px] font-medium tracking-tight">Revenue Overview</h1>
          <div className="mt-1 font-mono text-[13px] text-[var(--rcd-text-3)]">
            {data.periodLabel} · All figures in {data.currency}
          </div>
        </div>
        <div className="text-right">
          <span className="mr-1.5 inline-block rounded border border-[var(--rcd-border)] bg-[var(--rcd-surface-alt)] px-2 py-[3px] font-mono text-[11px] text-[var(--rcd-text-3)]">
            {data.months[0]}–{data.months[data.months.length - 1]} 2026
          </span>
          <span className="mr-1.5 inline-block rounded border border-[var(--rcd-border)] bg-[var(--rcd-surface-alt)] px-2 py-[3px] font-mono text-[11px] text-[var(--rcd-text-3)]">
            5 categories
          </span>
          <span className="inline-block rounded border border-[var(--rcd-border)] bg-[var(--rcd-surface-alt)] px-2 py-[3px] font-mono text-[11px] text-[var(--rcd-text-3)]">
            7 stations
          </span>
        </div>
      </div>

      {/* Metric grid */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
        <MetricCard accent="blue" label="Total YTD" value={formatBahtCompact(data.grandTotal)} sub={`${data.months[0]}–${data.months[data.months.length - 1]} 2026`} />
        {data.metrics.map((m) => (
          <MetricCard
            key={m.category}
            accent={m.category === 'CAT-A' ? 'blue' : m.category === 'CAT-B' ? 'green' : m.category === 'CAT-D' ? 'pink' : 'purple'}
            label={m.label}
            value={formatBahtCompact(m.ytdTotal)}
            sub={`${m.pctOfTotal}% of total`}
          />
        ))}
      </div>

      {/* Trend + donut */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard>
          <CardTitle>Monthly revenue trend by category</CardTitle>
          <div className="mb-3 flex flex-wrap gap-3.5">
            {data.trendByCategory.map((s) => (
              <span key={s.category} className="flex items-center gap-1.5 text-[11px] text-[var(--rcd-text-2)]">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                {s.category}
              </span>
            ))}
          </div>
          <GroupedBarChart
            height={220}
            stacked
            labels={data.months}
            series={data.trendByCategory.map((s) => ({ label: s.category, data: s.monthly.map((m) => m.value), color: s.color }))}
            tickFormatter={(v) => '฿' + (v / 1e6).toFixed(0) + 'M'}
          />
          <VsStrip items={data.trendVsSummary} />
        </ChartCard>

        <ChartCard>
          <CardTitle>Revenue by category</CardTitle>
          <CategoryDoughnutChart
            height={200}
            labels={data.categoryDonut.map((d) => d.category)}
            data={data.categoryDonut.map((d) => d.value)}
            colors={data.categoryDonut.map((d) => d.color)}
          />
          <VsStrip items={data.categoryDonutVsSummary} />
        </ChartCard>
      </div>

      {/* Station revenue + CAT-B breakdown */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard>
          <CardTitle>CAT-A revenue by station</CardTitle>
          <SingleSeriesBarChart
            height={200}
            labels={data.stationRevenue.map((s) => s.station)}
            data={data.stationRevenue.map((s) => s.revenue)}
            colors={data.stationRevenue.map((s) => s.color)}
            tickFormatter={(v) => '฿' + (v / 1e6).toFixed(0) + 'M'}
          />
          <VsStrip
            items={data.stationRevenue.map((s) => ({
              category: s.station,
              color: s.color,
              pills: [
                { label: 'vs Bud', value: s.vsBudget },
                { label: 'vs Plan', value: s.vsPlan },
              ],
            }))}
          />
        </ChartCard>

        <ChartCard>
          <CardTitle>CAT-B services breakdown</CardTitle>
          <SingleSeriesBarChart
            height={240}
            indexAxis="y"
            labels={data.categoryBBreakdown.map((d) => d.label)}
            data={data.categoryBBreakdown.map((d) => d.revenue)}
            colors="#1a7a47"
            tickFormatter={(v) => '฿' + (v / 1e6).toFixed(1) + 'M'}
          />
        </ChartCard>
      </div>

      {/* Top customers */}
      <div className="mb-3 rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-[18px]">
        <CardTitle>Top customers by YTD revenue</CardTitle>
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-b border-[var(--rcd-border)] py-1.5 text-left font-mono text-[11px] uppercase tracking-wide text-[var(--rcd-text-3)]">Customer</th>
              <th className="border-b border-[var(--rcd-border)] py-1.5 text-left font-mono text-[11px] uppercase tracking-wide text-[var(--rcd-text-3)]">Cat</th>
              <th className="border-b border-[var(--rcd-border)] py-1.5 text-left font-mono text-[11px] uppercase tracking-wide text-[var(--rcd-text-3)]">Station(s)</th>
              <th className="border-b border-[var(--rcd-border)] py-1.5 text-right font-mono text-[11px] uppercase tracking-wide text-[var(--rcd-text-3)]">YTD Revenue</th>
              <th className="border-b border-[var(--rcd-border)] py-1.5 text-right font-mono text-[11px] uppercase tracking-wide text-[var(--rcd-text-3)]">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.topCustomers.map((c) => {
              const pct = ((c.ytdRevenue / totalTopRev) * 100).toFixed(1);
              const isA = c.category === 'CAT-A';
              return (
                <tr key={c.name} className="[&>td]:border-b [&>td]:border-[var(--rcd-hairline)] [&>td]:py-2">
                  <td className="font-medium">{c.name}</td>
                  <td>
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${isA ? 'bg-[var(--rcd-badge-blue-bg)] text-[var(--rcd-badge-blue-fg)]' : 'bg-[var(--rcd-badge-green-bg)] text-[var(--rcd-badge-green-fg)]'}`}>
                      {c.category}
                    </span>
                  </td>
                  <td className="text-[var(--rcd-text-3)]">{c.stations}</td>
                  <td className="text-right">{formatBaht(c.ytdRevenue)}</td>
                  <td className={`text-right font-mono text-[13px] font-semibold ${isA ? 'text-[var(--rcd-cat-a)]' : 'text-[var(--rcd-cat-b)]'}`}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Growth & loss by station */}
      <SectionDivider />
      <SectionLabel note="Absolute revenue change from January to May. Partial May data (1–21 May) noted.">
        CAT-A growth &amp; loss by station (Jan → May)
      </SectionLabel>
      <div className="mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {data.growthLossByStation.map((card) => (
          <div key={card.station} className="rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-3.5">
            <div className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--rcd-cat-a)]">{card.station}</div>
            {card.gains.map((item) => (
              <GrowthLossRow key={item.customer} item={item} />
            ))}
            <div className="my-2 h-px bg-[var(--rcd-border)]" />
            {card.losses.map((item) => (
              <GrowthLossRow key={item.customer} item={item} />
            ))}
            {card.noOtherCustomers && <div className="text-xs text-[var(--rcd-text-3)]">No other customers</div>}
          </div>
        ))}
      </div>

      <CommentBox storageKey="rcd-catA-gl-comment" title="Comments & Analysis — CAT-A Growth & Loss by Station" />

      <div className="mt-3.5 rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-[18px]">
        <CardTitle>CAT-A top movers — absolute revenue change (Jan → May)</CardTitle>
        <div className="mb-3 flex gap-3.5">
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--rcd-text-2)]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--rcd-good)' }} />
            Growth
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--rcd-text-2)]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--rcd-bad)' }} />
            Loss
          </span>
        </div>
        <SingleSeriesBarChart
          height={340}
          indexAxis="y"
          labels={data.topMovers.map((m) => m.label)}
          data={data.topMovers.map((m) => m.delta)}
          colors={data.topMovers.map((m) => (m.delta >= 0 ? '#1a7a47' : '#c0392b'))}
          axisPadding={1.3}
          signed
        />
      </div>

      {/* Customer-per-station lines */}
      <SectionDivider />
      <SectionLabel note="Solid line = Actual revenue (Jan–May 2026) · Dashed line = Plan (full year Jan–Dec). Select a station below.">
        CAT-A monthly production by customer per station
      </SectionLabel>
      <div className="rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-[18px]">
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {STATIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveStation(s)}
              className={`rounded font-mono text-[11px] font-medium px-2.5 py-1 transition-colors ${
                activeStation === s
                  ? 'border border-[var(--rcd-cat-a)] bg-[var(--rcd-badge-blue-bg)] text-[var(--rcd-cat-a)]'
                  : 'border border-[var(--rcd-border-strong)] bg-transparent text-[var(--rcd-text-2)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <ActualPlanLineChart allMonths={data.allMonths} actualMonthsCount={data.months.length} series={activeLines} height={340} />
      </div>

      {/* Station monthly lines */}
      <SectionDivider />
      <SectionLabel note="Revenue of each station per month. Solid line = Actual (Jan–May 2026) · Dashed line = Plan (Jan–Dec).">
        CAT-A monthly production by station
      </SectionLabel>
      <div className="rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-[18px]">
        <ActualPlanLineChart
          allMonths={data.allMonths}
          actualMonthsCount={data.months.length}
          height={320}
          series={data.stationMonthly.map((s) => ({ id: s.station, label: s.station, color: s.color, actual: s.actual, plan: s.plan }))}
        />
      </div>

      {/* Category monthly lines */}
      <SectionDivider />
      <SectionLabel note="Revenue of each category per month. Solid line = Actual (Jan–May 2026) · Dashed line = Plan (Jan–Dec).">
        Total revenue by category
      </SectionLabel>
      <div className="rounded-[var(--rcd-radius-lg)] border border-[var(--rcd-border)] bg-[var(--rcd-surface)] p-[18px]">
        <ActualPlanLineChart
          allMonths={data.allMonths}
          actualMonthsCount={data.months.length}
          height={320}
          series={data.categoryMonthly.map((s) => ({ id: s.category, label: s.category, color: s.color, actual: s.actual, plan: s.plan }))}
        />
      </div>

      <div className="mt-8 border-t border-[var(--rcd-border)] pt-5 text-center font-mono text-[11px] text-[var(--rcd-text-3)]">
        Revenue Overview · {data.periodLabel} · {data.currency} · Generated from production data
      </div>
    </div>
  );
}

function GrowthLossRow({ item }: { item: OverviewData['growthLossByStation'][number]['gains'][number] }) {
  const isUp = item.delta >= 0;
  return (
    <div className="mb-1.5 flex items-start justify-between gap-1.5">
      <div>
        <div className="text-xs font-medium">
          {item.customer}
          {item.badge && (
            <span className="ml-1.5 align-middle">
              <Badge badge={{ label: item.badge.label, tone: item.badge.tone === 'gone' ? 'amber' : item.badge.tone === 'up' ? 'up' : 'new' }} />
            </span>
          )}
        </div>
        <div className="text-[10px] text-[var(--rcd-text-3)]">{item.detail}</div>
      </div>
      <div className={`text-[11px] font-medium whitespace-nowrap ${isUp ? 'text-[var(--rcd-good)]' : 'text-[var(--rcd-bad)]'}`}>
        {isUp ? '+' : '−'}{formatBahtCompact(Math.abs(item.delta))}
      </div>
    </div>
  );
}
