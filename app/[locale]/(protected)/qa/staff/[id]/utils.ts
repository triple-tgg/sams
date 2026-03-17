// ── Shared Utilities ──

export function formatDate(d: string): string {
    if (!d || d === '-') return '-'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
