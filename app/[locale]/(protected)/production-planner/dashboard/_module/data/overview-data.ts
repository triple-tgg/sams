import type { OverviewData, CategoryVsSummary, ActualPlanSeries, TrendBadge } from '../types';
import { categoryColor, palette } from '../lib/chart-theme';
import { UP, DOWN, FLAT, NA, buildPlan } from '../lib/badge-helpers';

/* ────────────────────────────────────────────────────────────────
   OVERVIEW TAB
──────────────────────────────────────────────────────────────── */

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const catAMonthly = [9_500_000, 8_000_000, 9_000_000, 8_500_000, 6_500_000];
const catBMonthly = [3_500_000, 3_000_000, 4_500_000, 3_000_000, 4_500_000];
const catCMonthly = [60_000, 50_000, 80_000, 100_000, 70_000];
const catDMonthly = [900_000, 700_000, 650_000, 250_000, 200_000];
const catEMonthly = [1_040_000, 750_000, 270_000, 150_000, 130_000];

const catATotal = catAMonthly.reduce((a, b) => a + b, 0); // 41,500,000
const catBTotal = catBMonthly.reduce((a, b) => a + b, 0); // 18,500,000
// CAT-C/D/E YTD totals as carried by the source mock (independent of the
// monthly trend arrays above, which is how the original dashboard had it).
const catCTotal = 300_000;
const catDTotal = 2_500_000;
const catETotal = 4_000_000;
const grandTotal = catATotal + catBTotal + (catCMonthly.reduce((a, b) => a + b, 0) + catDMonthly.reduce((a, b) => a + b, 0) + catEMonthly.reduce((a, b) => a + b, 0));

function pctOf(value: number) {
  return Number(((value / grandTotal) * 100).toFixed(1));
}

const overviewMetrics: OverviewData['metrics'] = [
  { category: 'CAT-A', label: 'CAT-A Transit', color: categoryColor['CAT-A'], ytdTotal: catATotal, pctOfTotal: pctOf(catATotal) },
  { category: 'CAT-B', label: 'CAT-B Maintenance', color: categoryColor['CAT-B'], ytdTotal: catBTotal, pctOfTotal: pctOf(catBTotal) },
  { category: 'CAT-D', label: 'CAT-D Warehouse', color: categoryColor['CAT-D'], ytdTotal: catDTotal, pctOfTotal: pctOf(catDTotal) },
  { category: 'CAT-E', label: 'CAT-E Ground', color: categoryColor['CAT-E'], ytdTotal: catETotal, pctOfTotal: pctOf(catETotal) },
];

const trendVsSummary: CategoryVsSummary[] = [
  { category: 'CAT-A', color: categoryColor['CAT-A'], pills: [{ label: 'vs Bud', value: UP('+12%') }, { label: 'vs Plan', value: UP('+2%') }] },
  { category: 'CAT-B', color: categoryColor['CAT-B'], pills: [{ label: 'vs Bud', value: NA() }, { label: 'vs Plan', value: UP('+131%') }] },
  { category: 'CAT-C', color: categoryColor['CAT-C'], pills: [{ label: 'vs Bud', value: FLAT('—') }, { label: 'vs Plan', value: FLAT('—') }] },
  { category: 'CAT-D', color: categoryColor['CAT-D'], pills: [{ label: 'vs Bud', value: UP('+167%') }, { label: 'vs Plan', value: UP('+186%') }] },
  { category: 'CAT-E', color: categoryColor['CAT-E'], pills: [{ label: 'vs Bud', value: UP('+11%') }, { label: 'vs Plan', value: DOWN('-8%') }] },
  { category: 'TOTAL', pills: [{ label: 'vs Bud', value: UP('+50%') }, { label: 'vs Plan', value: UP('+21%') }] },
];

const categoryDonutVsSummary: CategoryVsSummary[] = [
  { category: 'CAT-A', color: categoryColor['CAT-A'], pills: [{ label: 'vs Bud', value: UP('+12%') }, { label: 'vs Plan', value: UP('+2%') }] },
  { category: 'CAT-B', color: categoryColor['CAT-B'], pills: [{ label: 'vs Bud', value: NA() }, { label: 'vs Plan', value: UP('+131%') }] },
  { category: 'CAT-D', color: categoryColor['CAT-D'], pills: [{ label: 'vs Bud', value: UP('+167%') }, { label: 'vs Plan', value: UP('+186%') }] },
  { category: 'CAT-E', color: categoryColor['CAT-E'], pills: [{ label: 'vs Bud', value: UP('+11%') }, { label: 'vs Plan', value: DOWN('-8%') }] },
  { category: 'TOTAL', pills: [{ label: 'vs Bud', value: UP('+50%') }, { label: 'vs Plan', value: UP('+21%') }] },
];

