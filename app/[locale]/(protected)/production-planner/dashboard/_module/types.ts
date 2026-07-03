/**
 * Revenue Comparison Dashboard — shared types
 * -------------------------------------------
 * These types define the full data contract for the module. Any real
 * backend/API integration only needs to produce objects that satisfy
 * `RevenueDashboardData` (see data/mock-data.ts for a worked example).
 */

export type Category = 'CAT-A' | 'CAT-B' | 'CAT-C' | 'CAT-D' | 'CAT-E';

export type StationCode = 'BKK' | 'HKT' | 'CNX' | 'DMK' | 'HDY' | 'CEI' | 'KBV';

/** Generic up/down/flat trend used for badges (Δ, vs Plan, vs Budget, ...). */
export type TrendTone = 'up' | 'down' | 'flat' | 'na' | 'new' | 'amber';

export interface TrendBadge {
  /** Pre-formatted display text, e.g. "+12%", "-6", "New", "—", "N/A" */
  label: string;
  tone: TrendTone;
}

export interface DateRange {
  start: string; // ISO date, e.g. "2026-04-01"
  end: string; // ISO date
}

export interface ComparePeriods {
  p1: DateRange;
  p2: DateRange;
}

/* ────────────────────────────────────────────────────────────────
   Overview tab
──────────────────────────────────────────────────────────────── */

export interface CategoryMetric {
  category: Category;
  label: string;
  color: string;
  ytdTotal: number;
  pctOfTotal: number;
}

export interface MonthlyCategoryPoint {
  month: string; // "Jan" .. "Dec"
  value: number;
}

export interface CategoryTrendSeries {
  category: Category;
  color: string;
  monthly: MonthlyCategoryPoint[]; // actual months only (e.g. Jan-May)
}

export interface VsComparisonPill {
  label: string; // "vs Bud" | "vs Plan"
  value: TrendBadge;
}

export interface CategoryVsSummary {
  /** A Category code, a StationCode, or "TOTAL" — VsStrip is reused for both category and station vs-strips. */
  category: string;
  color?: string;
  pills: VsComparisonPill[];
}

export interface StationRevenue {
  station: StationCode;
  color: string;
  revenue: number;
  vsBudget: TrendBadge;
  vsPlan: TrendBadge;
}

export interface CategoryBServiceItem {
  label: string;
  revenue: number;
}

export interface TopCustomerRow {
  name: string;
  category: Category;
  stations: string; // display string, e.g. "BKK, HKT"
  ytdRevenue: number;
}

export interface GrowthLossItem {
  customer: string;
  badge?: { label: string; tone: 'new' | 'gone' | 'up' };
  detail: string; // "Jan ฿10,000 → May ฿80,000"
  delta: number; // signed THB
}

export interface StationGrowthLoss {
  station: string; // may be a combined label e.g. "CEI & KBV"
  gains: GrowthLossItem[];
  losses: GrowthLossItem[];
  /** Set when a station has no offsetting customers to show in `losses`. */
  noOtherCustomers?: boolean;
}

export interface TopMoverItem {
  label: string; // "Airline 13 · BKK"
  delta: number; // signed THB
}

/** One line series shown with a solid "Actual" segment and a dashed
 *  "Plan" segment spanning the full year. */
export interface ActualPlanSeries {
  id: string;
  label: string;
  color: string;
  /** Actual monthly values, e.g. Jan-May. Use null for missing months. */
  actual: (number | null)[];
  /** Plan/forecast values spanning the *full* chart timeline (e.g. Jan-Dec). */
  plan: (number | null)[];
}

export interface StationCustomerLines {
  station: StationCode;
  series: ActualPlanSeries[];
}

export interface OverviewData {
  periodLabel: string; // "1 Jan – 21 May 2026"
  currency: string; // "THB"
  months: string[]; // actual months present, e.g. ["Jan",...,"May"]
  allMonths: string[]; // full year timeline used by line charts
  metrics: CategoryMetric[];
  /** All 5 categories (including CAT-C, which has no metric card) — feeds the donut chart. */
  categoryDonut: { category: Category; color: string; value: number }[];
  grandTotal: number;
  trendByCategory: CategoryTrendSeries[];
  trendVsSummary: CategoryVsSummary[];
  categoryDonutVsSummary: CategoryVsSummary[];
  stationRevenue: StationRevenue[];
  categoryBBreakdown: CategoryBServiceItem[];
  topCustomers: TopCustomerRow[];
  growthLossByStation: StationGrowthLoss[];
  topMovers: TopMoverItem[];
  customerLinesByStation: StationCustomerLines[];
  stationMonthly: { station: StationCode; color: string; actual: number[]; plan: (number | null)[] }[];
  categoryMonthly: { category: Category; color: string; actual: number[]; plan: (number | null)[] }[];
}

/* ────────────────────────────────────────────────────────────────
   Compare tab (Production & Revenue, P1 vs P2)
──────────────────────────────────────────────────────────────── */

export interface CompareKpi {
  label: string;
  value: string;
  valueColor?: string;
  sub: string;
  subTone?: TrendTone;
  subColor?: string;
}

