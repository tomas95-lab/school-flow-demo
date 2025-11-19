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
  context?: 'asistencias' | 'calificaciones' | 'boletines' | 'general' | 'tareas' | 'comunicacion';
}

// Constantes
const CONTEXT_TITLES = {
  asistencias: 'Observaciones de Asistencia',
  calificaciones: 'Observaciones de Rendimiento',
  boletines: 'Observaciones Generales',
  general: 'Observaciones Automáticas',
  tareas: 'Observaciones de Tareas',
  comunicacion: 'Observaciones de Comunicación'
} as const;

const CONTEXT_FILTERS = {
  asistencias: ['asistencia'],
  calificaciones: ['rendimiento', 'tendencia', 'excelencia'],
  boletines: ['rendimiento', 'tendencia', 'excelencia', 'asistencia'],
  general: ['rendimiento', 'tendencia', 'excelencia', 'asistencia'],
  tareas: ['rendimiento', 'excelencia', 'neutral'],
  comunicacion: ['rendimiento', 'neutral']
} as const;

export default function ObservacionesAutomaticasPanel({ 
  role, 
  className = "", 
  context = "general" 
}: ObservacionesAutomaticasPanelProps) {
  const { user } = useContext(AuthContext);
  
  // Hooks de datos - carga según contexto
  const shouldLoadAcademicData = context !== 'tareas' && context !== 'comunicacion';
  const shouldLoadTareas = context === 'tareas';
  const shouldLoadComunicacion = context === 'comunicacion';

  const { data: calificaciones } = useFirestoreCollection("calificaciones", {
    enableCache: true,
    dependencies: [shouldLoadAcademicData]
  });
  const { data: asistencias } = useFirestoreCollection("attendances", {
    enableCache: true,
    dependencies: [shouldLoadAcademicData]
  });
  const { data: tareas } = useFirestoreCollection("tareas", {
    enableCache: true,
    dependencies: [shouldLoadTareas]
  });
  const { data: conversaciones } = useFirestoreCollection("conversaciones_familias", {
    enableCache: true,
    dependencies: [shouldLoadComunicacion]
  });
  const { data: reuniones } = useFirestoreCollection("reuniones_familias", {
    enableCache: true,
    dependencies: [shouldLoadComunicacion]
  });
  const { data: students } = useFirestoreCollection("students", { enableCache: true });
  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true });

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

  // Generar observaciones de tareas
  const generarObservacionesTareas = (studentId: string, studentName: string): ObservacionData | null => {
    if (!tareas) return null;

    const tareasEstudiante = tareas.filter((t: any) => 
      t.studentIds?.includes(studentId) || t.studentId === studentId
    );

    // Si no hay tareas, generar observación informativa
    if (tareasEstudiante.length === 0) {
      return {
        studentId,
        studentName,
        observacion: {
          texto: 'Sin tareas asignadas actualmente.',
          tipo: 'neutral',
          prioridad: 'baja',
          reglaAplicada: 'tareas_analysis',
          datosSoporte: {
            promedioActual: 0,
            ausencias: 0,
            tendencia: 'sin_datos' as any,
            tareasActivas: 0,
            tareasAtrasadas: 0,
            porcentajeAtrasadas: '0'
          } as any
        }
      };
    }

    const now = new Date();
    const tareasActivas = tareasEstudiante.filter((t: any) => t.status === 'active');
    const tareasAtrasadas = tareasActivas.filter((t: any) => new Date(t.dueDate) < now);
    const porcentajeAtrasadas = tareasActivas.length > 0 
      ? (tareasAtrasadas.length / tareasActivas.length) * 100 
      : 0;

    let texto = '';
    let tipo: 'rendimiento' | 'tendencia' | 'excelencia' | 'neutral' = 'neutral';
    
    if (tareasAtrasadas.length > 2) {
      texto = `Tiene ${tareasAtrasadas.length} tareas atrasadas. Se recomienda ponerse al día.`;
      tipo = 'rendimiento';
    } else if (tareasActivas.length > 5) {
      texto = `Tiene ${tareasActivas.length} tareas pendientes. Buena carga de trabajo.`;
      tipo = 'neutral';
    } else if (tareasAtrasadas.length === 0 && tareasActivas.length > 0) {
      texto = `Al día con todas sus tareas (${tareasActivas.length} activas). ¡Excelente organización!`;
      tipo = 'excelencia';
    } else {
      texto = `${tareasActivas.length} tareas pendientes, ${tareasAtrasadas.length} atrasadas.`;
      tipo = 'neutral';
    }

    return {
      studentId,
      studentName,
      observacion: {
        texto,
        tipo,
        prioridad: tipo === 'rendimiento' ? 'alta' : 'media',
        reglaAplicada: 'tareas_analysis',
        datosSoporte: {
          promedioActual: tareasActivas.length,
          ausencias: tareasAtrasadas.length,
          tendencia: 'estable' as any,
          tareasActivas: tareasActivas.length,
          tareasAtrasadas: tareasAtrasadas.length,
          porcentajeAtrasadas: porcentajeAtrasadas.toFixed(1)
        } as any
      }
    };
  };

  // Generar observaciones de comunicación
  const generarObservacionesComunicacion = (studentId: string, studentName: string): ObservacionData | null => {
    if (!conversaciones && !reuniones) return null;

    const conversacionesEstudiante = conversaciones?.filter((c: any) => c.studentId === studentId) || [];
    const reunionesEstudiante = reuniones?.filter((r: any) => r.studentId === studentId) || [];

    // Si no hay comunicación, generar observación informativa
    if (conversacionesEstudiante.length === 0 && reunionesEstudiante.length === 0) {
      return {
        studentId,
        studentName,
        observacion: {
          texto: 'Sin comunicación activa con las familias.',
          tipo: 'neutral',
          prioridad: 'baja',
          reglaAplicada: 'comunicacion_analysis',
          datosSoporte: {
            promedioActual: 0,
            ausencias: 0,
            tendencia: 'sin_datos' as any,
            conversacionesAbiertas: 0,
            reunionesPendientes: 0,
            conversacionesPrioridad: 0
          } as any
        }
      };
    }

    const conversacionesAbiertas = conversacionesEstudiante.filter((c: any) => 
      c.status === 'abierta' || c.status === 'active'
    );
    const reunionesPendientes = reunionesEstudiante.filter((r: any) => 
      r.status === 'scheduled' || r.status === 'programada'
    );
    const conversacionesPrioridad = conversacionesAbiertas.filter((c: any) => c.prioridad === 'alta');

    let texto = '';
    let tipo: 'rendimiento' | 'neutral' = 'neutral';
    
    if (conversacionesPrioridad.length > 0) {
      texto = `${conversacionesPrioridad.length} conversación(es) de alta prioridad. Requiere atención inmediata.`;
      tipo = 'rendimiento';
    } else if (reunionesPendientes.length > 0) {
      texto = `${reunionesPendientes.length} reunión(es) programada(s). Comunicación activa con familias.`;
      tipo = 'neutral';
    } else if (conversacionesAbiertas.length > 0) {
      texto = `${conversacionesAbiertas.length} conversación(es) abierta(s) con familias.`;
      tipo = 'neutral';
    } else {
      texto = `Sin conversaciones o reuniones pendientes.`;
      tipo = 'neutral';
    }

    return {
      studentId,
      studentName,
      observacion: {
        texto,
        tipo,
        prioridad: tipo === 'rendimiento' ? 'alta' : 'media',
        reglaAplicada: 'comunicacion_analysis',
        datosSoporte: {
          promedioActual: conversacionesAbiertas.length,
          ausencias: 0,
          tendencia: 'estable' as any,
          conversacionesAbiertas: conversacionesAbiertas.length,
          reunionesPendientes: reunionesPendientes.length,
          conversacionesPrioridad: conversacionesPrioridad.length
        } as any
      }
    };
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
    if (!students) return [];
    
    // Filtrar estudiantes según el rol
    let studentsToAnalyze = students;
    
    if (role === 'alumno' && user?.studentId) {
      studentsToAnalyze = students.filter((s: any) => s.firestoreId === user.studentId);
    } else if (role === 'docente' && teachers && user?.teacherId) {
      const teacher = teachers.find((t: any) => t.firestoreId === user.teacherId);
      if (teacher) {
        studentsToAnalyze = students.filter((student: any) => 
          student.teacherId === user.teacherId || student.cursoId === teacher.cursoId
        );
      }
    }
    
    // Para contextos de Tareas y Comunicación, usar funciones específicas
    if (context === 'tareas') {
      if (!tareas) return [];
      return studentsToAnalyze
        .map((student: any) => generarObservacionesTareas(student.firestoreId, `${student.nombre} ${student.apellido}`))
        .filter((obs): obs is ObservacionData => obs !== null);
    }

    if (context === 'comunicacion') {
      if (!conversaciones && !reuniones) return [];
      return studentsToAnalyze
        .map((student: any) => generarObservacionesComunicacion(student.firestoreId, `${student.nombre} ${student.apellido}`))
        .filter((obs): obs is ObservacionData => obs !== null);
    }

    // Para otros contextos, usar el sistema anterior
    if (!calificaciones || !asistencias) return [];

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
  }, [role, user, calificaciones, asistencias, students, teachers, tareas, conversaciones, reuniones, context]);

  // Filtrar observaciones por contexto y relevancia
  const observacionesFiltradas = useMemo(() => {
    // Para Tareas y Comunicación, mostrar todas las observaciones (incluyendo neutrales)
    if (context === 'tareas' || context === 'comunicacion') {
      return filtrarObservacionesPorContexto(observacionesGeneradas);
    }
    
    // Para otros contextos, filtrar neutrales
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
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="truncate">{tituloContexto}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="text-center py-6 sm:py-8">
            <div className="bg-green-50 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              <span className="hidden sm:inline">No hay observaciones automáticas relevantes en este contexto.</span>
              <span className="sm:hidden">Sin observaciones relevantes.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          <span className="truncate">
            <span className="hidden sm:inline">{tituloContexto} ({observacionesFiltradas.length})</span>
            <span className="sm:hidden">{tituloContexto.split(' ')[0]} ({observacionesFiltradas.length})</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          {observacionesFiltradas.map((item, index: number) => (
            <div key={`${item.studentId}-${index}`} className="border-l-4 border-purple-200 pl-3 sm:pl-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-semibold text-xs sm:text-sm text-gray-700 truncate max-w-[200px] sm:max-w-none">
                  {item.studentName}
                </span>
                <div className="shrink-0">
                  {renderObservacionIcon(item.observacion)}
                </div>
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