const stationRevenueValues: Record<string, number> = {
  BKK: 37_550_000, HKT: 8_570_000, CNX: 2_455_000, DMK: 2_150_000, HDY: 2_000_000, CEI: 1_000_000, KBV: 650_000,
};
const stationVs: Record<string, { vsBud: TrendBadge; vsPlan: TrendBadge }> = {
  BKK: { vsBud: UP('+8%'), vsPlan: UP('+5%') },
  HKT: { vsBud: UP('+3%'), vsPlan: DOWN('-7%') },
  CNX: { vsBud: UP('+4%'), vsPlan: UP('+6%') },
  DMK: { vsBud: DOWN('-18%'), vsPlan: DOWN('-23%') },
  HDY: { vsBud: UP('+5%'), vsPlan: UP('+2%') },
  CEI: { vsBud: DOWN('-4%'), vsPlan: DOWN('-10%') },
  KBV: { vsBud: UP('+6%'), vsPlan: UP('+4%') },
};
const stationRevenue: OverviewData['stationRevenue'] = palette.station.map((color, i) => {
  const station = (['BKK', 'HKT', 'CNX', 'DMK', 'HDY', 'CEI', 'KBV'] as const)[i];
  return { station, color, revenue: stationRevenueValues[station], vsBudget: stationVs[station].vsBud, vsPlan: stationVs[station].vsPlan };
});

const categoryBBreakdown: OverviewData['categoryBBreakdown'] = [
  { label: 'Additional Charge (Reimb.)', revenue: 7_000_000 },
  { label: 'RTS', revenue: 2_500_000 },
  { label: 'Project Management', revenue: 2_000_000 },
  { label: 'Preservation', revenue: 2_500_000 },
  { label: 'Record Management', revenue: 750_000 },
  { label: 'Eng & Planning', revenue: 550_000 },
  { label: 'Airport Coordination', revenue: 300_000 },
  { label: 'Document Storage', revenue: 50_000 },
];

const topCustomers: OverviewData['topCustomers'] = [
  { name: 'Lessor A', category: 'CAT-B', stations: 'DMK', ytdRevenue: 16_581_747 },
  { name: 'Airline 2', category: 'CAT-A', stations: 'BKK, HKT', ytdRevenue: 10_500_000 },
  { name: 'Airline 5', category: 'CAT-A', stations: 'BKK,HDY,CEI', ytdRevenue: 7_500_000 },
  { name: 'Airline 7', category: 'CAT-A', stations: 'BKK,DMK', ytdRevenue: 7_500_000 },
  { name: 'Airline 3', category: 'CAT-A', stations: 'BKK', ytdRevenue: 5_000_000 },
  { name: 'Airline 4', category: 'CAT-A', stations: 'BKK', ytdRevenue: 4_000_000 },
  { name: 'Airline 16', category: 'CAT-A', stations: 'HKT', ytdRevenue: 2_500_000 },
  { name: 'Airline 6', category: 'CAT-A', stations: 'BKK,HKT', ytdRevenue: 2_500_000 },
  { name: 'Airline 8', category: 'CAT-A', stations: 'BKK', ytdRevenue: 2_500_000 },
  { name: 'Airline 17', category: 'CAT-A', stations: 'BKK,HKT', ytdRevenue: 2_000_000 },
];

