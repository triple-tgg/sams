'use client';

import { FlightTimelineWrapper } from '@/components/flight-timeline';
import ThemeButton from '@/components/partials/header/theme-switcher';

export default function FlightTimelinePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Timeline Component with embedded header */}
      {/* Timeline Component */}
      <FlightTimelineWrapper />
    </div>
  );
}