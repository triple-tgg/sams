import type { ReactNode } from 'react';

export function Card({ children, className = '', noPad = false }: { children: ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={`rounded-md border border-border bg-card shadow-sm ${noPad ? '' : 'p-3.5'} ${className}`}>
      {children}
    </div>
  );
}

export function ChartCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-card p-[18px] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="mb-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

export function SectionLabel({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="mt-1 mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-foreground">
      {children}
      {note && <span className="text-[11px] font-normal text-muted-foreground">{note}</span>}
    </div>
  );
}

export function SectionDivider() {
  return <div className="my-6 h-px bg-border" />;
}

export function LegendRow({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-3.5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
