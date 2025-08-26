import { useMemo, useState } from "react"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BarChartComponent, PieChartComponent } from "@/components/charts"
import { CreateAlertModal } from "@/components/CreateAlertModal"
import { Download, Search, User, Users, Bell } from "lucide-react"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Student = { firestoreId: string; nombre: string; apellido: string; cursoId?: string }
type Course = { firestoreId: string; nombre: string; division?: string; año?: string }
type Grade = { studentId: string; courseId?: string; subjectId?: string; valor: number; fecha?: string }
type Attendance = { studentId: string; courseId?: string; date?: string; fecha?: string; present: boolean }
type Subject = { firestoreId: string; nombre: string; cursoId?: string }
type Alert = { createdAt?: string; priority?: string; title?: string; description?: string; studentId?: string }
type Announcement = { createdAt?: string; title?: string; content?: string }

export default function Panel360() {
	const [query, setQuery] = useState("")
	const [mode, setMode] = useState<'alumno' | 'curso'>('alumno')
	const [selectedId, setSelectedId] = useState<string>("")

	const { data: students } = useFirestoreCollection<Student>("students")
	const { data: courses } = useFirestoreCollection<Course>("courses")
	const { data: subjects } = useFirestoreCollection<Subject>("subjects")
	const { data: calificaciones } = useFirestoreCollection<Grade>("calificaciones", { enableCache: true })
	const { data: asistencias } = useFirestoreCollection<Attendance>("attendances", { enableCache: true })
	const { data: alerts } = useFirestoreCollection<Alert>("alerts", { enableCache: true })
	const { data: announcements } = useFirestoreCollection<Announcement>("announcements", { enableCache: true })

	// Normaliza distintos formatos de fecha (Firestore Timestamp, string, number, Date)
	const normalizeDate = (value: any): string | undefined => {
		if (!value) return undefined
		try {
			if (typeof value === 'object') {
				if ('toDate' in value && typeof (value as any).toDate === 'function') {
					const d = (value as any).toDate()
					return isNaN(d.getTime()) ? undefined : d.toISOString()
				}
				if ('seconds' in value && typeof (value as any).seconds === 'number') {
					const d = new Date((value as any).seconds * 1000)
					return isNaN(d.getTime()) ? undefined : d.toISOString()
				}
				if (value instanceof Date) {
					return isNaN(value.getTime()) ? undefined : value.toISOString()
				}
			}
			const d = new Date(value)
			return isNaN(d.getTime()) ? undefined : d.toISOString()
		} catch {
			return undefined
		}
	}

	const filteredStudents = useMemo(() => {
		const q = query.trim().toLowerCase()
		return (students || []).filter(s => `${s.nombre} ${s.apellido}`.toLowerCase().includes(q)).slice(0, 8)
	}, [students, query])

	const filteredCourses = useMemo(() => {
		const q = query.trim().toLowerCase()
		return (courses || []).filter(c => `${c.nombre} ${c.division || ''}`.toLowerCase().includes(q)).slice(0, 8)
	}, [courses, query])

	const context = useMemo(() => {
		if (!selectedId) return null
		if (mode === 'alumno') {
			const student = (students || []).find(s => s.firestoreId === selectedId)
			if (!student) return null
			const grades = (calificaciones || []).filter(g => g.studentId === student.firestoreId)
			const atts = (asistencias || []).filter(a => a.studentId === student.firestoreId)
			const studentSubjects = (subjects || []).filter(s => s.cursoId === student.cursoId)
			const myAvg = grades.length ? (grades.reduce((s, g) => s + (g.valor || 0), 0) / grades.length) : 0
			const present = atts.filter(a => a.present).length
			const myAtt = atts.length ? Math.round((present / atts.length) * 100) : 0
			const approved = studentSubjects.filter(sub => {
				const sg = grades.filter(g => g.subjectId === sub.firestoreId)
				if (!sg.length) return false
				const avg = sg.reduce((s, g) => s + (g.valor || 0), 0) / sg.length
				return avg >= 7
			}).length
			const alertsFor = (alerts || []).filter(a => a.studentId === student.firestoreId)
			// Charts
			const perfBySubject = studentSubjects.map(sub => {
				const sg = grades.filter(g => g.subjectId === sub.firestoreId)
				const avg = sg.length ? (sg.reduce((s, g) => s + (g.valor || 0), 0) / sg.length) : 0
				return { materia: sub.nombre, promedio: Number(avg.toFixed(1)) }
			}).filter(r => r.promedio > 0)
			const gradeDist = [
				{ rango: '≥9', cantidad: grades.filter(g => g.valor >= 9).length },
				{ rango: '7-8.9', cantidad: grades.filter(g => g.valor >= 7 && g.valor < 9).length },
				{ rango: '6-6.9', cantidad: grades.filter(g => g.valor >= 6 && g.valor < 7).length },
				{ rango: '<6', cantidad: grades.filter(g => g.valor < 6).length },
			].filter(x => x.cantidad > 0)
			const attDist = [
				{ estado: 'Presente', cantidad: present },
				{ estado: 'Ausente', cantidad: atts.length - present },
			]
			const timeline = [
				...grades.map(g => ({ type: 'grade', date: normalizeDate((g as any).fecha), title: `Nota ${g.valor}`, description: `Evaluación`, color: '#2563eb' })),
				...atts.map(a => ({ type: 'attendance', date: normalizeDate((a as any).fecha ?? (a as any).date), title: a.present ? 'Asistencia' : 'Ausencia', description: a.courseId || '', color: a.present ? '#10b981' : '#ef4444' })),
				...alertsFor.map(al => ({ type: 'alert', date: normalizeDate((al as any).createdAt), title: al.title || 'Alerta', description: al.description || '', color: '#f59e0b' })),
				...(announcements || []).map(an => ({ type: 'announcement', date: normalizeDate((an as any).createdAt), title: an.title || 'Anuncio', description: an.content || '', color: '#64748b' })),
			].filter(e => e.date).sort((a,b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()).slice(0, 20)
			return { kind: 'student' as const, student, myAvg, myAtt, approved, alertsCount: alertsFor.length, perfBySubject, gradeDist, attDist, timeline }
		}
		const course = (courses || []).find(c => c.firestoreId === selectedId)
		if (!course) return null
		const grades = (calificaciones || []).filter(g => g.courseId === course.firestoreId)
		const atts = (asistencias || []).filter(a => a.courseId === course.firestoreId)
		const avg = grades.length ? (grades.reduce((s, g) => s + (g.valor || 0), 0) / grades.length) : 0
		const present = atts.filter(a => a.present).length
		const att = atts.length ? Math.round((present / atts.length) * 100) : 0
		const courseSubjects = (subjects || []).filter(s => s.cursoId === course.firestoreId)
		const perfBySubject = courseSubjects.map(sub => {
			const sg = grades.filter(g => g.subjectId === sub.firestoreId)
			const avgS = sg.length ? (sg.reduce((s, g) => s + (g.valor || 0), 0) / sg.length) : 0
			return { materia: sub.nombre, promedio: Number(avgS.toFixed(1)) }
		}).filter(r => r.promedio > 0)
		const gradeDist = [
			{ rango: '≥9', cantidad: grades.filter(g => g.valor >= 9).length },
			{ rango: '7-8.9', cantidad: grades.filter(g => g.valor >= 7 && g.valor < 9).length },
			{ rango: '6-6.9', cantidad: grades.filter(g => g.valor >= 6 && g.valor < 7).length },
			{ rango: '<6', cantidad: grades.filter(g => g.valor < 6).length },
		].filter(x => x.cantidad > 0)
		const attDist = [ { estado: 'Presente', cantidad: present }, { estado: 'Ausente', cantidad: atts.length - present } ]
		const timeline = [
			...grades.map(g => ({ type: 'grade', date: normalizeDate((g as any).fecha), title: `Nota ${g.valor}`, description: `Evaluación`, color: '#2563eb' })),
			...atts.map(a => ({ type: 'attendance', date: normalizeDate((a as any).fecha ?? (a as any).date), title: a.present ? 'Asistencia' : 'Ausencia', description: a.courseId || '', color: a.present ? '#10b981' : '#ef4444' })),
			...(alerts || []).map(al => ({ type: 'alert', date: normalizeDate((al as any).createdAt), title: al.title || 'Alerta', description: al.description || '', color: '#f59e0b' })),
			...(announcements || []).map(an => ({ type: 'announcement', date: normalizeDate((an as any).createdAt), title: an.title || 'Anuncio', description: an.content || '', color: '#64748b' })),
		].filter(e => e.date).sort((a,b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()).slice(0, 20)
		return { kind: 'course' as const, course, avg, att, perfBySubject, gradeDist, attDist, timeline }
	}, [selectedId, mode, students, courses, subjects, calificaciones, asistencias, alerts, announcements])

	const exportPDF = () => {
		if (!context) return
		const doc = new jsPDF()
		doc.setFontSize(16)
		doc.text('Informe 360', 14, 18)
		doc.setFontSize(11)
		if (context.kind === 'student') {
			doc.text(`${context.student.nombre} ${context.student.apellido}`, 14, 26)
			doc.text(`Promedio: ${context.myAvg.toFixed(2)}  •  Asistencia: ${context.myAtt}%  •  Aprobadas: ${context.approved}  •  Alertas: ${context.alertsCount}`, 14, 33)
		} else {
			const c = context.course
			doc.text(`${c.nombre}${c.division ? ' - ' + c.division : ''}`, 14, 26)
			doc.text(`Promedio: ${context.avg.toFixed(2)}  •  Asistencia: ${context.att}%`, 14, 33)
		}
		const head = [['Fecha','Tipo','Título','Descripción']]
		const body = context.timeline.slice(0, 15).map(e => [String(e.date || ''), e.type, e.title, e.description])
		autoTable(doc as any, { head, body, startY: 40, styles: { fontSize: 9 } })
		doc.save('Informe_360.pdf')
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto p-6 space-y-6">
				<Card className="bg-white border-gray-200">
					<CardHeader>
						<CardTitle>Panel 360</CardTitle>
						<CardDescription>Busca un alumno o curso y accede a su estado 360</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-4 max-w-full overflow-hidden">
							<div className="flex-1 min-w-0">
								<label className="text-sm text-gray-700">Buscar</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0" />
									<Input className="pl-9 w-full" placeholder={mode === 'alumno' ? 'Nombre del alumno' : 'Nombre del curso'} value={query} onChange={e => setQuery(e.target.value)} />
								</div>
								{(query.length > 1) && (
									<div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
										{(mode === 'alumno' ? filteredStudents : filteredCourses).map(item => (
											<Button 
												key={(item as any).firestoreId} 
												variant={selectedId === (item as any).firestoreId ? 'default' : 'outline'} 
												size="sm" 
												onClick={() => setSelectedId((item as any).firestoreId)}
												className="btn-responsive w-full text-left justify-start"
											>
												{mode === 'alumno' ? `${(item as Student).nombre} ${(item as Student).apellido}` : `${(item as Course).nombre} ${(item as Course).division || ''}`}
											</Button>
										))}
									</div>
								)}
							</div>
							<div className="btn-container">
								<Button 
									variant={mode === 'alumno' ? 'default' : 'outline'} 
									onClick={() => { setMode('alumno'); setSelectedId("") }}
									className="btn-responsive flex-1 xs:flex-none"
								>
									<User className="w-4 h-4 mr-1 shrink-0" /> 
									<span className="btn-text-xs">Alumno</span>
								</Button>
								<Button 
									variant={mode === 'curso' ? 'default' : 'outline'} 
									onClick={() => { setMode('curso'); setSelectedId("") }}
									className="btn-responsive flex-1 xs:flex-none"
								>
									<Users className="w-4 h-4 mr-1 shrink-0" /> 
									<span className="btn-text-xs">Curso</span>
								</Button>
							</div>
							<div className="flex gap-2">
								{context && (
									<>
										<Button variant="outline" onClick={exportPDF}><Download className="w-4 h-4 mr-1" /> Exportar PDF</Button>
										<CreateAlertModal trigger={<Button variant="outline"><Bell className="w-4 h-4 mr-1" /> Crear alerta</Button>} studentId={(context as any).student?.firestoreId} suggestedTitle={context?.kind === 'student' ? `Intervención ${((context as any).myAvg || 0) < 7 ? 'por riesgo' : 'de seguimiento'}` : undefined} suggestedDescription={context?.kind === 'student' ? `Promedio ${(context as any).myAvg?.toFixed(2)} • Asistencia ${(context as any).myAtt}%` : undefined} />
									</>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{context && (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 space-y-6 h-max">
							<Card>
								<CardContent className="pt-6">
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center p-3 rounded-lg bg-blue-50">
											<div className="text-xs text-blue-600">Promedio</div>
											<div className="text-2xl font-bold text-blue-800">{(context as any).myAvg?.toFixed ? (context as any).myAvg.toFixed(1) : (context as any).avg?.toFixed ? (context as any).avg.toFixed(1) : '0.0'}</div>
										</div>
										<div className="text-center p-3 rounded-lg bg-emerald-50">
											<div className="text-xs text-emerald-600">Asistencia</div>
											<div className="text-2xl font-bold text-emerald-800">{(context as any).myAtt ?? (context as any).att ?? 0}%</div>
										</div>
										<div className="text-center p-3 rounded-lg bg-purple-50">
											<div className="text-xs text-purple-600">Aprobadas</div>
											<div className="text-2xl font-bold text-purple-800">{(context as any).approved ?? '-'}</div>
										</div>
										<div className="text-center p-3 rounded-lg bg-rose-50">
											<div className="text-xs text-rose-600">Alertas</div>
											<div className="text-2xl font-bold text-rose-800">{(context as any).alertsCount ?? (alerts || []).length}</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card className="p-4">
									<BarChartComponent data={(context as any).perfBySubject || []} xKey="materia" yKey="promedio" title="Rendimiento por Materia" description="Promedio por materia" className="h-80" />
								</Card>
								<Card className="p-4">
									<PieChartComponent data={(context as any).gradeDist || []} dataKey="cantidad" nameKey="rango" title="Distribución de Calificaciones" description="Por rangos" className="h-80" />
								</Card>
								<Card className="p-4 md:col-span-2">
									<PieChartComponent data={(context as any).attDist || []} dataKey="cantidad" nameKey="estado" title="Distribución de Asistencias" description="Presentes/Ausentes" className="h-80" colors={["#10b981", "#ef4444"]} />
								</Card>
							</div>
						</div>

						<div className="space-y-6">
							<Card>
								<CardHeader className="pb-2">
									<CardTitle>Timeline</CardTitle>
									<CardDescription>Eventos recientes</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{(context as any).timeline.map((e: any, idx: number) => (
											<div key={idx} className="flex items-start gap-3">
												<div className="w-2 h-2 rounded-full mt-2" style={{ background: e.color }} />
												<div>
													<div className="text-sm text-gray-500">{new Date(e.date as string).toLocaleString('es-AR')}</div>
													<div className="font-medium text-gray-900">{e.title}</div>
													<div className="text-sm text-gray-600">{e.description}</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}


