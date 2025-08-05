import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { CourseCard } from "./CourseCard";
import { StatsCard } from "./StatCards";
import { Percent, TriangleAlert } from "lucide-react";
import { db } from "@/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { validarYLimpiarDatosFirebase } from "@/utils/firebaseUtils";
import { Button } from "./ui/button";
import { useContext, useMemo, useCallback, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  getPeriodoActual,
  filtrarCalificacionesTrimestre,
  calcPromedio,
  getPromedioTotal,
  getPromedioPorMateriaPorTrimestre,
  generarObservacionAutomaticaBoletin,
} from "@/utils/boletines";

// Tipos para evitar errores de any
interface Calificacion {
  studentId: string;
  subjectId: string;
  valor: number;
  periodo: string;
  fecha: string;
}

interface Asistencia {
  studentId: string;
  fecha: string;
  presente: boolean;
}

interface Subject {
  firestoreId: string;
  nombre: string;
  cursoId: string;
}

// Función para obtener el período anterior
function obtenerPeriodoAnterior(periodoActual: string): string | undefined {
  const match = periodoActual.match(/(\d{4})-T(\d)/);
  if (!match) return undefined;
  
  const year = parseInt(match[1]);
  const trimestre = parseInt(match[2]);
  
  if (trimestre === 1) {
    return `${year - 1}-T3`;
  } else {
    return `${year}-T${trimestre - 1}`;
  }
}

interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
}

export default function AdminBoletinesOverview() {
  const { user } = useContext(AuthContext);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Usar hooks optimizados con cache
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true });
  const { data: subjects } = useFirestoreCollection("subjects", { enableCache: true });
  const { data: calificaciones } = useFirestoreCollection("calificaciones", { enableCache: true });
  const { data: boletines } = useFirestoreCollection("boletines", { enableCache: true });
  const { data: alumnos } = useFirestoreCollection("students", { enableCache: true });
  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true });
  const { data: asistencias } = useFirestoreCollection("attendances", { enableCache: true });
  const teacherCourses = courses.filter(c => c.teacherId == user?.teacherId);

  // Memoizar cálculos pesados
  const boletinesCalculados = useMemo(() => {
    if (!alumnos || !subjects || !calificaciones || !asistencias) return [];
    const currentDate = new Date();

    const periodoActual = getPeriodoActual();
    const calificacionesTrimestre = filtrarCalificacionesTrimestre(calificaciones as Calificacion[]);

    return alumnos.map((alumno) => {
      // Filtrar solo las materias del alumno actual si subjects tiene más campos
      const materias = getPromedioPorMateriaPorTrimestre(
        calificacionesTrimestre as Calificacion[],
        Array.isArray(subjects)
          ? subjects.filter((s) => !!s && typeof s === "object" && "firestoreId" in s) as Subject[]
          : [],
        alumno.firestoreId || ''
      );

      const promedioTotal = getPromedioTotal(materias);

      // Generar observación automática
      const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === alumno.firestoreId);
      const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === alumno.firestoreId);

      // Obtener período anterior (simplificado)
      const periodoAnterior = obtenerPeriodoAnterior(periodoActual);

      const observacionAutomatica = generarObservacionAutomaticaBoletin(
        calificacionesAlumno as Calificacion[],
        asistenciasAlumno as Asistencia[],
        alumno.firestoreId || '',
        periodoActual,
        periodoAnterior
      );

      return {
        alumnoId: alumno.firestoreId,
        alumnoNombre: `${alumno.nombre} ${alumno.apellido}`,
        periodo: periodoActual,
        materias,
        curso: alumno.cursoId || "Sin curso",
        promedioTotal,
        asistenciasTotales: alumno.asistenciasTotales ?? 0,
        comentario: "",
        fechaGeneracion: currentDate.toISOString(),
        abierto: false,
        alertas: [],
        observacionAutomatica,
      };
    });
  }, [alumnos, subjects, calificaciones, asistencias]);

  // Memoizar promedio global
  const promedioGlobal = useMemo(() => {
    if (!calificaciones) return "0.00";

    const calificacionesTrimestre = filtrarCalificacionesTrimestre(calificaciones as Calificacion[]);
    return calcPromedio(calificacionesTrimestre.map((c) => (c as Calificacion).valor)).toFixed(2);
  }, [calificaciones]);

  // Memoizar función de subida de boletines
  const subirBoletines = useCallback(async () => {
    if (!boletinesCalculados.length) {
      toast.error('No hay boletines para generar', {
        description: 'Verifica que haya alumnos y calificaciones disponibles'
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Usar Promise.all para subir en paralelo (más eficiente)
      const uploadPromises = boletinesCalculados.map(boletin => {
        // Validar y limpiar datos antes de enviar a Firebase
        const { datos: boletinLimpio, esValido, errores } = validarYLimpiarDatosFirebase(boletin);
        
        if (!esValido) {
          console.warn(`Boletín ${boletin.alumnoId} tiene errores:`, errores);
        }
        
        const boletinRef = doc(db, "boletines", `${boletin.alumnoId}_${boletin.periodo}`);
        return setDoc(boletinRef, boletinLimpio, { merge: true });
      });
      
      await Promise.all(uploadPromises);
      
      toast.success('Boletines generados exitosamente', {
        description: `Se generaron ${boletinesCalculados.length} boletines para el período actual`
      });
    } catch (error) {
      console.error("Error subiendo boletines:", error);
      toast.error('Error al generar boletines', {
        description: 'Hubo un problema al procesar la solicitud. Inténtalo de nuevo.'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [boletinesCalculados]);

  // Memoizar estadísticas
  const stats = useMemo(() => {
    if (!boletines || !boletinesCalculados) {
      return {
        coverage: 0,
        globalAverage: "0.00",
        readCount: 0,
        criticalAlerts: 0
      };
    }

    return {
      coverage: boletines.length,
      globalAverage: promedioGlobal,
      readCount: boletines.filter((b) => b.abierto).length,
      criticalAlerts: boletinesCalculados.reduce(
        (count, b) => count + (b.alertas.length > 0 ? 1 : 0),
        0
      )
    };
  }, [boletines, boletinesCalculados, promedioGlobal]);

  if (!courses || !subjects || !calificaciones || !alumnos || !teachers) {
    return <div>Cargando...</div>;
  }

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
          value={stats.coverage}
          icon={Percent}
          subtitle="Alumnos con notas en cada trimestre."
        />
        <StatsCard
          label="Promedio global de notas"
          value={stats.globalAverage}
          icon={Percent}
          color="green"
          subtitle="Media aritmética de todas las calificaciones."
        />
        <StatsCard
          label="Lectura de boletines"
          value={stats.readCount}
          icon={Percent}
          color="red"
          subtitle="Boletines abiertos o descargados por familias."
        />
        <StatsCard
          label="Alertas críticas (conteo)"
          value={stats.criticalAlerts}
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
        <Button 
          onClick={subirBoletines} 
          disabled={isGenerating}
          className="mb-6"
        >
          {isGenerating ? 'Generando...' : 'Generar Boletines'}
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(user?.role === "docente" ? teacherCourses : courses).map((course, index: number) => {
          const safeCourse: Course = {
            firestoreId: course.firestoreId || '',
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
