"use client"
import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    ChevronRight,
    FilePlus2,
    MoreVertical,
    SquarePen,
    CircleOff,
    Paperclip,
    ClipboardPenLine,
    Filter as FilterIcon,
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/routing"
import EditProject from "../../edit-project"
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import DateRangePicker from "@/components/date-range-picker"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import Select, { MultiValue } from "react-select"
import type { FlightItem } from "@/lib/api/fleght/filghtlist.interface"
import { Badge } from "@/components/ui/badge"
import { getFlightColumns } from "./columns"
import { useParams, useRouter } from "next/navigation"

// -----------------------------
// Types & options
// -----------------------------
interface Option {
    value: string
    label: string
    image?: string
}

type Inputs = {
    search: string
    assignee: MultiValue<Option> | []
    startDate: Date | null
    endDate: Date | null
}

const assigneeOptions: Option[] = [
    { value: "BKK", label: "BKK", image: "/images/avatar/av-1.svg" },
    { value: "DMK", label: "DMK", image: "/images/avatar/av-2.svg" },
    { value: "HKT", label: "HKT", image: "/images/avatar/av-3.svg" },
    { value: "HDY", label: "HDY", image: "/images/avatar/av-4.svg" },
    { value: "CNX", label: "CNX", image: "/images/avatar/av-4.svg" },
    { value: "CEI", label: "CEI", image: "/images/avatar/av-4.svg" },
    { value: "UTH", label: "UTH", image: "/images/avatar/av-4.svg" },
]

// custom filter: allow multi-select values to match a single string cell
const stationInList = (row: any, _columnId: string, filterValue: string[] | undefined) => {
    if (!filterValue || filterValue.length === 0) return true
    const cell = row.getValue("station") as string
    return filterValue.includes(cell)
}

