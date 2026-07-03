# Revenue Comparison Dashboard — module

Self-contained Next.js module ported from `Revenue_Dashboard_2026_Revised.html`.
Copy this whole folder into any Next.js 16+ / Tailwind v4 project and it
works as-is.

## Requirements

- Next.js **16.1.6+** (App Router, React Server/Client Components)
- Tailwind CSS **v4.3+** (CSS-first `@theme` config)
- `chart.js` and `react-chartjs-2`

```bash
npm install chart.js react-chartjs-2
```

## Install into another project

1. Copy this entire `revenue-comparison-dashboard/` folder into your
   project, e.g. `src/modules/revenue-comparison-dashboard/`.
2. Pull the module's design tokens into your global stylesheet — either:
   - `@import "./modules/revenue-comparison-dashboard/styles/globals.css";`
     at the top of your app's `globals.css`, **or**
   - copy the `@theme { ... }` block and the `:root { --rcd-* }` block
     into your existing `@theme`/`:root` if you'd rather not add a
     second import.
3. Use the component:

```tsx
import { RevenueComparisonDashboard } from '@/modules/revenue-comparison-dashboard';

export default function Page() {
  return <RevenueComparisonDashboard />;
}
```

That renders with the bundled sample dataset (ported 1:1 from the
original HTML mock) so you can see it working immediately.

## Wiring up real data

Every number in the dashboard flows through one typed contract:
`RevenueDashboardData` (see `types.ts`). Fetch your real data server-side
(or in a parent Server Component) shaped to that interface, then pass it
in:

```tsx
import { RevenueComparisonDashboard } from '@/modules/revenue-comparison-dashboard';
import type { RevenueDashboardData } from '@/modules/revenue-comparison-dashboard';

async function getRevenueDashboardData(): Promise<RevenueDashboardData> {
  const res = await fetch('https://your-api/revenue-dashboard', { cache: 'no-store' });
  return res.json();
}

export default async function Page() {
  const data = await getRevenueDashboardData();
  return <RevenueComparisonDashboard data={data} />;
}
```

`data/mock-data.ts` (plus `data/overview-data.ts`, `compare-data.ts`,
`category-data.ts`) is the worked example of how to build that object —
use it as a reference for your API's response shape, or delete it once
you're wired to a real source.

### Reacting to the P1/P2 date picker

The header's date-range picker is cosmetic by default (it only reformats
the badges). To make "Apply & Compare" actually re-query data, pass
`onPeriodsChange`:

```tsx
<RevenueComparisonDashboard
  data={data}
  onPeriodsChange={(periods) => {
    // periods = { p1: { start, end }, p2: { start, end } }
    // re-fetch and update `data` here (e.g. via a client-side router
    // refresh, SWR/React Query mutation, or lifting state up).
  }}
/>
```

## Folder structure

```
revenue-comparison-dashboard/
├── index.ts                     # public exports
├── types.ts                     # RevenueDashboardData contract (start here)
├── data/
│   ├── mock-data.ts             # combined sample dataset
│   ├── overview-data.ts         # Overview tab sample data
│   ├── compare-data.ts          # Compare tab sample data
│   └── category-data.ts         # Category tab sample data
├── lib/
│   ├── formatters.ts            # ฿ / % / date formatting helpers
│   ├── chart-theme.ts           # shared color palette + Chart.js option builders
│   ├── chart-setup.ts           # Chart.js component registration
│   └── badge-helpers.ts         # TrendBadge construction shorthands
├── hooks/
│   ├── useComment.ts            # localStorage-backed notes field
│   └── useDateRangeCompare.ts   # P1/P2 date-picker state
├── components/
│   ├── RevenueComparisonDashboard.tsx   # public entry point
│   ├── layout/                  # GlobalHeader, MainNav
│   ├── charts/                  # Chart.js wrappers (Grouped/Single-series bar, Doughnut, Actual-vs-Plan line, 6-bar category chart)
│   ├── shared/                  # Badge, MetricCard, DataTable, CommentBox, VsStrip, layout primitives
│   └── tabs/                    # OverviewTab, CompareTab, CategoryTab + their sub-panels
└── styles/globals.css           # `--rcd-*` design tokens (Tailwind v4 @theme)
```

## Notes on fidelity to the original HTML

- Every section, chart, and table from the original single-file
  dashboard is reproduced: monthly trend + donut, station revenue,
  CAT-B breakdown, top customers, growth/loss cards, top movers,
  three solid/dashed "Actual vs Plan" line charts, the full
  Compare tab (station overview, per-station drill-downs), and the
  full Category tab (6-bar chart with variance labels, summary table,
  CAT-A/B/D/E drill-downs).
- Chart.js configs were consolidated into a handful of reusable,
  data-driven components (`GroupedBarChart`, `SingleSeriesBarChart`,
  `CategoryDoughnutChart`, `ActualPlanLineChart`, `CategorySixBarChart`)
  instead of one bespoke `new Chart(...)` call per canvas — this is
  what keeps the module maintainable, but the visual output matches
  the original per-chart configuration (colors, axis formatting,
  tooltips, the forecast-region shading plugin, the variance-%
  overlay plugin).
- The comment box now persists to `localStorage` instead of
  `sessionStorage` (survives tab refresh/navigation); swap
  `hooks/useComment.ts` for an API call if comments should be shared
  across users.
- `CatAAirlineRow`/`catAairlines` data from the source file was dead
  code (defined but never rendered) and was not ported.
