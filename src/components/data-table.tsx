"use client"
import { useEffect, useRef, useState } from "react"
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
import * as XLSX from "xlsx"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import ReutilizableDialog from "@/components/DialogReutlizable"


interface ColumnFilter<TData> {
  type: "input" | "button" | "badge" | "select" | "custom"
  columnId?: string
  placeholder?: string
  size?: string
  label?: string
  variant?: "outline" | "ghost" | "default" | "destructive" | "secondary"
  onClick?: (table: Table<TData>) => void
  value?: string | number
  color?: "blue" | "green" | "red" | "yellow" | "gray"
  options?: { label: string; value: string | number }[]
  element?: (table: Table<TData>) => React.ReactNode
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
  // Si el dataset es grande, sugerir paginación mayor o virtualización futura
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

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([])
  const visibleExportableColumns = () => table.getVisibleLeafColumns().filter(c => c.id !== 'select' && c.id !== 'actions')
  const getExportColumns = () => {
    const visible = visibleExportableColumns()
    if (!selectedColumnIds || selectedColumnIds.length === 0) return visible
    const byId = new Set(selectedColumnIds)
    const filtered = visible.filter(col => byId.has(col.id))
    return filtered.length > 0 ? filtered : visible
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null
      const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true')
      if (!isTyping && e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setSelectedColumnIds(visibleExportableColumns().map(c => c.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

  useEffect(() => {
    const openHandler = () => setExportDialogOpen(true)
    const exportHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { format?: 'csv' | 'xlsx' | 'pdf' }
      if (!detail?.format) return
      if (detail.format === 'csv') handleExportCsv()
      if (detail.format === 'xlsx') handleExportXlsx()
      if (detail.format === 'pdf') handleExportPdf()
    }
    window.addEventListener('datatable:open-export', openHandler as EventListener)
    window.addEventListener('datatable:export', exportHandler as EventListener)
    // Registrar funciones globales para apertura rápida desde Command Palette
    ;(window as any).__datatableOpenExport = () => setExportDialogOpen(true)
    ;(window as any).__datatableExport = (format: 'csv'|'xlsx'|'pdf') => {
      if (format === 'csv') handleExportCsv()
      if (format === 'xlsx') handleExportXlsx()
      if (format === 'pdf') handleExportPdf()
    }
    return () => {
      window.removeEventListener('datatable:open-export', openHandler as EventListener)
      window.removeEventListener('datatable:export', exportHandler as EventListener)
      if ((window as any).__datatableOpenExport) delete (window as any).__datatableOpenExport
      if ((window as any).__datatableExport) delete (window as any).__datatableExport
    }
  }, [])

  const handleExportCsv = () => {
    const columns = getExportColumns()
    const headers = columns.map(col => {
      const header = col.columnDef.header
      return typeof header === 'string' ? header : col.id
    })
    const dataRows = table.getRowModel().rows.map(row => columns.map(col => {
      const value = row.getValue(col.id)
      const str = value == null ? '' : String(value)
      const escaped = '"' + str.replace(/"/g, '""') + '"'
      return escaped
    }).join(','))
    const csv = [headers.join(','), ...dataRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${title || 'export'}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportXlsx = () => {
    const columns = getExportColumns()
    const headers = columns.map(col => {
      const header = col.columnDef.header
      return typeof header === 'string' ? header : col.id
    })
    const dataRows = table.getRowModel().rows.map(row => columns.map(col => {
      const value = row.getValue(col.id)
      return value == null ? '' : value
    }))
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${title || 'export'}_${new Date().toISOString().slice(0,10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    const columns = getExportColumns()
    const headers = columns.map(col => {
      const header = col.columnDef.header
      return typeof header === 'string' ? header : col.id
    })
    const dataRows = table.getRowModel().rows.map(row => columns.map(col => {
      const value = row.getValue(col.id)
      return value == null ? '' : String(value)
    }))
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    const autoTable = (autoTableModule as any).default || autoTableModule
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(String(title || 'Exportación'), 14, 18)
    autoTable(doc as any, {
      head: [headers],
      body: dataRows,
      startY: 24,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    })
    const fileName = `${title || 'export'}_${new Date().toISOString().slice(0,10)}.pdf`
    doc.save(fileName)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{columnFilters.length + (globalFilter ? 1 : 0)} filtros activos</Badge>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>Limpiar filtros</Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={`Buscar ${placeholder}...`}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 w-full"
                ref={searchInputRef}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 max-w-full overflow-hidden">
              {exportable && (
                <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)} className="shrink-0 min-w-0">
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Exportar</span>
                  <span className="xs:hidden">Export</span>
                </Button>
              )}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900 shrink-0 min-w-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Limpiar todo</span>
                  <span className="xs:hidden">Limpiar</span>
                </Button>
              )}
            </div>
          </div>

          {filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t max-w-full overflow-hidden">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700 w-full xs:w-auto mb-2 xs:mb-0 shrink-0">
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
                      className={cn("h-8 min-w-0 flex-1 xs:flex-none", filter.size || "xs:max-w-xs max-w-full")}
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
                      className="h-8 shrink-0 min-w-0 px-2 xs:px-3"
                    >
                      <span className="truncate">{filter.label}</span>
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
                    <Badge key={i} className={cn("h-8 px-2 xs:px-3 shrink-0 min-w-0", colors[filter.color || "gray"])}>
                      <span className="truncate">{filter.label}: {filter.value}</span>
                    </Badge>
                  )
                }
                if (filter.type === "select" && filter.columnId && filter.options) {
                    const col = table.getColumn(filter.columnId)
                    return (
                      <div key={i} className="min-w-0 flex-1 xs:flex-none xs:max-w-xs max-w-full">
                        <Select
                          value={(col?.getFilterValue() as string) ?? ""}
                          onValueChange={v => col?.setFilterValue(v)}
                        >
                          <SelectTrigger size="sm" className="w-full min-w-0">
                            <SelectValue placeholder={filter.placeholder || filter.label} />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options.map(o => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  }
                  if (filter.type === "custom" && filter.element) {
                    return (
                      <div key={i} className="min-w-0 flex-1 xs:flex-none xs:max-w-xs max-w-full">
                        {filter.element(table)}
                      </div>
                    )
                  }
                return null
              })}
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-2 flex flex-wrap gap-2 max-w-full overflow-hidden">
              {globalFilter && (
                <Badge
                  variant="outline"
                  className="cursor-pointer shrink-0 min-w-0 max-w-full"
                  onClick={() => setGlobalFilter("")}
                >
                  <span className="truncate">Buscar: {globalFilter}</span> <X className="inline-block w-3 h-3 ml-1 shrink-0" />
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
                    className="cursor-pointer shrink-0 min-w-0 max-w-full"
                    onClick={() => col?.setFilterValue(undefined)}
                  >
                    <span className="truncate">{`${cf.id}: ${displayValue}`}</span> <X className="inline-block w-3 h-3 ml-1 shrink-0" />
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {/* Tabla responsive mejorada */}
        <div className="w-full overflow-x-auto">
          <UiTable className="min-w-full sm:min-w-[600px]">
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
        </div>

        {/* Paginación responsive mejorada */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-3 px-4 border-t bg-gray-50/30">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => table.previousPage()} 
              disabled={!table.getCanPreviousPage()}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">‹ Anterior</span>
              <span className="sm:hidden">‹</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Siguiente ›</span>
              <span className="sm:hidden">›</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 order-last md:order-none">
            <span className="text-sm text-gray-600 text-center sm:text-left">
              Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{" "}
              <strong>{table.getPageCount()}</strong>
            </span>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">Filas por página:</span>
              <span className="text-sm text-gray-600 sm:hidden">Por página:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={e => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="border rounded px-2 py-1 text-sm bg-white min-w-0"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center md:text-right">
            <span className="hidden sm:inline">Mostrando {table.getRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} resultados</span>
            <span className="sm:hidden">{table.getRowModel().rows.length}/{table.getFilteredRowModel().rows.length}</span>
          </div>
        </div>
      </div>
      {exportable && (
        <ReutilizableDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          small={false}
          title={<span>Exportar datos</span>}
          description={`Se exportará la vista actual con filtros y orden aplicado.`}
          content={
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">Columnas a incluir</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleExportableColumns().map(col => {
                    const label = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id
                    const checked = selectedColumnIds.includes(col.id)
                    return (
                      <label key={col.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedColumnIds(prev => e.target.checked ? [...prev, col.id] : prev.filter(id => id !== col.id))
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedColumnIds(visibleExportableColumns().map(c => c.id))}>Seleccionar todo</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedColumnIds([])}>Quitar todo</Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button size="sm" onClick={handleExportCsv} className="w-full sm:w-auto">Exportar CSV</Button>
                <Button size="sm" onClick={handleExportXlsx} className="w-full sm:w-auto">Exportar XLSX</Button>
                <Button size="sm" onClick={handleExportPdf} className="w-full sm:w-auto">Exportar PDF</Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  )
}