const growthLossByStation: OverviewData['growthLossByStation'] = [
  {
    station: 'BKK',
    gains: [
      { customer: 'Airline 13', badge: { label: '+680%', tone: 'up' }, detail: 'Jan ฿10,000 → May ฿80,000', delta: 70_000 },
      { customer: 'Airline 2', detail: 'Jan ฿2,000,000 → May ฿1,000,000', delta: -450_000 },
    ],
    losses: [
      { customer: 'Airline 24', badge: { label: 'dropped', tone: 'gone' }, detail: 'Active Jan–Feb only', delta: -80_000 },
      { customer: 'Airline 6', detail: 'Jan ฿450,000 → May ฿150,000', delta: -400_000 },
    ],
  },
  {
    station: 'HKT',
    gains: [
      { customer: 'Airline 6', badge: { label: 'new Apr', tone: 'new' }, detail: 'Started Apr, May ฿65,000', delta: 65_000 },
      { customer: 'Airline 2', detail: 'Jan ฿200,000 → May ฿250,000', delta: 100_000 },
    ],
    losses: [
      { customer: 'Airline 14', detail: 'Jan ฿150,000 → May ฿75,000', delta: -85_000 },
      { customer: 'Airline 16 (NB)', detail: 'Jan ฿200,000 → May ฿40,000', delta: -150_000 },
    ],
  },
  {
    station: 'CNX',
    gains: [
      { customer: 'Airline 20', badge: { label: 'new Apr', tone: 'new' }, detail: 'Apr ฿8,500 → May ฿45,000', delta: 45_000 },
      { customer: 'Airline 18', detail: 'Jan ฿200,000 → May ฿150,000', delta: -80_000 },
    ],
    losses: [
      { customer: 'Airline 19', detail: 'Jan ฿400,000 → May ฿100,000', delta: -250_000 },
      { customer: 'Airline 25', badge: { label: 'dropped', tone: 'gone' }, detail: 'Active Jan–Feb only', delta: -200_000 },
    ],
  },
  {
    station: 'DMK',
    gains: [
      { customer: 'Airline 22', badge: { label: 'new Mar', tone: 'new' }, detail: 'Mar ฿100,000 → May ฿100,000', delta: 350_000 },
      { customer: 'Airline 7', detail: 'Jan ฿350,000 → May ฿200,000', delta: -250_000 },
    ],
    losses: [{ customer: 'Airline 1', badge: { label: 'dropped', tone: 'gone' }, detail: 'Active Jan–Mar only', delta: -350_000 }],
  },
  {
    station: 'HDY',
    gains: [{ customer: 'Airline 5', detail: 'Jan ฿300,000 → May ฿350,000', delta: 10_000 }],
    losses: [],
    noOtherCustomers: true,
  },
  {
    station: 'CEI & KBV',
    gains: [{ customer: 'Airline 23 (KBV)', detail: 'Jan ฿100,000 → May ฿90,000', delta: -40_000 }],
    losses: [{ customer: 'Airline 5 (CEI)', detail: 'Jan ฿250,000 → May ฿100,000', delta: -150_000 }],
  },
];

const topMovers: OverviewData['topMovers'] = [
  { label: 'Airline 13 · BKK', delta: 75_000 },
  { label: 'Airline 2 · HKT', delta: 100_000 },
  { label: 'Airline 5 · HDY', delta: 10_000 },
  { label: 'Airline 20 · CNX', delta: 45_000 },
  { label: 'Airline 22 · DMK', delta: 90_000 },
  { label: 'Airline 23 · KBV', delta: -35_000 },
  { label: 'Airline 5 · CEI', delta: -150_000 },
  { label: 'Airline 18 · CNX', delta: -80_000 },
  { label: 'Airline 19 · CNX', delta: -250_000 },
  { label: 'Airline 16 · HKT', delta: -150_000 },
  { label: 'Airline 1 · DMK', delta: -300_000 },
];

/* Customer-per-station monthly lines (solid Actual Jan-May, dashed Plan
 * Jan-Dec). `fct` = Jun-Dec forecast; the Jan-May "plan" segment is
 * derived via `buildPlan` to mirror the source mockup's approximation. */
