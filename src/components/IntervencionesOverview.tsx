import { useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { TrendingDown, AlertTriangle, FileWarning, LineChart } from "lucide-react";
import { CreateAlertModal } from "@/components/CreateAlertModal";

type Student = {
  firestoreId: string
  nombre: string
  apellido: string
  cursoId?: string
}

type Attendance = {
  studentId: string
  courseId?: string
  present: boolean
}

type Calificacion = {
  studentId: string
  valor: number
}

type RiskRow = {
  id: string
  estudiante: string
  curso: string
  promedio: number
  asistencia: number
  riesgo: number
  categoria: "Alto" | "Medio" | "Bajo"
  recomendaciones: string
}

function calcularPromedio(vals: number[]) {
  if (!vals.length) return 0
  const s = vals.reduce((a, b) => a + b, 0)
  return Number((s / vals.length).toFixed(2))
}

function porcentajeAsistencia(atts: Attendance[]) {
  if (!atts.length) return 0
  const pres = atts.filter(a => a.present).length
  return Math.round((pres / atts.length) * 100)
}

function categoriaPorRiesgo(r: number): RiskRow["categoria"] {
  if (r >= 70) return "Alto"
  if (r >= 40) return "Medio"
  return "Bajo"
}

export default function IntervencionesOverview() {
  const { data: students } = useFirestoreCollection<Student>("students")
  const { data: attendances } = useFirestoreCollection<Attendance>("attendances")
  const { data: calificaciones } = useFirestoreCollection<Calificacion>("calificaciones")
  const { data: courses } = useFirestoreCollection<{ firestoreId: string; nombre: string; division?: string; año?: string }>("courses")

  const rows: RiskRow[] = useMemo(() => {
    const courseName = (cid?: string) => {
      const c = courses.find(c => c.firestoreId === cid)
      if (!c) return "—"
      return `${c.nombre}${c.division ? ` - ${c.division}` : ""}${c.año ? ` - ${c.año}` : ""}`
    }

    return students.map(st => {
      const atts = attendances.filter(a => a.studentId === st.firestoreId)
      const califs = calificaciones.filter(c => c.studentId === st.firestoreId)
      const prom = calcularPromedio(califs.map(c => c.valor))
      const asist = porcentajeAsistencia(atts)
      // Score de riesgo (0-100). Más alto = peor.
      // Peso simple: 60% por promedio invertido, 40% por asistencia invertida.
      const promRisk = 100 - Math.min(100, prom * 10)
      const asistRisk = 100 - asist
      const riesgo = Math.round(promRisk * 0.6 + asistRisk * 0.4)

      let recomendaciones = ""
      if (riesgo >= 70) recomendaciones = "Contactar tutor legal, plan de apoyo personalizado y seguimiento semanal."
      else if (riesgo >= 40) recomendaciones = "Refuerzo focalizado y recordatorios de asistencia; feedback quincenal."
      else recomendaciones = "Monitoreo pasivo; reforzar hábitos positivos."

      return {
        id: st.firestoreId,
        estudiante: `${st.nombre} ${st.apellido}`,
        curso: courseName(st.cursoId),
        promedio: prom,
        asistencia: asist,
        riesgo,
        categoria: categoriaPorRiesgo(riesgo),
        recomendaciones,
      }
    }).sort((a, b) => b.riesgo - a.riesgo)
  }, [students, attendances, calificaciones, courses])

  const columns: ColumnDef<RiskRow>[] = [
    { accessorKey: "estudiante", header: "Estudiante" },
    { accessorKey: "curso", header: "Curso" },
    { accessorKey: "promedio", header: "Promedio", cell: ({ row }) => (
      <span className={row.original.promedio >= 7 ? "text-green-700" : row.original.promedio >= 6 ? "text-amber-700" : "text-red-700"}>
        {row.original.promedio.toFixed(2)}
      </span>
    ) },
    { accessorKey: "asistencia", header: "Asistencia", cell: ({ row }) => (
      <span className={row.original.asistencia >= 85 ? "text-green-700" : row.original.asistencia >= 75 ? "text-amber-700" : "text-red-700"}>
        {row.original.asistencia}%
      </span>
    ) },
    { accessorKey: "categoria", header: "Riesgo", cell: ({ row }) => (
      <Badge className={row.original.categoria === "Alto" ? "bg-red-100 text-red-700" : row.original.categoria === "Medio" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}>
        {row.original.categoria}
      </Badge>
    ) },
    { accessorKey: "recomendaciones", header: "Recomendación" },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const alumnoNombre = row.original.estudiante
        const alumnoId = row.original.id
        const prioridad = row.original.categoria === 'Alto' ? 'high' : row.original.categoria === 'Medio' ? 'medium' : 'low'
        const sugTitle = `Intervención por riesgo ${row.original.categoria}`
        const sugDesc = `Se detectó riesgo ${row.original.categoria} para ${alumnoNombre}. Promedio ${row.original.promedio.toFixed(2)}, asistencia ${row.original.asistencia}%. Recomendación: ${row.original.recomendaciones}`
        return (
          <div className="flex items-center gap-2">
            <CreateAlertModal
              studentId={alumnoId}
              studentName={alumnoNombre}
              suggestedPriority={prioridad as any}
              suggestedTitle={sugTitle}
              suggestedDescription={sugDesc}
              trigger={(
                <Button size="sm" variant="outline" type="button">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Crear alerta
                </Button>
              )}
            />
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-0 shadow-sm h-auto">
        <CardHeader className="pb-0 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl break-words">
                  <span className="hidden sm:inline">Intervenciones Inteligentes</span>
                  <span className="sm:hidden">Intervenciones IA</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  <span className="hidden sm:inline">Detecta estudiantes en riesgo y sugiere acciones concretas.</span>
                  <span className="sm:hidden">Detecta estudiantes en riesgo.</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{rows.length} 
                <span className="hidden xs:inline"> estudiantes</span>
                <span className="xs:hidden"> est.</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="h-8 text-xs px-2 sm:px-3">
                <LineChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <DataTable<RiskRow, any>
        columns={columns}
        data={rows}
        placeholder="estudiante"
        exportable
        title="Intervenciones"
        description="Vista priorizada por riesgo"
        filters={[
          { type: "input", columnId: "estudiante", placeholder: "Nombre" },
          { type: "input", columnId: "curso", placeholder: "Curso" },
          { type: "select", columnId: "categoria", label: "Riesgo", options: [
            { label: "Alto", value: "Alto" },
            { label: "Medio", value: "Medio" },
            { label: "Bajo", value: "Bajo" },
          ] },
        ]}
      />

      <Card className="border bg-red-50 h-auto">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><FileWarning className="h-5 w-5 text-red-700" /></div>
            <div>
              <h3 className="font-medium text-red-900">Cómo se calcula el riesgo</h3>
              <p className="text-sm text-red-800 mt-1">Se pondera 60% el promedio académico (inverso) y 40% la asistencia (inversa). Puedes exportar esta vista y actuar desde Alertas o Mensajes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


