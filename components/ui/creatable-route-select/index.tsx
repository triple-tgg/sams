"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Controller } from "react-hook-form"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field-error"

import { useRoutesOptions, useSearchRoutes, useUpsertRoute } from "@/lib/api/hooks/useRoutes"
import useReduxAuth from "@/lib/api/hooks/useReduxAuth"

interface Option {
    value: string
    label: string
}

interface CreatableRouteSelectProps {
    name: string
    control: any
    label: string
    placeholder?: string
    errorMessage?: string
}

export const CreatableRouteSelect: React.FC<CreatableRouteSelectProps> = ({
    name,
    control,
    label,
    placeholder = "Select route...",
    errorMessage,
}) => {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const { getUserName } = useReduxAuth()

    // Load all routes for initial list
    const { options: allOptions, isLoading: isLoadingAll } = useRoutesOptions()

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    // Search routes by name
    const { data: searchData, isLoading: isSearching } = useSearchRoutes(debouncedSearch)

    // Upsert mutation
    const upsertMutation = useUpsertRoute()

    // Build display options: if searching, merge search results with all options
    const displayOptions = React.useMemo(() => {
        if (!searchTerm) return allOptions

        // Filter allOptions by search term locally
        const filtered = allOptions.filter(
            (opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )

        // Also add search API results if available
        if (searchData?.responseData) {
            const searchOptions: Option[] = searchData.responseData.map((item) => ({
                value: item.code,
                label: item.code,
                // label: item.name ? `${item.code} - ${item.name}` : item.code,
            }))

            // Merge without duplicates
            const existingValues = new Set(filtered.map((o) => o.value))
            for (const opt of searchOptions) {
                if (!existingValues.has(opt.value)) {
                    filtered.push(opt)
                }
            }
        }

        return filtered
    }, [searchTerm, allOptions, searchData])

    // Check if search term matches any existing option
    const noMatch = searchTerm.length > 0 && displayOptions.length === 0 && !isSearching

    // Handle creating a new route
    const handleCreate = useCallback(
        async (fieldOnChange: (value: Option | null) => void) => {
            const code = searchTerm.trim()
            if (!code) return

            try {
                await upsertMutation.mutateAsync({
                    id: 0,
                    code: code,
                    name: code,
                    description: "",
                    userName: getUserName() || "system",
                    isdelete: false,
                })

                // Set the newly created option
                const newOption: Option = { value: code, label: code }
                fieldOnChange(newOption)
                setSearchTerm("")
                setOpen(false)
            } catch (error) {
                console.error("Failed to create route:", error)
            }
        },
        [searchTerm, upsertMutation, getUserName]
    )

    return (
        <div className="space-y-1">
            <Label htmlFor={name}>{label}</Label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between font-normal text-xs h-9 border-gray-300 hover:bg-white text-gray-500 hover:text-gray-500 overflow-hidden "
                                disabled={isLoadingAll}
                            >
                                {isLoadingAll
                                    ? `Loading ${label.toLowerCase()}...`
                                    : field.value?.label || placeholder}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder={`Search ${label.toLowerCase()}...`}
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                />
                                <CommandList>
                                    {/* Loading state */}
                                    {(isSearching || isLoadingAll) && (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            <span className="ml-2 text-sm text-gray-500">Searching...</span>
                                        </div>
                                    )}

                                    {/* Empty state with create option */}
                                    {noMatch && !upsertMutation.isPending && (
                                        <CommandEmpty className="py-0">
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-3 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                                                onClick={() => handleCreate(field.onChange)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create &quot;{searchTerm}&quot;
                                            </button>
                                        </CommandEmpty>
                                    )}

                                    {/* Creating state */}
                                    {upsertMutation.isPending && (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            <span className="ml-2 text-sm text-blue-600">Creating...</span>
                                        </div>
                                    )}

                                    {/* Options list */}
                                    {displayOptions.length > 0 && (
                                        <CommandGroup>
                                            {displayOptions.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={option.value}
                                                    onSelect={() => {
                                                        field.onChange(
                                                            field.value?.value === option.value ? null : option
                                                        )
                                                        setSearchTerm("")
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value?.value === option.value
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}

                                    {/* Create option when there are some results but user can still add */}
                                    {searchTerm.length > 0 &&
                                        displayOptions.length > 0 &&
                                        !displayOptions.some(
                                            (o) => o.value.toLowerCase() === searchTerm.toLowerCase()
                                        ) &&
                                        !upsertMutation.isPending && (
                                            <CommandGroup heading="Create new">
                                                <CommandItem
                                                    value={`create-${searchTerm}`}
                                                    onSelect={() => handleCreate(field.onChange)}
                                                    className="text-blue-600"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Create &quot;{searchTerm}&quot;
                                                </CommandItem>
                                            </CommandGroup>
                                        )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            />
            <FieldError msg={errorMessage} />
        </div>
    )
}
