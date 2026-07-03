import type { RevenueDashboardData } from '../types';
import { overviewData } from './overview-data';
import { compareData } from './compare-data';
import { categoryData } from './category-data';

/** Bundled sample dataset so the module renders standalone out of the
 *  box. For real usage, fetch a `RevenueDashboardData`-shaped payload
 *  from your API and pass it as the `data` prop on
 *  `<RevenueComparisonDashboard />` instead of relying on this import. */
export const mockRevenueDashboardData: RevenueDashboardData = {
  title: 'Revenue Comparison Dashboard 2026',
  currency: 'THB',
  periods: {
    p1: { start: '2026-04-01', end: '2026-04-30' },
    p2: { start: '2026-05-01', end: '2026-05-31' },
  },
  overview: overviewData,
  compare: compareData,
  category: categoryData,
};
