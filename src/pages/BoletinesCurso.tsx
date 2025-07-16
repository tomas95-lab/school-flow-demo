import { DataTable } from "@/components/data-table";
import { StatsCard } from "@/components/StatCards";
import { Badge } from "@/components/ui/badge";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { getPeriodoActual, getPromedioTotal, observacionPorPromedio } from "@/utils/boletines";
import { Book, BookOpen } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useColumnsDetalle, type BoletinceRow } from "@/app/boletines/colums";

export default function BoletinesCurso() {
  const { data: courses } = useFirestoreCollection("courses");
  const { data: boletines } = useFirestoreCollection("boletines");
  const { data: asistencias } = useFirestoreCollection("attendances");
  const [searchParams] = useSearchParams();

  const [id] = useState(searchParams.get("id") || "");
  const periodoActual = (getPeriodoActual()).split("T")[1];

  const boletinesCurso = boletines.filter((b: any) => b.curso ==id);
  const course = courses.find((c: any) => c.firestoreId === id);

	if (boletines.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<h1 className="text-3xl font-bold text-center py-8">No hay boletines disponibles</h1>
			</div>
		);
	}

	const rows: BoletinceRow[] = boletinesCurso.map((b: any) => {
	const materias = b.materias.map((m: any) => {
		const promedio = (m.T1 + m.T2 + m.T3) / 3 || 0;
		return {
			nombre: m.nombre,
			t1: m.T1,
			t2: m.T2,
			t3: m.T3,
			promedio,
			observacion: observacionPorPromedio(promedio), // Observación por materia
		};
	});

	const promedioTotal = getPromedioTotal(b.materias);

	// Calcular datos de asistencia del alumno
	const asistenciasAlumno = asistencias.filter((a: any) => 
		a.studentId === b.alumnoId && 
		a.courseId === id
	);
	
	const totalAsistencias = asistenciasAlumno.length;
	const asistenciasPresentes = asistenciasAlumno.filter((a: any) => a.present).length;
	const porcentajeAsistencia = totalAsistencias > 0 
		? Math.round((asistenciasPresentes / totalAsistencias) * 100) 
		: 0;

	return {
		id: b.alumnoId,
		Nombre: b.alumnoNombre,
		promediototal: promedioTotal,
		estado: b.abierto ? "abierto" : "cerrado",
		alertas: b.alertas?.length || 0,
		periodo: b.periodo,
		materias,
		comentario: b.comentario || "",
		observacionGeneral: observacionPorPromedio(promedioTotal), // Observación global del boletín
		// Datos de asistencia
		asistencia: {
			total: totalAsistencias,
			presentes: asistenciasPresentes,
			ausentes: totalAsistencias - asistenciasPresentes,
			porcentaje: porcentajeAsistencia
		}
	};
	});

	console.log("Boletines del curso:", boletinesCurso);
  return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
			<div className="p-6 max-w-7xl mx-auto space-y-6">
				{/* Header mejorado */}
				<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
					<div className="flex flex-col lg:flex-row lg:justify-between gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 rounded-lg">
									<BookOpen className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<h1 className="text-3xl font-bold text-gray-900">{course?.nombre}</h1>
									<div className="flex items-center gap-2 mt-1">
										<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
											División {course?.division}
										</Badge>
										<Badge variant="outline" className="bg-gray-50 text-gray-700">
											Año {course?.año}
										</Badge>
										<Badge variant="outline" className="bg-gray-50 text-gray-700">
											Trimestre {periodoActual}
										</Badge>
									</div>
								</div>
							</div>
							<p className="text-gray-600 ml-12">
								Gestión completa de asistencias
							</p>
						</div>

					</div>
				</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatsCard
					label="Boletines Generados"
					value={boletinesCurso.length}
					icon={BookOpen}
					color="blue"
					subtitle="Total de boletines de este curso generados."
				/>
				<StatsCard
					label="Promedio General"
					value={
						boletinesCurso.length
							? (
									boletinesCurso.reduce((acc: number, b: any) => acc + (b.promedioTotal ?? 0), 0) /
									boletinesCurso.length
								).toFixed(2)
							: "-"
					}
					icon={Book}
					color="green"
					subtitle="Media aritmética de todas las notas finales."
				/>
				<StatsCard
					label="Alumnos con Bajo Rendimiento"
					value={boletinesCurso.filter((b: any) => b.promedioTotal <= 6).length}
					icon={Book}
					color="orange"
					subtitle="Cantidad de alumnos con promedio menor a seis."
				/>
				<StatsCard
					label="Top Alumno"
					value={
						boletinesCurso.length
							? boletinesCurso.reduce((max: any, b: any) =>
									b.promedioTotal > (max.promedioTotal ?? -1) ? b : max,
								{}).alumnoNombre || "-"
							: "-"
					}
					icon={Book}
					color="yellow"
					subtitle="Alumno/a con el mayor promedio del periodo."
				/>

			</div>
				<DataTable columns={useColumnsDetalle(null)} data={rows} />
			</div>
		
		</div>

);
}