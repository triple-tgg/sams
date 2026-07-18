"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plane } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useCombinations, useAuthGroups, useSystemConfigs, useEngines,
} from "@/lib/api/master/aircraft-engine/aircraftEngine.hooks";
import { computeDataQuality } from "@/lib/api/master/aircraft-engine/aircraftEngine.validation";
import { DataQualityBanner } from "./components/DataQualityBanner";
import { CombinationsTab } from "./components/CombinationsTab";
import { AuthGroupsTab } from "./components/AuthGroupsTab";
import { SystemConfigTab } from "./components/SystemConfigTab";
import { EngineMasterTab } from "./components/EngineMasterTab";
import { Card, CardContent } from "@/components/ui/card";

const TabCount = ({ n }: { n: number }) => (
  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5  text-[10px] text-slate-600 data-[active]:bg-slate-800">{n}</span>
);

export default function AircraftEnginePage() {
  const { data: combinations = [] } = useCombinations();
  const { data: authGroups = [] } = useAuthGroups();
  const { data: systemConfigs = [] } = useSystemConfigs();
  const { data: engines = [] } = useEngines();
  // Honor deep links from the shared reference panel (CR-6), e.g. ?tab=group.
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(
    ["combo", "group", "sys", "engine"].includes(requestedTab ?? "") ? (requestedTab as string) : "combo",
  );

  const findings = useMemo(
    () => computeDataQuality({ engines, combinations, authGroups, systemConfigs }),
    [engines, combinations, authGroups, systemConfigs],
  );

  return (
    <div>
      <Card>
        <CardContent className="space-y-5 pt-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="mt-0.5 flex items-center gap-2.5 text-2xl font-bold text-slate-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <Plane className="h-5 w-5 text-blue-600" />
                </span>
                Aircraft-Engine master data
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Master data related to Authorization, Training Needs Matrix and Authorization
                Certificate — all modules refer to this single dataset
              </p>
            </div>
          </div>

          {/* Data-quality banner */}
          <DataQualityBanner findings={findings} />

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 border-b border-border rounded-none p-0 gap-0 w-full justify-start h-auto flex-wrap bg-transparent">
              <TabsTrigger
                value="combo"
                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
              >
                Aircraft-Engine combinations <TabCount n={combinations.length} />
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
              >
                Authorization type groups <TabCount n={authGroups.length} />
              </TabsTrigger>
              <TabsTrigger
                value="sys"
                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
              >
                Aircraft system config <TabCount n={systemConfigs.length} />
              </TabsTrigger>
              <TabsTrigger
                value="engine"
                className="flex items-center gap-2 px-4 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent text-muted-foreground"
              >
                Engine master <TabCount n={engines.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="combo" className="mt-5"><CombinationsTab /></TabsContent>
            <TabsContent value="group" className="mt-5"><AuthGroupsTab /></TabsContent>
            <TabsContent value="sys" className="mt-5"><SystemConfigTab /></TabsContent>
            <TabsContent value="engine" className="mt-5"><EngineMasterTab /></TabsContent>
          </Tabs>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="text-emerald-500">●</span>
            Source of truth: <b>Aircraft-Engine combinations</b> — All other tables derive/join from this table. No manual re-typing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
