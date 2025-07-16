import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, TriangleAlert } from "lucide-react";
import { db } from "@/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "./ui/button";
import {
  getPeriodoActual,
  filtrarCalificacionesTrimestre,
  calcPromedio,
  getPromedioPorMateria,
  getPromedioTotal,
  getPromedioPorMateriaPorTrimestre,
} from "@/utils/boletines";

interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
}

export default function AdminBoletinesOverview() {
  const { data: courses } = useFirestoreCollection("courses");
  const { data: subjects } = useFirestoreCollection("subjects");
  const { data: calificaciones } = useFirestoreCollection("calificaciones");
  const { data: boletines } = useFirestoreCollection("boletines");
  const { data: alumnos } = useFirestoreCollection("students");
  const { data: teachers } = useFirestoreCollection("teachers");

  if (!courses || !subjects || !calificaciones || !alumnos || !teachers) {
    return <div>Cargando...</div>;
  }

  const periodoActual = getPeriodoActual();
  const calificacionesTrimestre = filtrarCalificacionesTrimestre(calificaciones);

  const boletinesCalculados = alumnos.map((alumno: any) => {
  const materias = getPromedioPorMateriaPorTrimestre(
    calificacionesTrimestre,
    subjects,
    alumno.firestoreId
  );

    const promedioTotal = getPromedioTotal(materias);

    return {
      alumnoId: alumno.firestoreId,
      alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
      periodo: periodoActual,
      materias,
      curso: alumno.cursoId || "Sin curso",
      promedioTotal,
      asistenciasTotales: alumno.asistenciasTotales ?? 0,
      comentario: "",
      abierto: false,
      alertas: [],
    };
  });

  const promedioGlobal = calcPromedio(calificacionesTrimestre.map((c: any) => c.valor));

  const subirBoletines = async () => {
    for (const boletin of boletinesCalculados) {
      const boletinRef = doc(db, "boletines", `${boletin.alumnoId}_${boletin.periodo}`);
      await setDoc(boletinRef, boletin, { merge: true });
    }
    alert("¡Boletines subidos a Firestore!");
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Cobertura de boletines"
          value={boletines.length}
          icon={Percent}
          subtitle="Alumnos con notas en cada trimestre."
        />
        <StatsCard
          label="Promedio global de notas"
          value={promedioGlobal}
          icon={Percent}
          color="green"
          subtitle="Media aritmética de todas las calificaciones."
        />
        <StatsCard
          label="Lectura de boletines"
          value={boletines.filter((b: any) => b.abierto).length}
          icon={Percent}
          color="red"
          subtitle="Boletines abiertos o descargados por familias."
        />
        <StatsCard
          label="Alertas críticas (conteo)"
          value={boletinesCalculados.reduce(
            (count, b) => count + (b.alertas.length > 0 ? 1 : 0),
            0
          )}
          icon={TriangleAlert}
          color="red"
          subtitle="Notificaciones urgentes generadas por IA."
        />
      </div>

      <div className="mb-6">
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
          Administra tus cursos, revisa asistencias y gestiona información académica
        </p>
      </div>

      <Button onClick={subirBoletines} className="mb-6">
        Subir boletines a Firestore
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((course: any, index: number) => {
          const safeCourse: Course = {
            firestoreId: course.firestoreId,
            nombre: course.nombre || "",
            division: course.division || "",
          };

          return (
            <div
              key={course.firestoreId || index}
              className="transform transition-all duration-200 hover:scale-105"
            >
              <CourseCard
                course={safeCourse}
                link={`/boletines/cursos?id=${course.firestoreId}`}
                descripcion="Ver y gestionar Boletines de este curso"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
