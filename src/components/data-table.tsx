"use client"
import { useState } from "react"
import type { ColumnDef, Table, SortingState, ColumnFiltersState, PaginationState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
  exportable = false,
  title,
  description,
  emptyMessage = "No se encontraron resultados.",
  className
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  // Usar PaginationState en lugar de estados separados
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const table = useReactTable<TData>({
    data,
    columns,
    state: { 
      globalFilter, 
      sorting, 
      columnFilters, 
      pagination // Usar el estado de paginación correcto
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination, // Agregar el handler de paginación
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const hasActiveFilters = globalFilter !== "" || columnFilters.length > 0
  const rows = table.getRowModel().rows

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

          {hasActiveFilters && (
            <div className="mt-2 flex flex-wrap gap-2">
              {globalFilter && (
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setGlobalFilter("")}
                >
                  Buscar: {globalFilter} <X className="inline-block w-3 h-3 ml-1" />
                </Badge>
              )}
              {table.getState().columnFilters.map(cf => {
                const col = table.getColumn(cf.id)
                const raw = cf.value
                const displayValue = typeof raw === "boolean" ? (raw ? "Sí" : "No") : String(raw)
                return (
                  <Badge
                    key={cf.id}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => col?.setFilterValue(undefined)}
                  >
                    {`${cf.id}: ${displayValue}`} <X className="inline-block w-3 h-3 ml-1" />
                  </Badge>
                )
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
            {rows.length > 0 ? (
              rows.map(row => (
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
                      <Button variant="outline" size="sm" onClick={() => clearAllFilters()} className="mt-2">
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

        {/* Paginación corregida */}
        <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50/30">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => table.previousPage()} 
              disabled={!table.getCanPreviousPage()}
            >
              ‹ Anterior
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()}
            >
              Siguiente ›
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{" "}
              <strong>{table.getPageCount()}</strong>
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filas por página:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="border rounded px-2 py-1 text-sm bg-white"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {table.getRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} resultados
          </div>
        </div>
      </div>
    </div>
  )
}