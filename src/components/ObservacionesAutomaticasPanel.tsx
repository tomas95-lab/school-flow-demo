import { useMemo, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { generarObservacionAutomaticaBoletin, getPeriodoActual } from "@/utils/boletines";
import type { ObservacionLimpia } from "@/utils/observacionesAutomaticas";
import ObservacionAutomatica from "./ObservacionAutomatica";

// Tipos TypeScript
interface ObservacionData {
  studentId: string;
  studentName: string;
  observacion: ObservacionLimpia;
}

interface ObservacionesAutomaticasPanelProps {
  role: 'admin' | 'docente' | 'alumno';
  className?: string;
  context?: 'asistencias' | 'calificaciones' | 'boletines' | 'general';
}

// Constantes
const CONTEXT_TITLES = {
  asistencias: 'Observaciones de Asistencia',
  calificaciones: 'Observaciones de Rendimiento',
  boletines: 'Observaciones Generales',
  general: 'Observaciones Automáticas'
} as const;

const CONTEXT_FILTERS = {
  asistencias: ['asistencia'],
  calificaciones: ['rendimiento', 'tendencia', 'excelencia'],
  boletines: ['rendimiento', 'tendencia', 'excelencia', 'asistencia'],
  general: ['rendimiento', 'tendencia', 'excelencia', 'asistencia']
} as const;

export default function ObservacionesAutomaticasPanel({ 
  role, 
  className = "", 
  context = "general" 
}: ObservacionesAutomaticasPanelProps) {
  const { user } = useContext(AuthContext);
  
  // Hooks de datos
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
  const filtrarObservacionesPorContexto = (observaciones: ObservacionData[]) => {
    const tiposPermitidos = CONTEXT_FILTERS[context];
    
    return observaciones.filter((item) => {
      const tipo = item.observacion.tipo;
      return (tiposPermitidos as readonly string[]).includes(tipo);
    });
  };

  // Generar observaciones según el rol
  const observacionesGeneradas = useMemo((): ObservacionData[] => {
    if (!calificaciones || !asistencias || !students) return [];

    const periodoActual = getPeriodoActual();
    const periodoAnterior = obtenerPeriodoAnterior(periodoActual);

    switch (role) {
      case 'admin':
        // Para admin: observaciones de todos los estudiantes
        return students
          .map((student: any) => {
            const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === student.firestoreId);
            const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === student.firestoreId);
            
            if (calificacionesAlumno.length === 0) return null;

            const observacion = generarObservacionAutomaticaBoletin(
              calificacionesAlumno as any,
              asistenciasAlumno as any,
              student.firestoreId || '',
              periodoActual,
              periodoAnterior
            );

            return {
              studentId: student.firestoreId || '',
              studentName: `${student.nombre} ${student.apellido}`,
              observacion: observacion as ObservacionLimpia
            };
          })
          .filter((item): item is ObservacionData => item !== null);

      case 'docente': {
        // Para docente: observaciones de sus estudiantes
        if (!teachers || !user?.teacherId) return [];
        
        const teacher = teachers.find((t) => t.firestoreId === user.teacherId);
        if (!teacher) return [];

        // Filtrar estudiantes del docente (asumiendo que hay una relación teacher-student)
        const teacherStudents = students.filter((student) => 
          student.teacherId === user.teacherId || student.cursoId === teacher.cursoId
        );

        return teacherStudents
          .map((student: any) => {
            const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === student.firestoreId);
            const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === student.firestoreId);
            
            if (calificacionesAlumno.length === 0) return null;

            const observacion = generarObservacionAutomaticaBoletin(
              calificacionesAlumno as any,
              asistenciasAlumno as any,
              student.firestoreId || '',
              periodoActual,
              periodoAnterior
            );

            return {
              studentId: student.firestoreId || '',
              studentName: `${student.nombre} ${student.apellido}`,
              observacion: observacion as ObservacionLimpia
            };
          })
          .filter((item): item is ObservacionData => item !== null);
      }

      case 'alumno': {
        // Para alumno: su propia observación
        if (!user?.studentId) return [];

        const calificacionesAlumno = calificaciones.filter((cal: any) => cal.studentId === user.studentId);
        const asistenciasAlumno = asistencias.filter((asist: any) => asist.studentId === user.studentId);
        
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
          observacion: observacion as ObservacionLimpia
        }];
      }

      default:
        return [];
    }
  }, [role, user, calificaciones, asistencias, students, teachers]);

  // Filtrar observaciones por contexto y relevancia
  const observacionesFiltradas = useMemo(() => {
    const observacionesRelevantes = observacionesGeneradas.filter(
      (item) => item.observacion.tipo !== 'neutral'
    );
    return filtrarObservacionesPorContexto(observacionesRelevantes);
  }, [observacionesGeneradas, context]);

  // Obtener título según el contexto
  const tituloContexto = CONTEXT_TITLES[context];

  // Renderizar icono según el tipo de observación
  const renderObservacionIcon = (observacion: ObservacionLimpia) => {
    const tipo = observacion.tipo;
    
    if (tipo === 'rendimiento') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    if (tipo === 'tendencia') {
      const tendencia = observacion.datosSoporte?.tendencia;
      if (tendencia === 'mejora') {
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      }
      if (tendencia === 'descenso') {
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      }
    }
    
    return null;
  };

  // Estado vacío
  if (observacionesFiltradas.length === 0) {
    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            {tituloContexto}
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
          {tituloContexto} ({observacionesFiltradas.length})
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
                {renderObservacionIcon(item.observacion)}
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