// -----------------------------
// Component
// -----------------------------
const ListTable = ({ projects }: { projects: FlightItem[] }) => {
    const router = useRouter();
    const { locale } = useParams();

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [editTaskOpen, setEditTaskOpen] = React.useState(false)
    const [deleteProject, setDeleteProject] = React.useState(false)

    const {
        register,
        handleSubmit,
        control,
        watch,
    } = useForm<Inputs>({
        defaultValues: {
            search: "",
            assignee: [],
            startDate: null,
            endDate: null,
        },
    })

    // react-hook-form watchers (wire up filters)
    const searchValue = watch("search")
    const assigneeValue = watch("assignee") as MultiValue<Option>
    const columns = getFlightColumns({
        onCreateTHF: (flight) => {
            const q = new URLSearchParams({
                flightNo: String(flight.arrivalFlightNo ?? ""),
            });
            router.push(`/${locale}/flight/thf/create?${q.toString()}`);
        },
        onAttach: (flight) => {
            // เปิด dialog แนบไฟล์ หรือ set state
            console.log("Attach for flight:", flight);
        },
        onCancel: (flight) => {
            // แสดง confirm / call API
            if (confirm(`Cancel flight ${flight.arrivalFlightNo}?`)) {
                // await cancelFlight(flight.id)
                console.log("Cancelled!");
            }
        },
    });
    // const columns = React.useMemo<ColumnDef<FlightItem>[]>(() => [
    //     {
    //         accessorKey: "arrivalFlightNo",
    //         header: "Flight No",
    //         cell: ({ row }) => (
    //             <div className="flex items-center gap-3 relative">
    //                 {/* {row.getValue("datasource") === "adhoc" && <Badge className="absolute -top-4 right-0 text-[10px] p-1 py-0" rounded="full" color="warning">adhoc</Badge>} */}
    //                 <div className="font-medium text-sm leading-4 whitespace-nowrap">
    //                     {row.getValue("arrivalFlightNo")}
    //                 </div>
    //             </div>
    //         ),
    //     },
    //     // Map stationObj.code -> station (flat) for simpler filtering/rendering
    //     {
    //         id: "station",
    //         header: "STATION",
    //         accessorFn: (row) => row?.stationObj?.code ?? "",
    //         cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>,
    //         filterFn: stationInList,
    //     },
    //     {
    //         accessorKey: "acreg",
    //         header: "A/C Reg",
    //         cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue("acreg") || "n/a"}</span>,
    //     },
    //     {
    //         accessorKey: "actype",
    //         header: "A/C Type",
    //         cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue("actype") || "n/a"}</span>,
    //     },
    //     {
    //         id: "sta",
    //         header: "STA(UTC)",
    //         accessorFn: (row) => `${row?.arrivalDate ?? ""} ${row?.arrivalStatime ?? ""}`.trim(),
    //         cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>,
    //     },
    //     {
    //         id: "std",
    //         header: "STD(UTC)",
    //         accessorFn: (row) => `${row?.departureDate ?? ""} ${row?.departureStdTime ?? ""}`.trim(),
    //         cell: ({ getValue }) => <span className="whitespace-nowrap">{(getValue() as string) || "n/a"}</span>,
    //     },
    //     {
    //         id: "actions",
    //         accessorKey: "action",
    //         header: "Action",
    //         enableHiding: false,
    //         cell: ({ row }) => {
    //             return (
    //                 <div className="flex items-center gap-2">
    //                     <TooltipProvider>
    //                         <Tooltip>
    //                             <TooltipTrigger asChild>
    //                                 <Button
    //                                     variant="outline"
    //                                     size="icon"
    //                                     className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
    //                                     color="secondary"
    //                                 >
    //                                     <Eye className="w-4 h-4" />
    //                                 </Button>
    //                             </TooltipTrigger>
    //                             <TooltipContent side="top">
    //                                 <p>View</p>
    //                             </TooltipContent>
    //                         </Tooltip>
    //                     </TooltipProvider>
    //                     <TooltipProvider>
    //                         <Tooltip>
    //                             <TooltipTrigger asChild>
    //                                 <Button
    //                                     variant="outline"
    //                                     size="icon"
    //                                     className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
    //                                     color="secondary"
    //                                 >
    //                                     <SquarePen className="w-4 h-4" />
    //                                 </Button>

    //                             </TooltipTrigger>
    //                             <TooltipContent side="top">
    //                                 <p>Edit</p>
    //                             </TooltipContent>
    //                         </Tooltip>
    //                     </TooltipProvider>
    //                     <TooltipProvider>
    //                         <Tooltip>
    //                             <TooltipTrigger asChild>
    //                                 <Button
    //                                     variant="outline"
    //                                     size="icon"
    //                                     className="w-7 h-7 ring-offset-transparent border-default-300 text-default-500"
    //                                     color="secondary"
    //                                 >
    //                                     <Trash2 className="w-4 h-4" />
    //                                 </Button>
    //                             </TooltipTrigger>
    //                             <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
    //                                 <p>Delete</p>
    //                             </TooltipContent>
    //                         </Tooltip>
    //                     </TooltipProvider>
    //                 </div>
    //             )
    //         }
    //     },
    //     {
    //         id: "actions",
    //         header: "Action",
    //         enableHiding: false,
    //         cell: ({ row }) => {
    //             const flightNo = row.original?.arrivalFlightNo
    //             // ถ้ามี id ใน FlightItem เปลี่ยนเป็น row.original.id
    //             const linkHref = `/flight/${encodeURIComponent(String(flightNo ?? ""))}`

    //             return (
    //                 <div className="flex items-center justify-between">
    //                     <div><Paperclip className="w-4" /></div>
    //                     <div><ClipboardPenLine className="w-4" /></div>

    //                     <DropdownMenu>
    //                         <DropdownMenuTrigger asChild>
    //                             <Button
    //                                 size="icon"
    //                                 className="flex-none ring-offset-transparent bg-transparent hover:bg-transparent hover:ring-0 hover:ring-transparent w-6"
    //                             >
    //                                 <MoreVertical className="h-4 w-4 text-default-700" />
    //                             </Button>
    //                         </DropdownMenuTrigger>

    //                         <DropdownMenuContent className="p-0 overflow-hidden" align="end">
    //                             <DropdownMenuItem
    //                                 className="py-2 border-b border-default-200 text-default-600 focus:bg-default focus:text-default-foreground rounded-none cursor-pointer"
    //                                 asChild
    //                             >
    //                                 <Link href={linkHref}>
    //                                     <FilePlus2 className="w-3.5 h-3.5 me-1" />
    //                                     Create THF
    //                                 </Link>
    //                             </DropdownMenuItem>

    //                             <DropdownMenuItem
    //                                 className="py-2 border-b border-default-200 text-default-600 focus:bg-default focus:text-default-foreground rounded-none cursor-pointer"
    //                                 onClick={() => setEditTaskOpen(true)}
    //                             >
    //                                 <SquarePen className="w-3.5 h-3.5 me-1" />
    //                                 Edit THF
    //                             </DropdownMenuItem>

    //                             <DropdownMenuItem
    //                                 className="py-2 bg-destructive/10 text-destructive focus:bg-destructive focus:text-destructive-foreground rounded-none cursor-pointer"
    //                                 onClick={() => setDeleteProject(true)}
    //                             >
    //                                 <CircleOff className="w-3.5 h-3.5 me-1" />
    //                                 Flight Cancel
    //                             </DropdownMenuItem>
    //                         </DropdownMenuContent>
    //                     </DropdownMenu>
    //                 </div>
    //             )
    //         },
    //     },
    // ], [])

    const table = useReactTable({
        data: projects,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        // register custom filterFns
        filterFns: {
            stationInList,
        },
    })

    // wire: search -> filter only by Flight No (arrivalflightno)
    React.useEffect(() => {
        table.getColumn("arrivalflightno")?.setFilterValue(searchValue ?? "")
    }, [searchValue, table])

    // wire: assignee (stations) -> filter station column
    React.useEffect(() => {
        const values = (assigneeValue ?? []).map((o) => o.value)
        table.getColumn("station")?.setFilterValue(values)
    }, [assigneeValue, table])

    const onSubmit: SubmitHandler<Inputs> = (data) => {
        // เผื่ออนาคตจะส่งไป query backend; ตอนนี้ filter ทำงาน client-side แล้ว
        console.log("Filters:", data)
    }

    return (
        <>
            <EditProject open={editTaskOpen} setOpen={setEditTaskOpen} />
            <DeleteConfirmationDialog open={deleteProject} onClose={() => setDeleteProject(false)} />

            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader className="flex flex-row items-center space-x-2 justify-between">
                        <div className="flex space-x-2">
                            <Input
                                className="max-w-[250px]"
                                type="text"
                                placeholder="Search Flight No..."
                                {...register("search")}
                            />

                            <div className="flex min-w-[180px]">
                                <Controller
                                    name="assignee"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            isMulti
                                            options={assigneeOptions}
                                            onChange={(selected) => field.onChange(selected)}
                                            placeholder="Station"
                                            // ใช้ formatOptionLabel สำหรับ custom JSX
                                            formatOptionLabel={(option) => (
                                                <div className="flex items-center">
                                                    <span className="text-sm text-default-600 font-medium">{option.label}</span>
                                                </div>
                                            )}
                                            classNamePrefix="react-select"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end flex-1 gap-2">
                            <DateRangePicker />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="default">
                                        <FilterIcon className="w-3.5 h-3.5 me-1" />
                                        {/* Filter */}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[196px]" align="center">
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Day</DropdownMenuItem>
                                    <DropdownMenuItem>Week</DropdownMenuItem>
                                    <DropdownMenuItem>Month</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                </form>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="px-3 bg-default-100">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="even:bg-default-100 px-6 h-20">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-end py-4 px-10">
                        <div className="flex-1 flex items-center gap-3">
                            <div className="flex gap-2 items-center">
                                <div className="text-sm font-medium text-default-60">Go</div>
                                <Input
                                    type="number"
                                    className="w-16 px-2"
                                    value={table.getState().pagination.pageIndex + 1}
                                    onChange={(e) => {
                                        const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0
                                        table.setPageIndex(pageNumber)
                                    }}
                                />
                            </div>
                            <div className="text-sm font-medium text-default-600">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-none">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="w-8 h-8"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            {table.getPageOptions().map((page, pageIndex) => (
                                <Button
                                    key={`basic-data-table-${pageIndex}`}
                                    onClick={() => table.setPageIndex(pageIndex)}
                                    size="icon"
                                    className={`w-8 h-8 ${table.getState().pagination.pageIndex === pageIndex ? "bg-default" : "bg-default-300 text-default"}`}
                                >
                                    {page + 1}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="w-8 h-8"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

export default ListTable
