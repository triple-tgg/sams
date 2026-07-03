'use client';

export type MainTabId = 'overview' | 'compare' | 'category';

const TABS: { id: MainTabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Revenue Overview', icon: '📋' },
  { id: 'compare', label: 'Production & Revenue', icon: '📊' },
  { id: 'category', label: 'Revenue by Category', icon: '📈' },
];

export function MainNav({ active, onChange }: { active: MainTabId; onChange: (id: MainTabId) => void }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border pb-3">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md border px-4 py-1.5 text-xs font-medium transition-colors ${
            active === tab.id
              ? 'border-primary bg-primary text-white shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
