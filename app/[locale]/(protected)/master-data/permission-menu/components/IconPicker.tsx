"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Ban, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PREFIX = "heroicons-outline:";

/** Heroicons (outline) suited to menus, grouped for browsing. Names are checked against the Iconify set. */
const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "General",
    icons: [
      "home", "squares-2x2", "rectangle-group", "rectangle-stack", "view-columns", "table-cells",
      "list-bullet", "queue-list", "bars-3", "star", "bookmark", "flag", "tag", "bell", "inbox", "inbox-stack",
      "magnifying-glass", "funnel", "link", "globe-alt", "map", "map-pin", "light-bulb", "sparkles",
    ],
  },
  {
    label: "Documents",
    icons: [
      "document", "document-text", "document-check", "document-chart-bar", "document-duplicate",
      "document-magnifying-glass", "document-plus", "document-arrow-down", "document-arrow-up",
      "folder", "folder-open", "folder-plus", "archive-box", "clipboard", "clipboard-document",
      "clipboard-document-list", "clipboard-document-check", "book-open", "newspaper", "paper-clip", "printer",
    ],
  },
  {
    label: "Charts & Reports",
    icons: [
      "chart-bar", "chart-bar-square", "chart-pie", "presentation-chart-bar", "presentation-chart-line",
      "arrow-trending-up", "arrow-trending-down", "circle-stack", "server", "server-stack", "cpu-chip",
    ],
  },
  {
    label: "People",
    icons: [
      "user", "users", "user-group", "user-circle", "user-plus", "identification", "academic-cap",
      "briefcase", "hand-raised", "chat-bubble-left-right", "envelope", "phone",
    ],
  },
  {
    label: "Finance",
    icons: [
      "banknotes", "currency-dollar", "credit-card", "calculator", "receipt-percent",
      "receipt-refund", "scale", "shopping-cart", "shopping-bag", "gift",
    ],
  },
  {
    label: "Time",
    icons: ["calendar", "calendar-days", "clock"],
  },
  {
    label: "Aviation & Operations",
    icons: [
      "paper-airplane", "truck", "wrench", "wrench-screwdriver", "cog", "cog-6-tooth",
      "cog-8-tooth", "adjustments-horizontal", "beaker", "bolt", "fire", "lifebuoy", "cube",
      "cube-transparent", "puzzle-piece", "building-office", "building-office-2", "building-library",
      "building-storefront", "home-modern",
    ],
  },
  {
    label: "Security & Status",
    icons: [
      "shield-check", "shield-exclamation", "lock-closed", "lock-open", "key", "finger-print",
      "check-badge", "check-circle", "exclamation-circle", "exclamation", "information-circle",
      "question-mark-circle", "eye",
    ],
  },
];

const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.icons);

const prettyName = (full: string) => full.replace(/^[^:]+:/, "").replace(/-/g, " ");

export default function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase().replace(/\s+/g, "-");

  const groups = useMemo(() => {
    if (!q) return ICON_GROUPS;
    const hits = ALL_ICONS.filter((n) => n.includes(q));
    return hits.length ? [{ label: `Results (${hits.length})`, icons: hits }] : [];
  }, [q]);

  // A saved icon that isn't in the list (or uses another icon set) stays selectable
  const isCustom = !!value && !ALL_ICONS.some((n) => PREFIX + n === value);

  const tile = (full: string, key: string) => {
    const selected = value === full;
    return (
      <button
        key={key}
        type="button"
        disabled={disabled}
        onClick={() => onChange(full)}
        title={prettyName(full)}
        aria-label={prettyName(full)}
        aria-pressed={selected}
        className={cn(
          "flex aspect-square items-center justify-center rounded-md border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Icon icon={full} className="h-5 w-5" />
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border bg-muted/20">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons"
            className="h-8 bg-background pl-8 pr-7 text-xs"
            disabled={disabled}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
        {!q && (
          <div className="grid grid-cols-8 gap-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              title="No icon"
              aria-label="No icon"
              aria-pressed={!value}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border transition-colors",
                !value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-dashed border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Ban className="h-4 w-4" />
            </button>
            {isCustom && tile(value, "custom")}
          </div>
        )}

        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1 px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {g.label}
            </p>
            <div className="grid grid-cols-8 gap-1">{g.icons.map((n) => tile(PREFIX + n, n))}</div>
          </div>
        ))}

        {groups.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No icons match “{query}”.</p>
        )}
      </div>
    </div>
  );
}
