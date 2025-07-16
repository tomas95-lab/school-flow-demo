import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, TriangleAlert } from "lucide-react";
import { db } from "@/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "./ui/button";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  getPeriodoActual,
  filtrarCalificacionesTrimestre,
  calcPromedio,
  getPromedioTotal,
  getPromedioPorMateriaPorTrimestre,
} from "@/utils/boletines";

interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
}

export default function AdminBoletinesOverview() {
  const { user } = useContext(AuthContext);
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

  // Si es docente y no hay boletines, mostrar mensaje
  if (user?.role === "docente" && boletines.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-full p-8 mb-8">
          <svg className="h-16 w-16 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          No hay boletines disponibles
        </h3>
        <p className="text-gray-600 max-w-md mb-8">
          No hay boletines creados por el Administrador aún. Los boletines se generan al final de cada período académico.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">
            <strong>Nota:</strong> Solo los administradores pueden crear y generar boletines. 
            Los docentes pueden revisar los boletines una vez que hayan sido creados.
          </p>
        </div>
      </div>
    );
  }

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

      {user?.role === "admin" && (
        <Button onClick={subirBoletines} className="mb-6">
          Subir boletines a Firestore
        </Button>
      )}

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