const rawStationCustomerSeries: Record<string, { label: string; act: (number | null)[]; fct: number[] }[]> = {
  BKK: [
    { label: 'Airline 1', act: [600_000, 550_000, 350_000, 550_000, 400_000], fct: [420_000, 440_000, 450_000, 460_000, 470_000, 465_000, 480_000] },
    { label: 'Airline 2', act: [1_500_000, 1_500_000, 1_500_000, 2_000_000, 1_500_000], fct: [1_550_000, 1_600_000, 1_580_000, 1_620_000, 1_650_000, 1_640_000, 1_680_000] },
    { label: 'Airline 3', act: [1_000_000, 750_000, 900_000, 1_000_000, 600_000], fct: [850_000, 900_000, 920_000, 930_000, 950_000, 940_000, 960_000] },
    { label: 'Airline 5', act: [1_000_000, 650_000, 1_000_000, 750_000, 550_000], fct: [750_000, 800_000, 820_000, 840_000, 860_000, 850_000, 880_000] },
    { label: 'Airline 7(NB)', act: [350_000, 250_000, 250_000, 350_000, 300_000], fct: [310_000, 320_000, 330_000, 335_000, 340_000, 338_000, 345_000] },
    { label: 'Airline 7(WB)', act: [1_000_000, 750_000, 750_000, 800_000, 450_000], fct: [600_000, 650_000, 680_000, 700_000, 720_000, 715_000, 730_000] },
    { label: 'Airline 8', act: [350_000, 350_000, 400_000, 400_000, 300_000], fct: [380_000, 390_000, 400_000, 410_000, 415_000, 412_000, 420_000] },
  ],
  HKT: [
    { label: 'Airline 2', act: [150_000, 350_000, 450_000, 450_000, 250_000], fct: [350_000, 380_000, 400_000, 420_000, 430_000, 425_000, 440_000] },
    { label: 'Airline 15', act: [400_000, 350_000, 400_000, 400_000, 300_000], fct: [380_000, 390_000, 400_000, 405_000, 410_000, 408_000, 415_000] },
    { label: 'Airline 16(WB)', act: [550_000, 450_000, 550_000, 500_000, 300_000], fct: [420_000, 440_000, 460_000, 470_000, 480_000, 478_000, 490_000] },
    { label: 'Airline 17', act: [350_000, 250_000, 250_000, 200_000, 150_000], fct: [200_000, 210_000, 220_000, 225_000, 230_000, 228_000, 235_000] },
  ],
  CNX: [
    { label: 'Airline 18', act: [200_000, 200_000, 200_000, 200_000, 150_000], fct: [180_000, 185_000, 190_000, 192_000, 195_000, 193_000, 198_000] },
    { label: 'Airline 19', act: [350_000, 300_000, 400_000, 150_000, 100_000], fct: [130_000, 140_000, 150_000, 155_000, 160_000, 158_000, 165_000] },
    { label: 'Airline 20', act: [null, null, null, 8_500, 50_000], fct: [65_000, 75_000, 80_000, 85_000, 90_000, 88_000, 95_000] },
  ],
  DMK: [
    { label: 'Airline 7', act: [400_000, 400_000, 350_000, 300_000, 200_000], fct: [250_000, 270_000, 280_000, 285_000, 290_000, 288_000, 295_000] },
    { label: 'Airline 22', act: [null, null, 100_000, 150_000, 100_000], fct: [120_000, 130_000, 135_000, 140_000, 142_000, 140_000, 145_000] },
  ],
  HDY: [{ label: 'Airline 5', act: [300_000, 300_000, 400_000, 400_000, 300_000], fct: [320_000, 330_000, 340_000, 345_000, 350_000, 348_000, 355_000] }],
  CEI: [{ label: 'Airline 5', act: [250_000, 200_000, 200_000, 200_000, 100_000], fct: [130_000, 140_000, 145_000, 150_000, 152_000, 150_000, 155_000] }],
  KBV: [{ label: 'Airline 23', act: [150_000, 100_000, 100_000, 100_000, 80_000], fct: [90_000, 95_000, 98_000, 100_000, 102_000, 101_000, 104_000] }],
};

const customerLinesByStation: OverviewData['customerLinesByStation'] = (Object.keys(rawStationCustomerSeries) as (keyof typeof rawStationCustomerSeries)[]).map(
  (station) => ({
    station: station as OverviewData['customerLinesByStation'][number]['station'],
    series: rawStationCustomerSeries[station].map((s, i): ActualPlanSeries => ({
      id: `${station}-${s.label}`,
      label: s.label,
      color: palette.seriesCycle[i % palette.seriesCycle.length],
      actual: s.act,
      plan: buildPlan(s.act, s.fct),
    })),
  })
);

