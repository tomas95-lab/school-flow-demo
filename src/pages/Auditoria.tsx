import { useContext, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { AccessDenied } from "@/components/AccessDenied"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { ScrollText, Users, Award, TrendingUp } from "lucide-react"
import * as XLSX from "xlsx"

type AuditLog = {
  firestoreId: string
  action: string
  entity: string
  entityId?: string
  userEmail?: string | null
  userId?: string | null
  createdAt?: any
  details?: any
}

export default function Auditoria() {
  const { user } = useContext(AuthContext)
  void usePermission()
  const canView = user && (user.role === 'admin')
  if (!canView) {
    return <AccessDenied message="No tienes permisos para acceder al módulo de auditoría." />
  }

  const { data: logs } = useFirestoreCollection<AuditLog>('auditLogs', { enableCache: true })

  const columns: ColumnDef<AuditLog>[] = useMemo(() => ([
    { accessorKey: 'createdAt', header: 'Fecha', cell: ({ row }) => row.original.createdAt?.seconds ? new Date(row.original.createdAt.seconds * 1000).toLocaleString('es-AR') : '—' },
    { accessorKey: 'action', header: 'Acción' },
    { accessorKey: 'entity', header: 'Entidad' },
    { accessorKey: 'entityId', header: 'ID' },
    { accessorKey: 'userEmail', header: 'Usuario' },
    { accessorKey: 'details', header: 'Detalles', cell: ({ row }) => <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(row.original.details || {}, null, 2)}</pre> },
  ]), [])

  const exportCSV = () => {
    const header = ['Fecha','Acción','Entidad','ID','Usuario','Detalles']
    const rows = (logs || []).map(l => [
      l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : '',
      l.action, l.entity, l.entityId || '', l.userEmail || '', JSON.stringify(l.details || {})
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'AuditLogs'); XLSX.writeFile(wb, `AuditLogs_${new Date().toISOString().slice(0,10)}.csv`)
  }

  const exportXLSX = () => {
    const header = ['Fecha','Acción','Entidad','ID','Usuario','Detalles']
    const rows = (logs || []).map(l => [
      l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000).toLocaleString('es-AR') : '',
      l.action, l.entity, l.entityId || '', l.userEmail || '', JSON.stringify(l.details || {})
    ])
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'AuditLogs'); XLSX.writeFile(wb, `AuditLogs_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case 'admin': return Users
      case 'docente': return Award
      case 'alumno': return TrendingUp
      default: return ScrollText
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header estilo panel */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                  <ScrollText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Auditoría del Sistema</h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {(() => { const RoleIcon = getRoleIcon(user?.role); return <><RoleIcon className="h-3 w-3 mr-1" />Administrador</>; })()}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">EduNova</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">Registro centralizado de acciones sensibles. Solo visible para administradores.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
              <Button className="bg-gradient-to-r from-slate-700 to-gray-700 hover:from-slate-800 hover:to-gray-800 shadow" onClick={exportXLSX}>Export XLSX</Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Bitácora</CardTitle>
            <CardDescription>Acciones recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<AuditLog, any> columns={columns} data={logs || []} title="Auditoría" description="Bitácora centralizada" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


