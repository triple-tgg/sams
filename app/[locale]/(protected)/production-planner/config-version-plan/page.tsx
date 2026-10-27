'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** Production Planner > Config Version Plan (placeholder until spec/API is ready). */
export default function ConfigVersionPlanPage() {
    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <SlidersHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-foreground">Config Version Plan</h1>
                        <p className="text-xs text-muted-foreground">Manage plan versions and configuration</p>
                    </div>
                </div>
                <div className="py-16 text-center text-sm text-muted-foreground">
                    Config Version Plan coming soon
                </div>
            </Card>
        </div>
    );
}