const stationMonthlyRaw: Record<string, { act: number[]; fct: number[] }> = {
  BKK: { act: [8_500_000, 7_800_000, 9_200_000, 8_500_000, 7_200_000], fct: [8_800_000, 9_000_000, 9_100_000, 9_200_000, 9_300_000, 9_250_000, 9_400_000] },
  HKT: { act: [1_450_000, 1_300_000, 1_600_000, 1_550_000, 1_200_000], fct: [1_350_000, 1_400_000, 1_450_000, 1_480_000, 1_500_000, 1_490_000, 1_520_000] },
  CNX: { act: [750_000, 800_000, 950_000, 358_500, 300_000], fct: [320_000, 350_000, 370_000, 380_000, 390_000, 385_000, 400_000] },
  DMK: { act: [750_000, 700_000, 800_000, 450_000, 300_000], fct: [330_000, 350_000, 360_000, 365_000, 372_000, 368_000, 378_000] },
  HDY: { act: [300_000, 300_000, 400_000, 400_000, 300_000], fct: [320_000, 330_000, 340_000, 345_000, 350_000, 348_000, 355_000] },
  CEI: { act: [250_000, 200_000, 200_000, 200_000, 100_000], fct: [130_000, 140_000, 145_000, 150_000, 152_000, 150_000, 155_000] },
  KBV: { act: [150_000, 100_000, 100_000, 100_000, 80_000], fct: [90_000, 95_000, 98_000, 100_000, 102_000, 101_000, 104_000] },
};
const stationColorMap: Record<string, string> = {
  BKK: categoryColor['CAT-A'], HKT: categoryColor['CAT-B'], CNX: categoryColor['CAT-D'],
  DMK: categoryColor['CAT-C'], HDY: categoryColor['CAT-E'], CEI: palette.station[5], KBV: palette.station[6],
};
const stationMonthly: OverviewData['stationMonthly'] = (Object.keys(stationMonthlyRaw) as (keyof typeof stationMonthlyRaw)[]).map((station) => ({
  station: station as OverviewData['stationMonthly'][number]['station'],
  color: stationColorMap[station],
  actual: stationMonthlyRaw[station].act,
  plan: buildPlan(stationMonthlyRaw[station].act, stationMonthlyRaw[station].fct),
}));

const categoryMonthlyRaw: Record<string, { act: number[]; fct: number[] }> = {
  'CAT-A': { act: catAMonthly, fct: [8_800_000, 9_000_000, 9_100_000, 9_200_000, 9_300_000, 9_250_000, 9_400_000] },
  'CAT-B': { act: catBMonthly, fct: [4_800_000, 5_000_000, 5_200_000, 5_300_000, 5_400_000, 5_350_000, 5_500_000] },
  'CAT-C': { act: catCMonthly, fct: [80_000, 85_000, 90_000, 92_000, 95_000, 93_000, 98_000] },
  'CAT-D': { act: catDMonthly, fct: [280_000, 310_000, 330_000, 340_000, 350_000, 345_000, 360_000] },
  'CAT-E': { act: catEMonthly, fct: [160_000, 180_000, 200_000, 210_000, 220_000, 215_000, 230_000] },
};
const categoryMonthly: OverviewData['categoryMonthly'] = (Object.keys(categoryMonthlyRaw) as (keyof typeof categoryMonthlyRaw)[]).map((category) => ({
  category: category as OverviewData['categoryMonthly'][number]['category'],
  color: categoryColor[category],
  actual: categoryMonthlyRaw[category].act,
  plan: buildPlan(categoryMonthlyRaw[category].act, categoryMonthlyRaw[category].fct),
}));

export const overviewData: OverviewData = {
  periodLabel: '1 Jan – 21 May 2026',
  currency: 'THB',
  months,
  allMonths,
  metrics: overviewMetrics,
  categoryDonut: [
    { category: 'CAT-A', color: categoryColor['CAT-A'], value: catATotal },
    { category: 'CAT-B', color: categoryColor['CAT-B'], value: catBTotal },
    { category: 'CAT-D', color: categoryColor['CAT-D'], value: catDTotal },
    { category: 'CAT-E', color: categoryColor['CAT-E'], value: catETotal },
    { category: 'CAT-C', color: categoryColor['CAT-C'], value: catCTotal },
  ],
  grandTotal,
  trendByCategory: [
    { category: 'CAT-A', color: categoryColor['CAT-A'], monthly: catAMonthly.map((value, i) => ({ month: months[i], value })) },
    { category: 'CAT-B', color: categoryColor['CAT-B'], monthly: catBMonthly.map((value, i) => ({ month: months[i], value })) },
    { category: 'CAT-C', color: categoryColor['CAT-C'], monthly: catCMonthly.map((value, i) => ({ month: months[i], value })) },
    { category: 'CAT-D', color: categoryColor['CAT-D'], monthly: catDMonthly.map((value, i) => ({ month: months[i], value })) },
    { category: 'CAT-E', color: categoryColor['CAT-E'], monthly: catEMonthly.map((value, i) => ({ month: months[i], value })) },
  ],
  trendVsSummary,
  categoryDonutVsSummary,
  stationRevenue,
  categoryBBreakdown,
  topCustomers,
  growthLossByStation,
  topMovers,
  customerLinesByStation,
  stationMonthly,
  categoryMonthly,
};
