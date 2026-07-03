'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, BarChart3, TrendingUp } from 'lucide-react';
import type { RevenueComparisonDashboardProps } from '../types';
import { mockRevenueDashboardData } from '../data/mock-data';
import { GlobalHeader } from './layout/GlobalHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { CompareTab } from './tabs/CompareTab';
import { CategoryTab } from './tabs/CategoryTab';

type MainTabId = 'overview' | 'compare' | 'category';

/**
 * Revenue Comparison Dashboard — drop-in Next.js module.
 */
export function RevenueComparisonDashboard({ data, onPeriodsChange, className = '' }: RevenueComparisonDashboardProps) {
  const dashboardData = data ?? mockRevenueDashboardData;
  const [activeTab, setActiveTab] = useState<MainTabId>('overview');

  function handleDownload() {
    if (typeof window === 'undefined') return;
    const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboardData.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`rcd-root ${className}`}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{dashboardData.title}</CardTitle>
          <CardDescription>
            Revenue comparison analysis across stations, categories, and customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Period Selector + Export */}
          <GlobalHeader
            title={dashboardData.title}
            periods={dashboardData.periods}
            onPeriodsChange={onPeriodsChange}
            onDownload={handleDownload}
          />

          {/* Tabs — bottom-border style matching Invoice page */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as MainTabId)}
          >
            <TabsList className="bg-transparent border-b border-default-200 rounded-none p-0 gap-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                <ClipboardList className="h-4 w-4 mr-1.5" /> Revenue Overview
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" /> Production & Revenue
              </TabsTrigger>
              <TabsTrigger
                value="category"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 pb-3"
              >
                <TrendingUp className="h-4 w-4 mr-1.5" /> Revenue by Category
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tab Content */}
          <div className="mt-5">
            {activeTab === 'overview' && <OverviewTab data={dashboardData.overview} />}
            {activeTab === 'compare' && <CompareTab data={dashboardData.compare} />}
            {activeTab === 'category' && <CategoryTab data={dashboardData.category} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