export interface StationProdRevPoint {
  station: StationCode;
  p1: number;
  p2: number;
}

export interface StationChangeCard {
  station: StationCode;
  pctChange: number;
  absChange: number; // THB
}

export interface StationSummaryRow {
  station: StationCode;
  /** Overrides the displayed row label — used for the trailing "Total" row. */
  displayLabel?: string;
  isTotal?: boolean;
  p1Prod: number;
  p2Prod: number;
  prodDelta: TrendBadge;
  p1Rev: number;
  p2Rev: number;
  revDelta: TrendBadge;
  p1VsPlan: TrendBadge;
  p1VsBudget: TrendBadge;
  p2VsPlan: TrendBadge;
  p2VsBudget: TrendBadge;
}

/** Generic comparison table row used for customer-level detail tables. */
export interface CustomerCompareRow {
  customer: string;
  p1Prod: number;
  p2Prod: number;
  prodDelta: TrendBadge;
  p1Rev: number;
  p2Rev: number;
  revDeltaPct: TrendBadge;
  p1VsPlan: TrendBadge;
  p1VsBudget: TrendBadge;
  p2VsPlan: TrendBadge;
  p2VsBudget: TrendBadge;
  isTotal?: boolean;
}

/** Budget / Plan / P1 / P2 grouped bar dataset for one station's
 *  production or revenue breakdown by customer. */
export interface BudgetPlanActualSeries {
  labels: string[]; // customer names
  budget: number[];
  plan: number[];
  p1: number[];
  p2: number[];
}

export interface StationDetail {
  station: StationCode;
  label: string; // display label, may combine stations e.g. "CEI & KBV"
  chartHeight: number;
  production: BudgetPlanActualSeries;
  revenue: BudgetPlanActualSeries;
  customers: CustomerCompareRow[]; // includes a trailing isTotal row
}

export interface CategorySubBreakdownRow {
  label: string;
  p1Actual: number;
  p1VsPlan: TrendBadge;
  p1VsBudget: TrendBadge;
  p2Actual: number;
  p2VsPlan: TrendBadge;
  p2VsBudget: TrendBadge;
  popDelta: TrendBadge;
  isTotal?: boolean;
}

export interface CategoryDrillDown {
  category: Category;
  title: string;
  p1Actual: number;
  p1Budget: number;
  p1Plan: number;
  p1VsPlanPct: string;
  p1VsBudgetPct: string;
  p2Actual: number;
  p2Budget: number;
  p2Plan: number;
  p2VsPlanPct: string;
  p2VsBudgetPct: string;
  rows: CategorySubBreakdownRow[];
  chart?: { labels: string[]; p1: number[]; p2: number[] };
}

export interface CompareData {
  kpis: CompareKpi[];
  productionByStation: StationProdRevPoint[];
  revenueByStation: StationProdRevPoint[];
  stationChange: StationChangeCard[];
  stationSummary: StationSummaryRow[];
  stationDetails: StationDetail[];
}

/* ────────────────────────────────────────────────────────────────
   Category tab (Revenue by Category)
──────────────────────────────────────────────────────────────── */

export interface CategorySixBarSeries {
  categories: Category[];
  p1Budget: number[];
  p1Plan: number[];
  p1Actual: number[];
  p2Budget: number[];
  p2Plan: number[];
  p2Actual: number[];
}

export interface CategoryVsPlanBudgetCard {
  category: Category | 'TOTAL';
  p1VsPlan: TrendBadge;
  p1VsBudget: TrendBadge;
  p2VsPlan: TrendBadge;
  p2VsBudget: TrendBadge;
}

export interface CategorySummaryRow {
  category: Category;
  displayLabel?: string;
  p1Budget: number;
  p1Plan: number;
  p1Actual: number;
  p1VsPlan: TrendBadge;
  p1VsBudget: TrendBadge;
  p2Budget: number;
  p2Plan: number;
  p2Actual: number;
  p2VsPlan: TrendBadge;
  p2VsBudget: TrendBadge;
  popDelta: TrendBadge;
  isTotal?: boolean;
}

export interface CategoryTabData {
  kpis: CompareKpi[];
  sixBarChart: CategorySixBarSeries;
  vsPlanBudgetCards: CategoryVsPlanBudgetCard[];
  summary: CategorySummaryRow[];
  drillDowns: CategoryDrillDown[];
}

/* ────────────────────────────────────────────────────────────────
   Top-level module data contract
──────────────────────────────────────────────────────────────── */

export interface RevenueDashboardData {
  title: string;
  currency: string;
  periods: ComparePeriods;
  overview: OverviewData;
  compare: CompareData;
  category: CategoryTabData;
}

export interface RevenueComparisonDashboardProps {
  /** Full dataset. If omitted, the module's bundled mock data is used
   *  so the module renders standalone — swap this for API data by
   *  fetching a `RevenueDashboardData`-shaped payload server-side. */
  data?: RevenueDashboardData;
  /** Called when the person applies a new P1/P2 date range. Wire this
   *  to your data-fetching layer to re-query real data for the
   *  selected periods. Purely cosmetic if left unset. */
  onPeriodsChange?: (periods: ComparePeriods) => void;
  className?: string;
}
