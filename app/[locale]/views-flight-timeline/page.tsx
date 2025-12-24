'use client';

import { FlightTimelineWrapper } from '@/components/flight-timeline';
import ThemeButton from '@/components/partials/header/theme-switcher';

export default function FlightTimelinePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Flight Timeline</h1>
          <p className="text-slate-400">
            View incoming and outgoing flights on an interactive timeline
          </p>
        </div>
        {/* <ThemeButton /> */}
      </div>
      {/* Timeline Component */}
      <FlightTimelineWrapper />
    </div>
  );
}