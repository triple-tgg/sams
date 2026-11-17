/**
 * Contract escalation schedule.
 *
 * - Regular round: one day-month ("MM-DD") that repeats every year.
 * - Additional rounds: full dates ("YYYY-MM-DD") used when escalation is rescheduled.
 *   An additional round replaces the regular round of the same year. Years with no
 *   additional round use the regular date, so once the additional rounds run out
 *   the contract goes back to the regular yearly date.
 * - Whether a round has been applied comes from the backend: `isApplied` on each
 *   additional round, and `lastEscalationAppliedDate` for regular rounds.
 */

export interface EscalationRound {
  /** 0 = new (not saved yet) */
  id: number;
  /** YYYY-MM-DD; "" while the user hasn't picked a date */
  escalationDate: string;
  /** Set by the backend once the rates were escalated for this round */
  isApplied: boolean;
  appliedDate: string | null;
  appliedBy: string | null;
}

export type EscalationSource = "regular" | "additional";

export interface ScheduleEntry {
  date: string; // YYYY-MM-DD
  source: EscalationSource;
  roundId?: number;
  /** null = unknown (no data from the backend yet) */
  isApplied: boolean | null;
  appliedDate: string | null;
}

export interface EscalationSchedule {
  /** Latest round on or before today — the round that should have been applied by now */
  current: ScheduleEntry | null;
  /** Next rounds after today */
  upcoming: ScheduleEntry[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const isValidIso = (s: string | null | undefined): s is string => {
  if (!s || !ISO.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/** "MM-DD" in a given year; 29 Feb falls back to 28 Feb in non-leap years. */
function regularDateInYear(mmdd: string, year: number): string | null {
  const [m, d] = mmdd.split("-").map(Number);
  if (!m || !d) return null;
  const last = new Date(year, m, 0).getDate();
  return `${year}-${pad(m)}-${pad(Math.min(d, last))}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2027-03-15" → "15-Mar-2027" */
export function formatDMY(iso: string | null | undefined): string {
  if (!iso) return "-";
  const s = iso.slice(0, 10);
  if (!isValidIso(s)) return iso;
  const [y, m, d] = s.split("-");
  return `${d}-${MONTHS[Number(m) - 1]}-${y}`;
}

export function buildEscalationSchedule({
  regularDate,
  rounds,
  effectiveFrom,
  expiresOn,
  lastEscalationAppliedDate = null,
  today = toIso(new Date()),
  upcomingCount = 3,
}: {
  regularDate: string; // "MM-DD" or ""
  rounds: EscalationRound[];
  effectiveFrom?: string | null;
  /** null / "" = no expiry */
  expiresOn?: string | null;
  lastEscalationAppliedDate?: string | null;
  today?: string;
  upcomingCount?: number;
}): EscalationSchedule {
  const start = isValidIso(effectiveFrom?.slice(0, 10)) ? effectiveFrom!.slice(0, 10) : null;
  const end = isValidIso(expiresOn?.slice(0, 10)) ? expiresOn!.slice(0, 10) : null;
  const inPeriod = (d: string) => (!start || d >= start) && (!end || d <= end);

  const additional = rounds
    .filter((r) => isValidIso(r.escalationDate))
    .map<ScheduleEntry>((r) => ({
      date: r.escalationDate,
      source: "additional",
      roundId: r.id,
      isApplied: r.id > 0 ? r.isApplied : null,
      appliedDate: r.appliedDate,
    }));
  const overriddenYears = new Set(additional.map((e) => e.date.slice(0, 4)));

  const lastApplied = isValidIso(lastEscalationAppliedDate?.slice(0, 10))
    ? lastEscalationAppliedDate!.slice(0, 10)
    : null;

  const regular: ScheduleEntry[] = [];
  if (/^\d{2}-\d{2}$/.test(regularDate)) {
    const todayYear = Number(today.slice(0, 4));
    const firstYear = start ? Number(start.slice(0, 4)) : todayYear - 1;
    const lastYear = Math.max(todayYear, firstYear) + 15;
    for (let y = firstYear; y <= lastYear; y++) {
      if (overriddenYears.has(String(y))) continue;
      const d = regularDateInYear(regularDate, y);
      if (!d) continue;
      regular.push({
        date: d,
        source: "regular",
        isApplied: lastApplied ? lastApplied >= d : null,
        appliedDate: lastApplied && lastApplied >= d ? lastApplied : null,
      });
    }
  }

  const all = [...additional, ...regular]
    .filter((e) => inPeriod(e.date))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.source === "additional" ? -1 : 1));

  const past = all.filter((e) => e.date <= today);
  return {
    current: past.length ? past[past.length - 1] : null,
    upcoming: all.filter((e) => e.date > today).slice(0, upcomingCount),
  };
}

/**
 * Field errors for the additional rounds, keyed by round index.
 * Rounds are kept in the order the user entered them, and each dated round must be
 * later than the dated round before it (equal or earlier = error). Applied rounds
 * are read-only and are not reported, but still count as the "previous" round.
 * `requireDate: false` skips empty rows (for live checking while the user is still typing).
 */
export function validateEscalationRounds(
  rounds: EscalationRound[],
  effectiveFrom?: string | null,
  expiresOn?: string | null,
  isNoExpiryDate = false,
  { requireDate = true }: { requireDate?: boolean } = {}
): Record<number, string> {
  const errors: Record<number, string> = {};
  const start = effectiveFrom?.slice(0, 10) || "";
  const end = isNoExpiryDate ? "" : expiresOn?.slice(0, 10) || "";
  let prev: { index: number; date: string } | null = null;

  rounds.forEach((r, i) => {
    const d = r.escalationDate;
    const valid = isValidIso(d);
    if (!r.isApplied) {
      if (!d) {
        if (requireDate) errors[i] = "Date is required";
      } else if (!valid) errors[i] = "Enter a valid date (DD-MMM-YYYY)";
      else if (prev && d <= prev.date)
        errors[i] = `Must be after Round ${prev.index + 1} (${formatDMY(prev.date)})`;
      else if (start && d < start) errors[i] = `Must be on or after Effective From (${formatDMY(start)})`;
      else if (end && d > end) errors[i] = `Must be on or before Expires On (${formatDMY(end)})`;
    }
    if (valid) prev = { index: i, date: d };
  });
  return errors;
}

/** Sorts rounds by date, keeping undated (new) rows at the end. */
export function sortEscalationRounds(rounds: EscalationRound[]): EscalationRound[] {
  return [...rounds].sort((a, b) => {
    if (!a.escalationDate) return 1;
    if (!b.escalationDate) return -1;
    return a.escalationDate.localeCompare(b.escalationDate);
  });
}

// ─── Escalation log (applied rounds) ───

export interface EscalationLogEntry {
  id: number;
  escalationDate: string; // YYYY-MM-DD
  source: EscalationSource;
  appliedDate: string;
  appliedBy: string | null;
  rates: { pricingDataId: number; percent: number }[];
}

export interface RateEscalationSummary {
  pricingDataId: number;
  roundsApplied: number;
  /** Compounded: (1 + p1)(1 + p2)… − 1, in % */
  cumulativePercent: number;
}

/** Log sorted oldest → newest by round date, then applied date. */
export function sortEscalationLog(log: EscalationLogEntry[]): EscalationLogEntry[] {
  return [...log].sort(
    (a, b) => a.escalationDate.localeCompare(b.escalationDate) || (a.appliedDate ?? "").localeCompare(b.appliedDate ?? "")
  );
}

/** Rounds applied and compounded increase for each pricing rate. */
export function summarizeEscalationByRate(log: EscalationLogEntry[], pricingDataIds: number[]): RateEscalationSummary[] {
  return pricingDataIds.map((id) => {
    let factor = 1;
    let rounds = 0;
    for (const entry of log) {
      const r = entry.rates.find((x) => x.pricingDataId === id);
      if (!r) continue;
      rounds++;
      factor *= 1 + (Number(r.percent) || 0) / 100;
    }
    return { pricingDataId: id, roundsApplied: rounds, cumulativePercent: Math.round((factor - 1) * 10000) / 100 };
  });
}
