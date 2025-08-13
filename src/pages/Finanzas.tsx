import { useContext, useMemo, useState } from "react"
import { AuthContext } from "@/context/AuthContext"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/StatCards"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Download, Plus, ExternalLink, CreditCard, Users, Award, TrendingUp, CheckCircle, XCircle, Clock, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { db } from "@/firebaseConfig"
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import * as XLSX from "xlsx"

type Student = { firestoreId: string; nombre: string; apellido: string }
type Invoice = { id?: string; alumnoId?: string; alumnoNombre?: string; total: number; currency: string; status: 'pending'|'paid'|'failed'; description?: string; createdAt?: any; dueDate?: string }

export default function Finanzas() {
  const { user } = useContext(AuthContext)
  const { data: students } = useFirestoreCollection<Student>('students')
  const { data: invoicesRaw } = useFirestoreCollection<any>('invoices', { enableCache: true })

  const invoices: Invoice[] = useMemo(() => (invoicesRaw || []).map((d: any) => ({ id: d.firestoreId, ...d })), [invoicesRaw])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Invoice>({ total: 0, currency: 'ARS', status: 'pending' })

  const currencyFormatter = (amount: number, currency?: string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 2 }).format(Number(amount || 0))

  const stats = useMemo(() => {
    const total = invoices.length
    const paid = invoices.filter(i => i.status === 'paid')
    const pending = invoices.filter(i => i.status === 'pending')
    const failed = invoices.filter(i => i.status === 'failed')
    const paidAmount = paid.reduce((acc, i) => acc + Number(i.total || 0), 0)
    const pendingAmount = pending.reduce((acc, i) => acc + Number(i.total || 0), 0)
    return { total, paid: paid.length, pending: pending.length, failed: failed.length, paidAmount, pendingAmount }
  }, [invoices])

  const getRoleMessage = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'Emite, gestiona y analiza el estado financiero de tu institución.'
      case 'docente':
        return 'Consulta y controla pagos relacionados con tus cursos.'
      case 'alumno':
        return 'Revisa tus facturas y estados de pago.'
      default:
        return 'Panel de gestión financiera de EduNova.'
    }
  }

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return Users
      case 'docente':
        return Award
      case 'alumno':
        return TrendingUp
      default:
        return CreditCard
    }
  }

  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: 'alumnoNombre', header: 'Alumno' },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => (
      <div className="font-medium">{currencyFormatter(row.original.total, row.original.currency)}</div>
    ) },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      row.original.status === 'paid' ? (
        <Badge variant="success">Pagado</Badge>
      ) : row.original.status === 'failed' ? (
        <Badge variant="destructive">Fallido</Badge>
      ) : (
        <Badge variant="outline" className="text-amber-700 border-amber-300">Pendiente</Badge>
      )
    ) },
    { accessorKey: 'dueDate', header: 'Vencimiento', cell: ({ row }) => (
      <span className="text-gray-600">{row.original.dueDate || '—'}</span>
    ) },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" variant="outline" disabled aria-disabled="true">
                  <Lock className="h-4 w-4 mr-1" /> Link de pago
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>En desarrollo</TooltipContent>
          </Tooltip>
          {row.original.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => window.open(`/app/pago/${row.original.id}`, '_blank') }>
              <ExternalLink className="h-4 w-4 mr-1" /> Simular
            </Button>
          )}
        </div>
      )
    }
  ]

  // Link de pago bloqueado en MVP

  const exportXlsx = () => {
    const headers = ['Alumno','Total','Moneda','Estado','Vence']
    const rows = invoices.map(i => [i.alumnoNombre, i.total, i.currency, i.status, i.dueDate || ''])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Facturas'); XLSX.writeFile(wb, `Facturas_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const createInvoice = async () => {
    if (!form.alumnoId || !form.total) return
    setCreating(true)
    try {
      const student = (students || []).find(s => s.firestoreId === form.alumnoId)
      const payload: any = { alumnoId: form.alumnoId, alumnoNombre: student ? `${student.nombre} ${student.apellido}` : '', total: Number(form.total), currency: form.currency || 'ARS', status: 'pending', description: form.description || '', dueDate: form.dueDate || '', createdAt: serverTimestamp() }
      const ref = await addDoc(collection(db, 'invoices'), payload)
      await updateDoc(doc(db, 'invoices', ref.id), { id: ref.id })
      setForm({ total: 0, currency: 'ARS', status: 'pending' })
    } finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    Panel de Finanzas
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {(() => { const RoleIcon = getRoleIcon(user?.role); return <><RoleIcon className="h-3 w-3 mr-1" />{user?.role === 'admin' && 'Administrador'}{user?.role === 'docente' && 'Docente'}{user?.role === 'alumno' && 'Estudiante'}</>; })()}
                    </Badge>
                    <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">EduNova</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl">
                {getRoleMessage(user?.role)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportXlsx} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                <Download className="h-4 w-4 mr-1" /> Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard icon={CreditCard} label="Facturas" value={stats.total} color="indigo" />
          <StatsCard icon={Clock} label="Pendientes" value={stats.pending} color="orange" />
          <StatsCard icon={CheckCircle} label="Pagadas" value={stats.paid} color="emerald" />
          <StatsCard icon={XCircle} label="Fallidas" value={stats.failed} color="red" />
          <StatsCard icon={CreditCard} label="Monto cobrado" value={currencyFormatter(stats.paidAmount, 'ARS')} color="emerald" />
          <StatsCard icon={CreditCard} label="Monto pendiente" value={currencyFormatter(stats.pendingAmount, 'ARS')} color="orange" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Nueva Factura</CardTitle>
            <CardDescription>Emite una factura para simular pagos en el MVP.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Alumno</label>
                <Select value={form.alumnoId || ''} onValueChange={(v) => setForm(f => ({ ...f, alumnoId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona alumno" /></SelectTrigger>
                  <SelectContent>
                    {(students || []).map(s => (
                      <SelectItem key={s.firestoreId} value={s.firestoreId}>{s.nombre} {s.apellido}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Total ({form.currency || 'ARS'})</label>
                <Input step="0.01" type="number" value={form.total || 0} onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm text-gray-700">Vencimiento</label>
                <Input type="date" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="md:col-span-4">
                <label className="text-sm text-gray-700">Descripción</label>
                <Input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button onClick={createInvoice} disabled={creating || !form.alumnoId || !form.total} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-1" /> Emitir factura
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<Invoice, any> columns={columns} data={invoices} exportable title="Facturas" description="Listado de facturas simuladas" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


