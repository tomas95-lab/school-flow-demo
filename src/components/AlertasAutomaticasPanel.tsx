import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BookOpen, 
  Users, 
  CheckCircle,
  Brain,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  generarAlertasAutomaticas, 
  generarAlertasParaEstudiantes,
  filtrarAlertasCriticas,
  obtenerEstadisticasAlertas,
  type AlertaAutomatica,
  type DatosAlumno
} from "@/utils/alertasAutomaticas";
import { getPeriodoActual } from "@/utils/boletines";

interface AlertasAutomaticasPanelProps {
  role: 'admin' | 'docente' | 'alumno';
  className?: string;
  showOnlyCritical?: boolean;
}

export default function AlertasAutomaticasPanel({ 
  role, 
  className = "",
  showOnlyCritical = false 
}: AlertasAutomaticasPanelProps) {
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

  const [alertasGeneradas, setAlertasGeneradas] = useState<AlertaAutomatica[]>([]);

  // Generar alertas según el rol (asíncrono)
  useEffect(() => {
    const run = async () => {
      if (!calificaciones || !asistencias) { setAlertasGeneradas([]); return; }
      const periodoActual = getPeriodoActual();
      const periodoAnterior = obtenerPeriodoAnterior(periodoActual);
      if (role === 'admin') {
        const estudiantes = students.map((student) => {
          const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === student.firestoreId);
          const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === student.firestoreId);
          const datosAlumno: DatosAlumno = {
            studentId: student.firestoreId || '',
            calificaciones: calificacionesAlumno.map(cal => ({ valor: cal.valor || 0, fecha: cal.fecha || '', subjectId: cal.subjectId || '' })),
            asistencias: asistenciasAlumno.map(asist => ({ present: asist.presente || false, fecha: asist.fecha || '' })),
            periodoActual,
            periodoAnterior
          };
          return { studentId: String(student.firestoreId || ''), studentName: `${student.nombre} ${student.apellido}` , datos: datosAlumno };
        });
        const res = await generarAlertasParaEstudiantes(estudiantes);
        setAlertasGeneradas(res);
        return;
      }
      if (role === 'docente') {
        const teacher = teachers.find((t) => t.firestoreId === user?.teacherId);
        if (!teacher) { setAlertasGeneradas([]); return; }
        const teacherStudents = students.filter((student) => student.cursoId === teacher.cursoId);
        const estudiantes = teacherStudents.map((student) => {
          const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === student.firestoreId);
          const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === student.firestoreId);
          const datosAlumno: DatosAlumno = {
            studentId: student.firestoreId || '',
            calificaciones: calificacionesAlumno.map(cal => ({ valor: cal.valor || 0, fecha: cal.fecha || '', subjectId: cal.subjectId || '' })),
            asistencias: asistenciasAlumno.map(asist => ({ present: asist.presente || false, fecha: asist.fecha || '' })),
            periodoActual,
            periodoAnterior
          };
          return { studentId: String(student.firestoreId || ''), studentName: `${student.nombre} ${student.apellido}`, datos: datosAlumno };
        });
        const res = await generarAlertasParaEstudiantes(estudiantes);
        setAlertasGeneradas(res);
        return;
      }
      if (role === 'alumno') {
        if (!user?.studentId) { setAlertasGeneradas([]); return; }
        const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === user.studentId);
        const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === user.studentId);
        const datosAlumno: DatosAlumno = {
          studentId: user.studentId || '',
          calificaciones: calificacionesAlumno.map(cal => ({ valor: cal.valor || 0, fecha: cal.fecha || '', subjectId: cal.subjectId || '' })),
          asistencias: asistenciasAlumno.map(asist => ({ present: asist.presente || false, fecha: asist.fecha || '' })),
          periodoActual,
          periodoAnterior
        };
        const res = await generarAlertasAutomaticas(datosAlumno, user.name || 'Estudiante');
        setAlertasGeneradas(res);
        return;
      }
      setAlertasGeneradas([]);
    };
    run();
  }, [role, user, calificaciones, asistencias, students, teachers]);

  // Filtrar alertas según configuración
  const alertasFiltradas = showOnlyCritical 
    ? filtrarAlertasCriticas(alertasGeneradas)
    : alertasGeneradas;

  // Obtener estadísticas
  const stats = obtenerEstadisticasAlertas(alertasGeneradas);

  // Función para obtener el icono según el tipo de alerta
  const getAlertaIcon = (tipo: AlertaAutomatica['tipo']) => {
    switch (tipo) {
      case 'rendimiento_critico':
        return <AlertTriangle className="h-4 w-4" />;
      case 'asistencia_critica':
        return <Users className="h-4 w-4" />;
      case 'tendencia_negativa':
        return <TrendingDown className="h-4 w-4" />;
      case 'materia_riesgo':
        return <BookOpen className="h-4 w-4" />;
      case 'mejora_significativa':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Función para obtener el color del badge según prioridad
  const getPrioridadColor = (prioridad: AlertaAutomatica['prioridad']) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el color del borde según prioridad
  const getPrioridadBorderColor = (prioridad: AlertaAutomatica['prioridad']) => {
    switch (prioridad) {
      case 'critica':
        return 'border-l-red-500';
      case 'alta':
        return 'border-l-orange-500';
      case 'media':
        return 'border-l-yellow-500';
      case 'baja':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  if (alertasFiltradas.length === 0) {
    return (
      <Card className={`border-0 shadow-sm ${className}`}>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="hidden sm:inline">Alertas Automáticas</span>
            <span className="sm:hidden">Alertas IA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="text-center py-6 sm:py-8">
            <div className="bg-green-50 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              {showOnlyCritical 
                ? (
                  <>
                    <span className="hidden sm:inline">No hay alertas críticas en este momento.</span>
                    <span className="sm:hidden">Sin alertas críticas.</span>
                  </>
                )
                : (
                  <>
                    <span className="hidden sm:inline">No hay alertas automáticas en este momento.</span>
                    <span className="sm:hidden">Sin alertas automáticas.</span>
                  </>
                )
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl min-w-0 flex-1">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Alertas Automáticas ({alertasFiltradas.length})</span>
              <span className="sm:hidden">Alertas IA ({alertasFiltradas.length})</span>
            </span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              <Brain className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">IA Generadas</span>
              <span className="xs:hidden">IA</span>
            </Badge>
            {stats.criticas > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {stats.criticas} 
                <span className="hidden xs:inline"> críticas</span>
                <span className="xs:hidden"> crit.</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          {alertasFiltradas.map((alerta) => (
            <div 
              key={alerta.id} 
              className={`border-l-4 pl-3 sm:pl-4 py-2 sm:py-3 bg-white rounded-r-lg shadow-sm ${getPrioridadBorderColor(alerta.prioridad)}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                    <div className="shrink-0">
                      {getAlertaIcon(alerta.tipo)}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                      {alerta.titulo}
                    </h4>
                    <Badge className={`text-xs px-1.5 py-0.5 shrink-0 ${getPrioridadColor(alerta.prioridad)}`}>
                      {alerta.prioridad.toUpperCase()}
                    </Badge>
                    {!alerta.leida && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 shrink-0">
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden xs:inline">Nueva</span>
                        <span className="xs:hidden">●</span>
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                    {alerta.descripcion}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                      <Users className="h-3 w-3 shrink-0" />
                      <span className="truncate">{alerta.studentName}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(alerta.fechaGeneracion).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Datos de soporte */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Promedio:</span>
                      <span className="font-medium ml-1">{(alerta.datosSoporte.promedioActual ?? 0).toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ausencias:</span>
                      <span className="font-medium ml-1">{alerta.datosSoporte.ausencias}</span>
                    </div>
                    {alerta.datosSoporte.porcentajeAsistencia !== undefined && (
                      <div>
                        <span className="text-gray-500">Asistencia:</span>
                        <span className="font-medium ml-1">{alerta.datosSoporte.porcentajeAsistencia.toFixed(0)}%</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Tendencia:</span>
                      <span className="font-medium ml-1 capitalize">
                        {(alerta.datosSoporte.tendencia || '').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!alerta.leida && (
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {alerta.activa && (
                    <Button size="sm" variant="outline">
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
