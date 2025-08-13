import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebaseConfig"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, ArrowLeft, CreditCard } from "lucide-react"

type Invoice = {
  id: string
  alumnoNombre?: string
  total: number
  currency?: string
  status: 'pending'|'paid'|'failed'
  description?: string
  dueDate?: string
}

export default function PagoSimulado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'paid'|'failed'|null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const snap = await getDoc(doc(db, 'invoices', id))
      if (snap.exists()) setInvoice({ id, ...(snap.data() as any) })
      setLoading(false)
    }
    load()
  }, [id])

  const mark = async (status: 'paid'|'failed') => {
    if (!id) return
    setSaving(status)
    try {
      await updateDoc(doc(db, 'invoices', id), {
        status,
        updatedAt: serverTimestamp(),
        ...(status === 'paid' ? { paidAt: serverTimestamp(), method: 'simulado' } : {})
      })
      navigate('/app/finanzas')
    } finally { setSaving(null) }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando...</div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Factura no encontrada</div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pago Simulado</h1>
            <p className="text-gray-600">Actualiza el estado de una factura en el entorno de demostración.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Factura</CardTitle>
            <CardDescription>Información y acciones de simulación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">Factura</div>
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{invoice.alumnoNombre || 'Alumno'}</div>
                  <div className="text-sm text-gray-600">{invoice.description || '—'}</div>
                </div>
                <div className="text-xl font-bold">{(new Intl.NumberFormat('es-AR', { style: 'currency', currency: invoice.currency || 'ARS' })).format(Number(invoice.total || 0))}</div>
              </div>
              <div className="mt-3 text-sm flex items-center gap-2">Estado:
                {invoice.status === 'paid' ? <Badge variant="success">Pagado</Badge> : invoice.status === 'failed' ? <Badge variant="destructive">Fallido</Badge> : <Badge variant="outline" className="text-amber-700 border-amber-300">Pendiente</Badge>}
              </div>
              {invoice.dueDate && <div className="text-sm text-gray-600">Vence: {invoice.dueDate}</div>}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => mark('paid')} disabled={saving !== null} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                <CheckCircle className="h-4 w-4 mr-1" /> Marcar Pagado
              </Button>
              <Button variant="outline" onClick={() => mark('failed')} disabled={saving !== null}>
                <XCircle className="h-4 w-4 mr-1" /> Marcar Fallido
              </Button>
              <Button variant="ghost" onClick={() => navigate('/app/finanzas')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


