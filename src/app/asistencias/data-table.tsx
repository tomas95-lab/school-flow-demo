"use client"

import { useState } from "react"
import type { ColumnDef, Table, SortingState, ColumnFiltersState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  X,
  RotateCcw,
  Download,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ColumnFilter<TData> {
  type: "input" | "button" | "badge"
  columnId?: string
  placeholder?: string
  size?: string
  label?: string
  variant?: "outline" | "ghost" | "default" | "destructive" | "secondary"
  onClick?: (table: Table<TData>) => void
  value?: string | number
  color?: "blue" | "green" | "red" | "yellow" | "gray"
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  placeholder?: string
  filters?: ColumnFilter<TData>[]
  showStats?: boolean
  exportable?: boolean
  title?: string
  description?: string 
  emptyMessage?: string
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  placeholder = "elemento",
  filters = [],
  showStats = true,
  exportable = false,
  title,
  description, 
  emptyMessage = "No se encontraron resultados.",
  className
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable<TData>({
    data,
    columns,
    state: { globalFilter, sorting, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const hasActiveFilters = globalFilter !== "" || columnFilters.length > 0
  const sortedRows = table.getSortedRowModel().rows
  const totalRowCount = table.getCoreRowModel().rows.length

  const clearAllFilters = () => {
    setGlobalFilter("")
    table.resetColumnFilters()
    table.resetSorting()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={`Buscar ${placeholder}...`}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {exportable && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              )}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar todo
                </Button>
              )}
            </div>
          </div>

          {filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Filter className="h-4 w-4" />
                Filtros:
              </div>
              
              {filters.map((filter, i) => {
                if (filter.type === "input" && filter.columnId) {
                  const col = table.getColumn(filter.columnId)
                  return (
                    <Input
                      key={i}
                      placeholder={filter.placeholder || `Filtrar ${filter.columnId}`}
                      value={(col?.getFilterValue() as string) ?? ""}
                      onChange={(e) => col?.setFilterValue(e.target.value)}
                      className={cn("h-8", filter.size || "max-w-xs")}
                    />
                  )
                }
                if (filter.type === "button" && filter.onClick) {
                  return (
                    <Button
                      key={i}
                      variant={filter.variant || "outline"}
                      size="sm"
                      onClick={() => filter.onClick?.(table)}
                      className="h-8"
                    >
                      {filter.label}
                    </Button>
                  )
                }
                if (filter.type === "badge") {
                  const colors = {
                    blue: "bg-blue-100 text-blue-800",
                    green: "bg-green-100 text-green-800",
                    red: "bg-red-100 text-red-800",
                    yellow: "bg-yellow-100 text-yellow-800",
                    gray: "bg-gray-100 text-gray-800",
                  }
                  return (
                    <Badge key={i} className={cn("h-8 px-3", colors[filter.color || "gray"])}>
                      {filter.label}: {filter.value}
                    </Badge>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>

        <UiTable>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map(header => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      "cursor-pointer select-none bg-gray-50/50 font-semibold",
                      header.column.getCanSort() && "hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <div className="flex flex-col">
                          {header.column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3 text-blue-600" />}
                          {header.column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3 text-blue-600" />}
                          {!header.column.getIsSorted() && (
                            <div className="h-3 w-3 opacity-30">
                              <ArrowUp className="h-2 w-2" />
                              <ArrowDown className="h-2 w-2 -mt-1" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {sortedRows.length > 0 ? (
              sortedRows.map(row => (
                <TableRow key={row.id} className="hover:bg-blue-50/50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-gray-300" />
                    <p className="font-medium">{emptyMessage}</p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-2">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
    </div>
  )
}
