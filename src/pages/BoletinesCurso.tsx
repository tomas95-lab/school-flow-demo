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

  const boletinesCurso = boletines.filter((b) => b.curso === id);
  const course = courses.find((c) => c.firestoreId === id);

  // Get columns for the table
  const columns = useColumnsDetalle();

	if (boletines.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50">
				<h1 className="text-3xl font-bold text-center py-8">No hay boletines disponibles</h1>
			</div>
		);
	}

	const rows: BoletinceRow[] = boletinesCurso.map((b) => {
	const fechaGeneracion = b.fechaGeneracion ? new Date(b.fechaGeneracion).toLocaleDateString('es-ES') : 'N/A';	
	const materias = b.materias.map((m: { T1?: number; T2?: number; T3?: number; t1?: number; t2?: number; t3?: number; nombre: string }) => {
		const v1 = typeof m.T1 === 'number' ? m.T1 : (typeof m.t1 === 'number' ? m.t1 : undefined);
		const v2 = typeof m.T2 === 'number' ? m.T2 : (typeof m.t2 === 'number' ? m.t2 : undefined);
		const v3 = typeof m.T3 === 'number' ? m.T3 : (typeof m.t3 === 'number' ? m.t3 : undefined);
		const tri = parseInt(periodoActual.replace(/.*T(\d)/, '$1'));
		const considerarT1 = tri > 1;
		const considerarT2 = tri > 2;
		const considerarT3 = tri > 3; // no calcular T3 si aún no terminó

		const valores: number[] = [];
		if (considerarT1 && typeof v1 === 'number') valores.push(v1);
		if (considerarT2 && typeof v2 === 'number') valores.push(v2);
		if (considerarT3 && typeof v3 === 'number') valores.push(v3);

		const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
		return {
			nombre: m.nombre,
			t1: v1 ?? 0,
			t2: v2 ?? 0,
			t3: v3 ?? 0,
			promedio,
			observacion: observacionPorPromedio(promedio), // Observación por materia
		};
	});

	const promedioTotal = getPromedioTotal(b.materias, { incluirTrimestreEnCurso: false });

	// Calcular datos de asistencia del alumno
	const asistenciasAlumno = asistencias.filter((a) => 
		a.studentId === b.alumnoId && 
		a.courseId === id
	);
	
	const totalAsistencias = asistenciasAlumno.length;
	const asistenciasPresentes = asistenciasAlumno.filter((a) => a.present).length;
	const porcentajeAsistencia = totalAsistencias > 0 
		? Math.round((asistenciasPresentes / totalAsistencias) * 100) 
		: 0;

	return {
		id: b.alumnoId,
		Nombre: b.alumnoNombre,
		promediototal: promedioTotal,
		estado: b.abierto ? "abierto" : "cerrado",
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
		},
		fechaGeneracion: fechaGeneracion,
	};
	});

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
									<div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
										<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
											División {course?.division}
										</Badge>
										<Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
											Año {course?.año}
										</Badge>
										<Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 shrink-0">
											<span className="hidden xs:inline">Trimestre </span>T{periodoActual}
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
						rows.length
							? (rows.reduce((acc, r) => acc + (r.promediototal ?? 0), 0) / rows.length).toFixed(2)
							: "-"
					}
					icon={Book}
					color="green"
					subtitle="Media aritmética de todas las notas finales."
				/>
				<StatsCard
					label="Alumnos con Bajo Rendimiento"
					value={rows.filter((r) => (r.promediototal ?? 0) <= 6).length}
					icon={Book}
					color="orange"
					subtitle="Cantidad de alumnos con promedio menor a seis."
				/>
				<StatsCard
					label="Top Alumno"
					value={
						rows.length
							? (rows.reduce((max, r) => (r.promediototal ?? -1) > (max.promediototal ?? -1) ? r : max, rows[0]).Nombre || "-")
							: "-"
					}
					icon={Book}
					color="yellow"
					subtitle="Alumno/a con el mayor promedio del periodo."
				/>

			</div>
				<DataTable 
					columns={columns} 
					data={rows} 
					placeholder="boletín"
					exportable={true}
					title="Boletines del Curso"
					description="Lista de boletines académicos de los estudiantes"
					filters={[
						{
							type: "input",
							columnId: "Nombre",
							placeholder: "Buscar estudiante"
						},
						{
							type: "select",
							columnId: "estado",
							label: "Estado",
							placeholder: "Filtrar por estado",
							options: [
								{ label: "Todos", value: "all" },
								{ label: "Abierto", value: "abierto" },
								{ label: "Cerrado", value: "cerrado" }
							]
						},
						{
							type: "select",
							columnId: "observacionGeneral",
							label: "Observación",
							placeholder: "Filtrar por observación",
							options: [
								{ label: "Todas", value: "all" },
								{ label: "Excelente", value: "Excelente" },
								{ label: "Muy Bueno", value: "Muy Bueno" },
								{ label: "Bueno", value: "Bueno" },
								{ label: "Regular", value: "Regular" },
								{ label: "Insuficiente", value: "Insuficiente" }
							]
						},
						{
							type: "button",
							label: "Reprobados",
							variant: "outline",
							onClick: () => {
								// Filtrar estudiantes con promedio menor a 6
								// Esta funcionalidad se implementará con filtros dinámicos en una versión futura
							}
						},
						{
							type: "button",
							label: "Aprobados",
							variant: "outline", 
							onClick: () => {
								// Filtrar estudiantes con promedio mayor o igual a 6
								// Esta funcionalidad se implementará con filtros dinámicos en una versión futura
							}
						}
					]}
				/>
			</div>
		
		</div>

);
}
