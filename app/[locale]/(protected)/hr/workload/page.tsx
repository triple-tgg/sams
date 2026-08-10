"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Types ──────────────────────────────────────────────────

type WorkloadLevel = "Very High" | "High" | "Normal" | "Low";

interface MechanicWorkload {
  id: number;
  name: string;
  flights: number;
  serviceHr: number;
  avgHrPerFlight: number;
  workload: WorkloadLevel;
  utilization: number;
  remark: string;
}

interface TimeSlotData {
  timeSlot: string;
  flights: number;
  percentage: number;
  workload: WorkloadLevel;
}

interface SummaryKpi {
  totalFlights: number;
  avgFlightsPerDay: number;
  totalServiceHr: number;
  totalMechanics: number;
  avgServiceHrPerPerson: number;
  peakTimeSlot: string;
  peakPercentage: number;
}

// ─── Mock Data ──────────────────────────────────────────────

const MOCK_SUMMARY: SummaryKpi = {
  totalFlights: 248,
  avgFlightsPerDay: 8.0,
  totalServiceHr: 612.5,
  totalMechanics: 12,
  avgServiceHrPerPerson: 51.0,
  peakTimeSlot: "18:00-22:00",
  peakPercentage: 36,
};

const MOCK_MECHANICS: MechanicWorkload[] = [
  { id: 1, name: "สมชาย โชดี", flights: 54, serviceHr: 73.5, avgHrPerFlight: 1.36, workload: "Very High", utilization: 92, remark: "ควรตรวจ OT / Fatigue" },
  { id: 2, name: "ณัฐพล วิสนนะ", flights: 50, serviceHr: 69.8, avgHrPerFlight: 1.40, workload: "High", utilization: 87, remark: "ภาระงานสูงต่อเนื่อง" },
  { id: 3, name: "ชัยวัฒน์ ศรีสุข", flights: 47, serviceHr: 65.4, avgHrPerFlight: 1.39, workload: "High", utilization: 82, remark: "Peak ช่วง Evening" },
  { id: 4, name: "อาทิตย์ บุญมา", flights: 44, serviceHr: 60.9, avgHrPerFlight: 1.38, workload: "High", utilization: 76, remark: "-" },
  { id: 5, name: "กิตติ พัฒนกิจ", flights: 42, serviceHr: 55.1, avgHrPerFlight: 1.31, workload: "Normal", utilization: 69, remark: "-" },
  { id: 6, name: "ธนกร รุ่งเรือง", flights: 39, serviceHr: 50.7, avgHrPerFlight: 1.30, workload: "Normal", utilization: 63, remark: "-" },
  { id: 7, name: "พงศกร ศิลปชัย", flights: 36, serviceHr: 45.6, avgHrPerFlight: 1.27, workload: "Normal", utilization: 57, remark: "-" },
  { id: 8, name: "วิทยา บากดี", flights: 34, serviceHr: 41.8, avgHrPerFlight: 1.23, workload: "Normal", utilization: 52, remark: "-" },
  { id: 9, name: "ภาณุมี ถือใจ", flights: 31, serviceHr: 37.9, avgHrPerFlight: 1.22, workload: "Low", utilization: 47, remark: "อาจมี Training / Leave" },
  { id: 10, name: "สวัชญ์ บัวลม", flights: 29, serviceHr: 34.6, avgHrPerFlight: 1.19, workload: "Low", utilization: 43, remark: "-" },
  { id: 11, name: "ศิรณพ สายทอง", flights: 25, serviceHr: 29.1, avgHrPerFlight: 1.16, workload: "Low", utilization: 36, remark: "ลาพักร้อน 4 วัน" },
  { id: 12, name: "ธีรภัทร วันดี", flights: 19, serviceHr: 28.1, avgHrPerFlight: 1.48, workload: "Low", utilization: 35, remark: "เข้าเมายาวช่วง" },
];

const MOCK_TIMESLOTS: TimeSlotData[] = [
  { timeSlot: "00:00-06:00", flights: 36, percentage: 15, workload: "Low" },
  { timeSlot: "06:00-12:00", flights: 61, percentage: 25, workload: "Normal" },
  { timeSlot: "12:00-18:00", flights: 62, percentage: 25, workload: "Normal" },
  { timeSlot: "18:00-22:00", flights: 72, percentage: 29, workload: "High" },
  { timeSlot: "22:00-24:00", flights: 17, percentage: 6, workload: "Low" },
];

// ─── Helpers ────────────────────────────────────────────────

const WORKLOAD_CONFIG: Record<WorkloadLevel, { color: string; bg: string; border: string }> = {
  "Very High": { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  High: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  Normal: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  Low: { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
};

const WORKLOAD_BAR_COLOR: Record<WorkloadLevel, string> = {
  "Very High": "#dc2626",
  High: "#ea580c",
  Normal: "#059669",
  Low: "#0284c7",
};

function WorkloadBadge({ level }: { level: WorkloadLevel }) {
  const cfg = WORKLOAD_CONFIG[level];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {level}
    </span>
  );
}

function formatNumber(n: number, decimals = 1) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ─── Month Options ──────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: "2026-07", label: "กรกฎาคม 2026" },
  { value: "2026-06", label: "มิถุนายน 2026" },
  { value: "2026-05", label: "พฤษภาคม 2026" },
];

