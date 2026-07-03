import type { CategoryTabData, CategoryDrillDown } from '../types';
import { palette } from '../lib/chart-theme';
import { UP, DOWN, FLAT, NA, NEW } from '../lib/badge-helpers';

const drillDowns: CategoryDrillDown[] = [
  {
    category: 'CAT-A',
    title: 'CAT-A — Transit check breakdown',
    p1Actual: 13_000_000, p1Budget: 11_500_000, p1Plan: 10_500_000, p1VsPlanPct: '+2%', p1VsBudgetPct: '+13%',
    p2Actual: 12_000_000, p2Budget: 9_500_000, p2Plan: 12_000_000, p2VsPlanPct: '+5%', p2VsBudgetPct: '+26%',
    rows: [
      { label: 'Transit check', p1Actual: 12_000_000, p1VsPlan: UP('+2%'), p1VsBudget: UP('+12%'), p2Actual: 10_500_000, p2VsPlan: UP('+3%'), p2VsBudget: UP('+8%'), popDelta: DOWN('-1%') },
      { label: 'Towing (Airline 8)', p1Actual: 150_000, p1VsPlan: UP('+92%'), p1VsBudget: UP('+50%'), p2Actual: 150_000, p2VsPlan: UP('+112%'), p2VsBudget: UP('+50%'), popDelta: UP('+15%') },
      { label: 'Additional charge', p1Actual: 200_000, p1VsPlan: DOWN('-10%'), p1VsBudget: UP('+33%'), p2Actual: 350_000, p2VsPlan: UP('+53%'), p2VsBudget: UP('+133%'), popDelta: UP('+71%') },
      { label: 'Total CAT-A', p1Actual: 11_500_000, p1VsPlan: UP('+2%'), p1VsBudget: UP('+12%'), p2Actual: 11_000_000, p2VsPlan: UP('+5%'), p2VsBudget: UP('+8%'), popDelta: UP('+0.4%'), isTotal: true },
    ],
    chart: { labels: ['Transit', 'Towing', 'Add.Charge'], p1: [11_384_189, 150_000, 200_000], p2: [11_268_878, 150_000, 350_000] },
  },
  {
    category: 'CAT-B',
    title: 'CAT-B — Lessor breakdown',
    p1Actual: 4_000_000, p1Budget: 0, p1Plan: 2_000_000, p1VsPlanPct: '+131%', p1VsBudgetPct: 'N/A',
    p2Actual: 6_000_000, p2Budget: 0, p2Plan: 1_500_000, p2VsPlanPct: '+297%', p2VsBudgetPct: 'N/A',
    rows: [
      { label: 'Lessor A total', p1Actual: 3_000_000, p1VsPlan: UP('+151%'), p1VsBudget: NA(), p2Actual: 6_000_000, p2VsPlan: UP('+448%'), p2VsBudget: NA(), popDelta: UP('+122%') },
      { label: '— Preservation', p1Actual: 400_000, p1VsPlan: UP('+8%'), p1VsBudget: NA(), p2Actual: 450_000, p2VsPlan: UP('+17%'), p2VsBudget: NA(), popDelta: UP('+15%') },
      { label: '— RTS', p1Actual: 0, p1VsPlan: FLAT('—'), p1VsBudget: NA(), p2Actual: 1_000_000, p2VsPlan: NEW(), p2VsBudget: NA(), popDelta: NEW() },
      { label: '— Record Management', p1Actual: 200_000, p1VsPlan: UP('+177%'), p1VsBudget: NA(), p2Actual: 250_000, p2VsPlan: UP('+219%'), p2VsBudget: NA(), popDelta: UP('+15%') },
      { label: '— Project Management', p1Actual: 500_000, p1VsPlan: UP('+150%'), p1VsBudget: NA(), p2Actual: 750_000, p2VsPlan: UP('+275%'), p2VsBudget: NA(), popDelta: UP('+50%') },
      { label: '— Engineering and Planning', p1Actual: 300_000, p1VsPlan: UP('+200%'), p1VsBudget: NA(), p2Actual: 550_000, p2VsPlan: UP('+450%'), p2VsBudget: NA(), popDelta: UP('+83%') },
      { label: '— Airport Coordination', p1Actual: 100_000, p1VsPlan: UP('+67%'), p1VsBudget: NA(), p2Actual: 200_000, p2VsPlan: UP('+233%'), p2VsBudget: NA(), popDelta: UP('+100%') },
      { label: '— Document Storage', p1Actual: 0, p1VsPlan: FLAT('—'), p1VsBudget: NA(), p2Actual: 50_000, p2VsPlan: NEW(), p2VsBudget: NA(), popDelta: NEW() },
      { label: '— Additional Charge (Reimbursement)', p1Actual: 1_500_000, p1VsPlan: UP('+3,000%'), p1VsBudget: NA(), p2Actual: 3_000_000, p2VsPlan: UP('+7,000%'), p2VsBudget: NA(), popDelta: UP('+131%') },
      { label: 'Lessor B', p1Actual: 950_000, p1VsPlan: UP('+49%'), p1VsBudget: NA(), p2Actual: 700_000, p2VsPlan: UP('+58%'), p2VsBudget: NA(), popDelta: DOWN('-20%') },
      { label: 'Lessor C', p1Actual: 250_000, p1VsPlan: NEW(), p1VsBudget: NA(), p2Actual: 0, p2VsPlan: FLAT('—'), p2VsBudget: NA(), popDelta: DOWN('-100%') },
      { label: 'Total CAT-B', p1Actual: 4_000_000, p1VsPlan: UP('+131%'), p1VsBudget: NA(), p2Actual: 6_000_000, p2VsPlan: UP('+297%'), p2VsBudget: NA(), popDelta: UP('+74%'), isTotal: true },
    ],
    chart: { labels: ['Lessor A', 'Lessor B', 'Lessor C'], p1: [2_500_000, 950_000, 250_000], p2: [6_000_000, 750_000, 0] },
  },
  {
    category: 'CAT-D',
    title: 'CAT-D — Auxiliary breakdown',
    p1Actual: 850_000, p1Budget: 350_000, p1Plan: 300_000, p1VsPlanPct: '+186%', p1VsBudgetPct: '+143%',
    p2Actual: 500_000, p2Budget: 350_000, p2Plan: 700_000, p2VsPlanPct: '-34%', p2VsBudgetPct: '+43%',
    rows: [
      { label: 'Warehouse', p1Actual: 250_000, p1VsPlan: UP('+20%'), p1VsBudget: FLAT('0%'), p2Actual: 250_000, p2VsPlan: DOWN('-17%'), p2VsBudget: FLAT('0%'), popDelta: FLAT('0%') },
      { label: 'Storage', p1Actual: 250_000, p1VsPlan: UP('+25%'), p1VsBudget: UP('+25%'), p2Actual: 200_000, p2VsPlan: DOWN('-56%'), p2VsBudget: FLAT('0%'), popDelta: DOWN('-18%') },
      { label: 'Reimbursement', p1Actual: 400_000, p1VsPlan: UP('+233%'), p1VsBudget: UP('+300%'), p2Actual: 50_000, p2VsPlan: DOWN('-86%'), p2VsBudget: FLAT('0%'), popDelta: DOWN('-86%') },
      { label: 'Consumables', p1Actual: 0, p1VsPlan: FLAT('—'), p1VsBudget: FLAT('—'), p2Actual: 3_500, p2VsPlan: NEW(), p2VsBudget: NEW(), popDelta: NEW() },
      { label: 'Total CAT-D', p1Actual: 850_000, p1VsPlan: UP('+186%'), p1VsBudget: UP('+143%'), p2Actual: 500_000, p2VsPlan: DOWN('-34%'), p2VsBudget: UP('+43%'), popDelta: DOWN('-43%'), isTotal: true },
    ],
  },
  {
    category: 'CAT-E',
    title: 'CAT-E — Non-Transit breakdown',
    p1Actual: 450_000, p1Budget: 450_000, p1Plan: 500_000, p1VsPlanPct: '-8%', p1VsBudgetPct: '+11%',
    p2Actual: 500_000, p2Budget: 450_000, p2Plan: 600_000, p2VsPlanPct: '-7%', p2VsBudgetPct: '+11%',
    rows: [
      { label: 'Towing', p1Actual: 200_000, p1VsPlan: UP('+2%'), p1VsBudget: UP('+33%'), p2Actual: 200_000, p2VsPlan: DOWN('-22%'), p2VsBudget: UP('+33%'), popDelta: DOWN('-14%') },
      { label: 'Marshaling', p1Actual: 250_000, p1VsPlan: DOWN('-15%'), p1VsBudget: UP('+25%'), p2Actual: 350_000, p2VsPlan: FLAT('0%'), p2VsBudget: UP('+75%'), popDelta: UP('+20%') },
      { label: 'Night Stop', p1Actual: 0, p1VsPlan: FLAT('—'), p1VsBudget: FLAT('—'), p2Actual: 10_000, p2VsPlan: NEW(), p2VsBudget: NEW(), popDelta: NEW() },
      { label: 'Total CAT-E', p1Actual: 450_000, p1VsPlan: DOWN('-8%'), p1VsBudget: UP('+11%'), p2Actual: 500_000, p2VsPlan: DOWN('-7%'), p2VsBudget: UP('+11%'), popDelta: UP('+7%'), isTotal: true },
    ],
  },
];

