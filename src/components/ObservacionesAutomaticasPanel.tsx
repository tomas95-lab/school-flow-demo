import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { generarObservacionAutomaticaBoletin, getPeriodoActual } from "@/utils/boletines";
import ObservacionAutomatica from "./ObservacionAutomatica";

interface ObservacionesAutomaticasPanelProps {
  role: 'admin' | 'docente' | 'alumno';
  className?: string;
  context?: 'asistencias' | 'calificaciones' | 'boletines' | 'general';
}

export default function ObservacionesAutomaticasPanel({ 
  role, 
  className = "", 
  context = "general" 
}: ObservacionesAutomaticasPanelProps) {
  const { user } = useContext(AuthContext);
  const { data: calificaciones } = useFirestoreCollection("calificaciones");
  const { data: asistencias } = useFirestoreCollection("attendances");
  const { data: students } = useFirestoreCollection("students");
  const { data: teachers } = useFirestoreCollection("teachers");

  // Función helper para obtener período anterior
  const obtenerPeriodoAnterior = (periodoActual: string): string | undefined => {
    const match = periodoActual.match(/(\d{4})-T(\d)/);
    if (!match) return undefined;
    const year = parseInt(match[1]);
    const trimestre = parseInt(match[2]);
    if (trimestre === 1) {
      return `${year - 1}-T3`;
    } else {
      return `${year}-T${trimestre - 1}`;
    }
  };

  // Función para filtrar observaciones según el contexto
  const filtrarObservacionesPorContexto = (observaciones: Array<{ studentId: string | undefined; studentName: string; observacion: any } | null>) => {
    return observaciones.filter((item): item is { studentId: string | undefined; studentName: string; observacion: any } => {
      return item !== null;
    }).filter((item) => {
      const tipo = item.observacion.tipo;
      
      switch (context) {
        case 'asistencias':
          // En módulo de asistencias, mostrar solo observaciones relacionadas con asistencia
          return tipo === 'asistencia';
        case 'calificaciones':
          // En módulo de calificaciones, mostrar solo observaciones relacionadas con rendimiento y tendencias
          return tipo === 'rendimiento' || tipo === 'tendencia' || tipo === 'excelencia';
        case 'boletines':
          // En módulo de boletines, mostrar todas las observaciones relevantes
          return tipo !== 'neutral';
        case 'general':
        default:
          // En contexto general, mostrar todas las observaciones relevantes
          return tipo !== 'neutral';
      }
    });
  };

  // Generar observaciones según el rol
  const observacionesGeneradas = useMemo(() => {
    if (!calificaciones || !asistencias) return [];

    const periodoActual = getPeriodoActual();
    const periodoAnterior = obtenerPeriodoAnterior(periodoActual);

    switch (role) {
      case 'admin':
        // Para admin: observaciones de todos los estudiantes
            return students.map((student) => {
      const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === student.firestoreId);
      const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === student.firestoreId);
          
          if (calificacionesAlumno.length === 0) return null;

          const observacion = generarObservacionAutomaticaBoletin(
            calificacionesAlumno as any,
            asistenciasAlumno as any,
            student.firestoreId || '',
            periodoActual,
            periodoAnterior
          );

          return {
            studentId: student.firestoreId,
            studentName: `${student.nombre} ${student.apellido}`,
            observacion
          };
        }).filter(Boolean);

      case 'docente': {
        // Para docente: observaciones de sus estudiantes
        const teacher = teachers.find((t) => t.firestoreId === user?.teacherId);
        if (!teacher) return [];

        const teacherStudents = students.filter((student) => student.cursoId === teacher.cursoId);
        
        return teacherStudents.map((student) => {
          const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === student.firestoreId);
          const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === student.firestoreId);
          
          if (calificacionesAlumno.length === 0) return null;

          const observacion = generarObservacionAutomaticaBoletin(
            calificacionesAlumno as any,
            asistenciasAlumno as any,
            student.firestoreId || '',
            periodoActual,
            periodoAnterior
          );

                      return {
              studentId: student.firestoreId!,
              studentName: `${student.nombre} ${student.apellido}`,
              observacion
            };
        }).filter(Boolean);
      }

      case 'alumno': {
        // Para alumno: su propia observación
        if (!user?.studentId) return [];

        const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === user.studentId);
        const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === user.studentId);
        
        if (calificacionesAlumno.length === 0) return [];

        const observacion = generarObservacionAutomaticaBoletin(
          calificacionesAlumno as any,
          asistenciasAlumno as any,
          user.studentId,
          periodoActual,
          periodoAnterior
        );

        return [{
          studentId: user.studentId,
          studentName: user.name || "Estudiante",
          observacion
        }];
      }

      default:
        return [];
    }
  }, [role, user, calificaciones, asistencias, students, teachers]);

  // Filtrar observaciones por contexto y relevancia
  const observacionesFiltradas = filtrarObservacionesPorContexto(
    observacionesGeneradas.filter((item) => item && item.observacion.tipo !== 'neutral')
  );

  // Obtener título según el contexto
  const getTituloContexto = () => {
    switch (context) {
      case 'asistencias':
        return 'Observaciones de Asistencia';
      case 'calificaciones':
        return 'Observaciones de Rendimiento';
      case 'boletines':
        return 'Observaciones Generales';
      case 'general':
      default:
        return 'Observaciones Automáticas';
    }
  };

  if (observacionesFiltradas.length === 0) {
    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            {getTituloContexto()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600">
              No hay observaciones automáticas relevantes en este contexto.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-600" />
          {getTituloContexto()} ({observacionesFiltradas.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {observacionesFiltradas.map((item, index: number) => (
            <div key={`${item.studentId}-${index}`} className="border-l-4 border-purple-200 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-gray-700">
                  {item.studentName}
                </span>
                {item.observacion.tipo === 'rendimiento' && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                {item.observacion.tipo === 'tendencia' && item.observacion.datosSoporte.tendencia === 'mejora' && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {item.observacion.tipo === 'tendencia' && item.observacion.datosSoporte.tendencia === 'descenso' && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <ObservacionAutomatica 
                observacion={item.observacion}
                showDetails={false}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