// ─── Main Page Component ────────────────────────────────────

export default function WorkloadPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-07");

  // Derived KPI from detail table
  const derivedKpi = useMemo(() => {
    const maxServiceMech = MOCK_MECHANICS.reduce((a, b) => (a.serviceHr > b.serviceHr ? a : b));
    const maxFlightsMech = MOCK_MECHANICS.reduce((a, b) => (a.flights > b.flights ? a : b));
    const totalServiceHr = MOCK_MECHANICS.reduce((acc, m) => acc + m.serviceHr, 0);
    const totalFlights = MOCK_MECHANICS.reduce((acc, m) => acc + m.flights, 0);
    const highCount = MOCK_MECHANICS.filter((m) => m.workload === "High" || m.workload === "Very High").length;

    return {
      maxServiceMechName: maxServiceMech.name,
      maxServiceHr: maxServiceMech.serviceHr,
      maxFlights: maxFlightsMech.flights,
      avgServicePerFlight: totalServiceHr / totalFlights,
      highVeryHighCount: highCount,
      totalCount: MOCK_MECHANICS.length,
    };
  }, []);

  // Chart data (top 8 mechanics by service hours)
  const chartData = useMemo(
    () =>
      [...MOCK_MECHANICS]
        .sort((a, b) => b.serviceHr - a.serviceHr)
        .slice(0, 8)
        .map((m) => ({
          name: m.name,
          serviceHr: m.serviceHr,
          workload: m.workload,
        })),
    []
  );

  const currentMonthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  return (
    <div className="space-y-8">
      {/* ═══════════ SECTION 1: SUMMARY DASHBOARD ═══════════ */}
      <section>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              รายงานสรุป Workload งาน Line Maintenance
            </h1>
            <p className="mt-1 text-sm text-default-500">
              Aircraft Maintenance Workload Summary
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-default-500">ช่วงรายงาน:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-default-400">
              ตัวอย่างรูปแบบรายงาน · สามารถเลือนช่วงเวลาได้
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon="heroicons-outline:paper-airplane"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            label="จำนวนเที่ยวบินที่ให้บริการ"
            value={MOCK_SUMMARY.totalFlights.toString()}
            unit="Flights"
            sub={`เฉลี่ย ${formatNumber(MOCK_SUMMARY.avgFlightsPerDay)} เที่ยวบิน/วัน`}
          />
          <KpiCard
            icon="heroicons-outline:clock"
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            label="ชั่วโมง Service รวมของช่าง"
            value={formatNumber(MOCK_SUMMARY.totalServiceHr)}
            unit="Hr"
            sub="รวมเวลาที่เข้า Service เครื่องบิน"
          />
          <KpiCard
            icon="heroicons-outline:users"
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            label="จำนวนช่างที่ปฏิบัติงาน"
            value={MOCK_SUMMARY.totalMechanics.toString()}
            unit="Persons"
            sub={`เฉลี่ย ${formatNumber(MOCK_SUMMARY.avgServiceHrPerPerson)} ชั่วโมง/คน/เดือน`}
          />
          <KpiCard
            icon="heroicons-outline:fire"
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            label="ช่วงเวลางานหนาแน่นที่สุด"
            value={MOCK_SUMMARY.peakTimeSlot}
            unit=""
            sub={`คิดเป็น ${MOCK_SUMMARY.peakPercentage}% ของ Service Hour ทั้งหมด`}
          />
        </div>

        {/* Chart + Time Slot Table */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Horizontal Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-primary">
                  Service Hour แยกรายช่าง
                </CardTitle>
                <span className="text-xs text-default-400">
                  Top 8 by actual service time
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 50, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 12, fill: "#374151" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} h`, "Service Hours"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="serviceHr" radius={[0, 4, 4, 0]} barSize={24} label={{ position: "right", formatter: (v: number) => `${v} h`, fontSize: 12, fill: "#374151" }}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={WORKLOAD_BAR_COLOR[entry.workload]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">มุมมองสำหรับผู้บริหาร:</span>{" "}
                  รายงานนี้ควรใช้ Actual Service Hour จากเวลาเริ่มงานถึงเวลางานของแต่ละ Aircraft Service Event
                  และนับตามผู้ที่เข้าปฏิบัติงานจริง
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Time Slot Table + Workload Indicator */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-primary">
                    จำนวนเที่ยวบินตามช่วงเวลา
                  </CardTitle>
                  <span className="text-xs text-default-400">Flights handled</span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ช่วงเวลา</TableHead>
                      <TableHead className="text-center text-xs">Flights</TableHead>
                      <TableHead className="text-center text-xs">สัดส่วน</TableHead>
                      <TableHead className="text-center text-xs">ภาระงาน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_TIMESLOTS.map((slot) => (
                      <TableRow key={slot.timeSlot}>
                        <TableCell className="font-medium text-default-900">
                          {slot.timeSlot}
                        </TableCell>
                        <TableCell className="text-center">{slot.flights}</TableCell>
                        <TableCell className="text-center">{slot.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <WorkloadBadge level={slot.workload} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Workload Indicator Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-primary">
                  Workload Indicator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ระดับ</TableHead>
                      <TableHead className="text-xs">เกณฑ์ตัวอย่าง / คน / เดือน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><WorkloadBadge level="Low" /></TableCell>
                      <TableCell className="text-default-600">&lt; 40 Service Hr</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><WorkloadBadge level="Normal" /></TableCell>
                      <TableCell className="text-default-600">40 - 60 Service Hr</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><WorkloadBadge level="High" /></TableCell>
                      <TableCell className="text-default-600">60 - 70 Service Hr</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><WorkloadBadge level="Very High" /></TableCell>
                      <TableCell className="text-default-600">&gt; 70 Service Hr</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 2: MECHANIC DETAIL TABLE ═══════════ */}
      <section>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              รายละเอียด Workload รายช่าง
            </h2>
            <p className="mt-1 text-sm text-default-500">
              Mechanic Workload Detail
            </p>
          </div>
          <div className="text-right text-sm font-medium text-primary">
            1 - 31 {currentMonthLabel}
          </div>
        </div>

        {/* Detail KPI Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailKpiCard
            label="ทีมที่มี Service Hour สูงสุด"
            highlight={derivedKpi.maxServiceMechName}
            value={`${formatNumber(derivedKpi.maxServiceHr)} Hr`}
          />
          <DetailKpiCard
            label="Flights/Mechanic สูงสุด"
            highlight=""
            value={`${derivedKpi.maxFlights} Flights`}
          />
          <DetailKpiCard
            label="Service Avg / Flight"
            highlight=""
            value={`${formatNumber(derivedKpi.avgServicePerFlight, 2)} Hr`}
          />
          <DetailKpiCard
            label="ช่างระดับ High + Very High"
            highlight=""
            value={`${derivedKpi.highVeryHighCount} / ${derivedKpi.totalCount} คน`}
          />
        </div>

        {/* Detail Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center text-xs">#</TableHead>
                  <TableHead className="text-xs">ชื่อช่าง</TableHead>
                  <TableHead className="text-center text-xs">Flights</TableHead>
                  <TableHead className="text-center text-xs">Service Hr</TableHead>
                  <TableHead className="text-center text-xs">Avg Hr / Flight</TableHead>
                  <TableHead className="text-center text-xs">Workload</TableHead>
                  <TableHead className="text-center text-xs">Utilization</TableHead>
                  <TableHead className="text-xs">หมายเหตุ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MECHANICS.map((mech, idx) => (
                  <TableRow
                    key={mech.id}
                    className={
                      mech.workload === "Very High"
                        ? "bg-red-50/50"
                        : mech.workload === "High"
                          ? "bg-orange-50/30"
                          : ""
                    }
                  >
                    <TableCell className="text-center font-medium text-default-500">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-default-900">
                      {mech.name}
                    </TableCell>
                    <TableCell className="text-center">{mech.flights}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {formatNumber(mech.serviceHr)}
                    </TableCell>
                    <TableCell className="text-center">{formatNumber(mech.avgHrPerFlight, 2)}</TableCell>
                    <TableCell className="text-center">
                      <WorkloadBadge level={mech.workload} />
                    </TableCell>
                    <TableCell className="text-center">
                      <UtilizationBar value={mech.utilization} />
                    </TableCell>
                    <TableCell className="text-default-500">{mech.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">ข้อเสนอแนะในการใช้งานจริง:</span>{" "}
                ควรแยก &quot;Service Hour&quot; ออกจาก Working Hour ปกติ และสามารถเพิ่มตัวกรอง Station,
                Aircraft Type, Customer/Airline, Shift, Mechanic/Certifying Staff, วันทำงาน/วันหยุด
                เพื่อใช้วางแผน Manpower และตรวจสอบความเสี่ยงจาก Fatigue ได้แม่นยำขึ้น
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────

function KpiCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  unit,
  sub,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  unit: string;
  sub: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon icon={icon} className={`h-4 w-4 ${iconColor}`} />
          </div>
          <span className="text-xs font-medium text-default-500">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">{value}</span>
          {unit && <span className="text-sm font-medium text-default-500">{unit}</span>}
        </div>
        <p className="mt-1.5 text-xs text-default-400">{sub}</p>
      </CardContent>
    </Card>
  );
}

function DetailKpiCard({
  label,
  highlight,
  value,
}: {
  label: string;
  highlight: string;
  value: string;
}) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-default-500">{label}</p>
        {highlight && (
          <p className="mt-1 text-sm font-semibold text-primary">{highlight}</p>
        )}
        <p className="mt-1 text-xl font-bold text-default-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function UtilizationBar({ value }: { value: number }) {
  const barColor =
    value >= 80
      ? "bg-red-500"
      : value >= 60
        ? "bg-orange-500"
        : value >= 40
          ? "bg-emerald-500"
          : "bg-sky-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-default-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-default-700">{value}%</span>
    </div>
  );
}