export const categoryData: CategoryTabData = {
  kpis: [
    { label: 'P1 — Total actual', value: '฿16.0M', valueColor: palette.p1, sub: '+21% vs P1 plan', subColor: palette.p1 },
    { label: 'P2 — Total actual', value: '฿22.0M', valueColor: palette.p2, sub: '+37% vs P2 plan', subTone: 'up' },
    { label: 'MoM change', value: '+฿2.5M', valueColor: 'var(--rcd-good)', sub: '+15.1% period-on-period', subTone: 'up' },
    { label: 'Strongest category', value: 'CAT-B', sub: 'P1 +131% · P2 +297% vs plan', subTone: 'up' },
  ],

  sixBarChart: {
    categories: ['CAT-A', 'CAT-B', 'CAT-C', 'CAT-D', 'CAT-E'],
    p1Budget: [10_413_747, 0, 0, 300_000, 400_000],
    p1Plan: [11_499_571, 1_500_000, 0, 300_000, 550_000],
    p1Actual: [11_715_984, 4_500_000, 0, 800_000, 500_000],
    p2Budget: [10_824_695, 0, 0, 300_000, 500_000],
    p2Plan: [11_195_536, 1_500_000, 0, 800_000, 500_000],
    p2Actual: [11_760_695, 7_500_000, 0, 450_000, 600_000],
  },

  vsPlanBudgetCards: [
    { category: 'CAT-A', p1VsPlan: UP('+2%'), p1VsBudget: UP('+12%'), p2VsPlan: UP('+5%'), p2VsBudget: UP('+8%') },
    { category: 'CAT-B', p1VsPlan: UP('+131%'), p1VsBudget: NA(), p2VsPlan: UP('+297%'), p2VsBudget: NA() },
    { category: 'CAT-C', p1VsPlan: FLAT('—'), p1VsBudget: FLAT('—'), p2VsPlan: FLAT('—'), p2VsBudget: FLAT('—') },
    { category: 'CAT-D', p1VsPlan: UP('+186%'), p1VsBudget: UP('+167%'), p2VsPlan: DOWN('-34%'), p2VsBudget: UP('+43%') },
    { category: 'CAT-E', p1VsPlan: DOWN('-8%'), p1VsBudget: UP('+11%'), p2VsPlan: DOWN('-7%'), p2VsBudget: UP('+11%') },
    { category: 'TOTAL', p1VsPlan: UP('+21%'), p1VsBudget: UP('+50%'), p2VsPlan: UP('+37%'), p2VsBudget: UP('+62%') },
  ],

  summary: [
    { category: 'CAT-A', p1Budget: 11_000_000, p1Plan: 11_500_000, p1Actual: 11_000_000, p1VsPlan: UP('+2%'), p1VsBudget: UP('+12%'), p2Budget: 11_500_000, p2Plan: 10_000_000, p2Actual: 11_500_000, p2VsPlan: UP('+5%'), p2VsBudget: UP('+8%'), popDelta: UP('+0.4%') },
    { category: 'CAT-B', p1Budget: 0, p1Plan: 1_500_000, p1Actual: 4_500_000, p1VsPlan: UP('+131%'), p1VsBudget: NA(), p2Budget: 0, p2Plan: 2_000_000, p2Actual: 6_500_000, p2VsPlan: UP('+297%'), p2VsBudget: NA(), popDelta: UP('+74%') },
    { category: 'CAT-C', p1Budget: 0, p1Plan: 0, p1Actual: 0, p1VsPlan: FLAT('—'), p1VsBudget: FLAT('—'), p2Budget: 0, p2Plan: 0, p2Actual: 0, p2VsPlan: FLAT('—'), p2VsBudget: FLAT('—'), popDelta: FLAT('—') },
    { category: 'CAT-D', p1Budget: 350_000, p1Plan: 300_000, p1Actual: 950_000, p1VsPlan: UP('+186%'), p1VsBudget: UP('+167%'), p2Budget: 350_000, p2Plan: 700_000, p2Actual: 500_000, p2VsPlan: DOWN('-34%'), p2VsBudget: UP('+43%'), popDelta: DOWN('-43%') },
    { category: 'CAT-E', p1Budget: 450_000, p1Plan: 500_000, p1Actual: 500_000, p1VsPlan: DOWN('-8%'), p1VsBudget: UP('+11%'), p2Budget: 450_000, p2Plan: 600_000, p2Actual: 500_000, p2VsPlan: DOWN('-7%'), p2VsBudget: UP('+11%'), popDelta: UP('+7%') },
    { category: 'CAT-A', displayLabel: 'Total', isTotal: true, p1Budget: 10_000_000, p1Plan: 13_500_000, p1Actual: 15_000_000, p1VsPlan: UP('+21%'), p1VsBudget: UP('+50%'), p2Budget: 13_000_000, p2Plan: 15_500_000, p2Actual: 21_000_000, p2VsPlan: UP('+37%'), p2VsBudget: UP('+62%'), popDelta: UP('+15.1%') },
  ],

  drillDowns,
};
