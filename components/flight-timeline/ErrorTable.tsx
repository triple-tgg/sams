'use client';

import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { AlertCircle } from 'lucide-react';
import { ValidatedRow } from './types/flight-import.types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ErrorTableProps {
    headers: string[];
    invalidRows: ValidatedRow[];
    maxHeight?: string;
}

/**
 * Table component specifically for displaying invalid rows with error notes
 * Shows original data with an additional "Error Note" column explaining issues
 */
export function ErrorTable({
    headers,
    invalidRows,
    maxHeight = '300px',
}: ErrorTableProps) {
    if (invalidRows.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium text-sm">
                    {invalidRows.length} row{invalidRows.length > 1 ? 's' : ''} with validation errors
                </span>
            </div>

            <div
                className={cn('rounded-md border border-red-200 dark:border-red-900 overflow-auto')}
                style={{ maxHeight }}
            >
                <Table>
                    <TableHeader className="sticky top-0 bg-red-50 dark:bg-red-950/50 z-10">
                        <TableRow>
                            <TableHead className="w-12 text-center">Row</TableHead>
                            {headers.map((header, index) => (
                                <TableHead key={index} className="whitespace-nowrap">
                                    {header}
                                </TableHead>
                            ))}
                            <TableHead className="min-w-[200px] text-red-600 dark:text-red-400">
                                Error Note
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invalidRows.map((row, index) => {
                            // Combine all error messages for this row
                            const errorNote = row.errors
                                .map((e) => `${e.column}: ${e.message}`)
                                .join('; ');

                            // Get columns with errors for highlighting
                            const errorColumns = new Set(row.errors.map((e) => e.column));

                            return (
                                <TableRow
                                    key={index}
                                    className="bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20"
                                >
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {row.originalIndex}
                                    </TableCell>
                                    {headers.map((header, colIndex) => {
                                        // Check if this column has an error (matching logic)
                                        const hasError = row.errors.some(
                                            (e) =>
                                                e.column === header ||
                                                e.column.toLowerCase().includes(header.toLowerCase().replace(/[^a-z]/gi, ''))
                                        );

                                        return (
                                            <TableCell
                                                key={colIndex}
                                                className={cn(
                                                    'whitespace-nowrap',
                                                    hasError && 'text-red-600 dark:text-red-400 font-medium bg-red-100/50 dark:bg-red-900/20'
                                                )}
                                            >
                                                {row.data[header] !== undefined && row.data[header] !== ''
                                                    ? String(row.data[header])
                                                    : <span className="text-muted-foreground italic">empty</span>}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell className="text-red-600 dark:text-red-400 text-xs">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="max-w-[250px] truncate cursor-help">
                                                        {errorNote}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="max-w-[400px]">
                                                    <div className="space-y-1">
                                                        {row.errors.map((err, i) => (
                                                            <div key={i} className="text-sm">
                                                                <span className="font-medium">{err.column}:</span> {err.message}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
