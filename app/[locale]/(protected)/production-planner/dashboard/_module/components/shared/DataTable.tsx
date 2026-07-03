import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  headerColor?: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  isTotalRow?: (row: T) => boolean;
}

/** Compact comparison table shared by Station Summary, Customer Detail,
 *  and Category Summary sections. */
export function DataTable<T>({ columns, rows, getRowKey, isTotalRow }: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`border-b border-border pb-2 pr-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${
                col.align === 'right' ? 'text-right' : 'text-left'
              }`}
              style={col.headerColor ? { color: col.headerColor } : undefined}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const total = isTotalRow?.(row) ?? false;
          return (
            <tr key={getRowKey(row, i)} className={total ? 'bg-muted font-semibold' : ''}>
              {columns.map((col, ci) => (
                <td
                  key={col.key}
                  className={`border-b border-border/50 py-1.5 pr-1.5 text-foreground ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${total ? 'border-b-0' : ''} ${total && ci === 0 ? 'rounded-l-md pl-2' : ''} ${
                    total && ci === columns.length - 1 ? 'rounded-r-md' : ''
                  }`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
