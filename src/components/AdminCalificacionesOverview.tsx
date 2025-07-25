import { useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { StatsCard } from "./StatCards";
import { CourseCard } from "./CourseCard";
import { Percent, TriangleAlert } from "lucide-react";

export default function AdminCalificacionesOverview() {
  const { data: courses } = useFirestoreCollection("courses");
  const { data: subjects } = useFirestoreCollection("subjects");
  const { data: calificaciones } = useFirestoreCollection("calificaciones");

  const averageGrade = useMemo(() => {
    if (!calificaciones.length) return "Sin datos";
    const total = calificaciones.reduce(
      (sum: number, calificacion) => sum + (calificacion.valor || 0),
      0
    );
    return (total / calificaciones.length).toFixed(2);
  }, [calificaciones]);

  const [pctAprob, pctReprob] = useMemo(() => {
    const total = calificaciones.length;
    if (!total) return ["Sin datos", "Sin datos"];
    const aprobCount = calificaciones.filter(c => c.valor >= 7).length;
    const pctA = ((aprobCount / total) * 100).toFixed(2);
    const pctR = (100 - parseFloat(pctA)).toFixed(2);
    return [pctA, pctR];
  }, [calificaciones]);

  // Early return after all hooks
  if (!courses || !subjects || !calificaciones) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatsCard
            label="Promedio de calificaciones"
            value={averageGrade}
            icon={Percent}
            subtitle="Promedio general de todas las calificaciones • Escala: 0-10"
            />
        <StatsCard
            label="% Aprobados"
            value={pctAprob}
            icon={Percent}
            color="green"
            subtitle="Porcentaje de estudiantes aprobados (nota ≥ 7)"
            />
        <StatsCard
            label="% Reprobados"
            value={pctReprob}
            icon={Percent}
            color="red"
            subtitle="Porcentaje de estudiantes reprobados (nota < 7)"
            />
        <StatsCard
            label="Materias en Riesgo"
            value={
                subjects.filter(sub => {
                    const notas = calificaciones
                    .filter(c => c.subjectId === sub.firestoreId)
                    .map(c => c.valor);
                    const avg = notas.length
                    ? notas.reduce((s, n) => s + n, 0) / notas.length
                    : 0;
                    return avg < 6;
                }).length
            }
            icon={TriangleAlert}
            color="red"
            subtitle="Materias con promedio menor a 6"
            />
        </div>
        <div className="m-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    Todos los Cursos ({courses.length})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Todos los cursos activos</span>
                </div>
            </div>
            <p className="text-gray-600 mt-1">
            Administra cursos, revisa calificaciones y gestiona información académica
            </p>
        </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
                    <CourseCard
                        key={course.firestoreId}
                        course={{
                            ...course,
                            nombre: course.nombre,
                            division: course.division,
                            firestoreId: course.firestoreId || '',
                        }}
                        descripcion="Ver y gestionar calificaciones"
                        link={`/calificaciones/detalles?id=${course.firestoreId}`}
                    />
                ))}
            </div>
        </div>
  );
}
