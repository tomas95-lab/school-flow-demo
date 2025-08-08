import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { Card, CardTitle, CardHeader, CardContent } from "./ui/card";
import { 
  BookOpen, 
  GraduationCap, 
  TrendingUp, 
  UserCheck, 
  AlertTriangle,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { StatsCard } from "./StatCards";
import { getPromedioTotal, observacionPorPromedio, generarPDFBoletin, generarObservacionAutomaticaBoletin } from "@/utils/boletines";
import { getPeriodoActual } from "@/utils/boletines";

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
import { BoletinView } from "./BoletinView";
import { SchoolSpinner } from "./SchoolSpinner";

export default function AlumnoBoletinesOverview() {
  const { user } = useContext(AuthContext);
  const studentId = user?.studentId;
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: boletines, loading: boletinesLoading } = useFirestoreCollection("boletines", {
    constraints: user?.role === 'alumno' ? [where('alumnoId','==', user?.studentId || '')] : [],
    dependencies: [user?.role, user?.studentId]
  });
  const { data: asistencias } = useFirestoreCollection("attendances", {
    constraints: user?.role === 'alumno' ? [where('studentId','==', user?.studentId || '')] : [],
    dependencies: [user?.role, user?.studentId]
  });
  const { data: students } = useFirestoreCollection("students");
  const { data: courses } = useFirestoreCollection("courses");
  const { data: calificaciones } = useFirestoreCollection("calificaciones");


  const studentInfo = students.find((student) => student.firestoreId === studentId);
  const course = courses.find((c) => c.firestoreId === studentInfo?.cursoId);

  // Filtrar boletines del alumno actual
  const boletinesAlumno = boletines.filter((b) => b.alumnoId === studentId);

  // Calcular datos de asistencia del alumno
  const asistenciasAlumno = asistencias.filter((a) => 
    a.studentId === studentId && 
    a.courseId === studentInfo?.cursoId
  );

  const totalAsistencias = asistenciasAlumno.length;
  const asistenciasPresentes = asistenciasAlumno.filter((a) => a.present).length;
  const porcentajeAsistencia = totalAsistencias > 0 
    ? Math.round((asistenciasPresentes / totalAsistencias) * 100) 
    : 0;

  // Procesar boletines para mostrar
  const boletinesProcesados = boletinesAlumno.map((b) => {
    const materias = b.materias?.map((m: { T1: number; T2: number; T3: number; nombre: string }) => {
      const promedio = (m.T1 + m.T2 + m.T3) / 3 || 0;
      return {
        nombre: m.nombre,
        t1: m.T1,
        t2: m.T2,
        t3: m.T3,
        promedio,
        observacion: observacionPorPromedio(promedio),
      };
    }) || [];

    const promedioTotal = getPromedioTotal(b.materias || []);

    // Generar observación automática
      const calificacionesAlumno = calificaciones.filter((cal) => cal.studentId === studentId);
  const asistenciasAlumno = asistencias.filter((asist) => asist.studentId === studentId);
    const periodoActual = b.periodo || getPeriodoActual();
    
    // Obtener período anterior (simplificado)
    const periodoAnterior = obtenerPeriodoAnterior(periodoActual);
    
    const observacionAutomatica = studentId ? generarObservacionAutomaticaBoletin(
      calificacionesAlumno as any,
      asistenciasAlumno as any,
      studentId,
      periodoActual || getPeriodoActual(),
      periodoAnterior
    ) : null;



    return {
      id: b.alumnoId,
      Nombre: b.alumnoNombre || `${studentInfo?.nombre} ${studentInfo?.apellido}`,
      promediototal: promedioTotal,
      estado: b.abierto ? "abierto" : "cerrado",
      alertas: b.alertas?.length || 0,
      periodo: b.periodo,
      materias,
      comentario: b.comentario || "",
      observacionGeneral: observacionPorPromedio(promedioTotal),
      observacionAutomatica,
      asistencia: {
        total: totalAsistencias,
        presentes: asistenciasPresentes,
        ausentes: totalAsistencias - asistenciasPresentes,
        porcentaje: porcentajeAsistencia
      }
    };
  });

  if (boletinesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <SchoolSpinner text="Cargando tu boletín..." fullScreen={true} />
          <p className="text-gray-500 mt-4">Preparando información académica</p>
        </div>
      </div>
    );
  }

  if (boletinesAlumno.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Mi Boletin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay boletines disponibles
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Tu boletín aún no ha sido generado. Los docentes y administradores 
                generarán los boletines al final de cada período académico.
              </p>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  }

  const boletinActual = boletinesProcesados[0]; // Mostrar el más reciente
  
  // Función para manejar la descarga del PDF
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generarPDFBoletin(boletinActual);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const stats = {
    totalMaterias: boletinActual.materias?.length || 0,
    materiasAprobadas: boletinActual.materias?.filter((m: { promedio: number; }) => m.promedio >= 7.0).length || 0,
    materiasDestacadas: boletinActual.materias?.filter((m: { promedio: number; }) => m.promedio >= 9.0).length || 0,
    materiasEnRiesgo: boletinActual.materias?.filter((m: { promedio: number; }) => m.promedio < 7.0).length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header con información del curso */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Mi Boletin
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {course?.nombre} - División {course?.division} - Año {course?.año}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {boletinActual.periodo || 'Período Actual'}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  boletinActual.estado === "leido" ? "bg-green-500" :
                  boletinActual.estado === "generado" ? "bg-blue-500" :
                  boletinActual.estado === "abierto" ? "bg-emerald-500" :
                  boletinActual.estado === "cerrado" ? "bg-red-500" :
                  "bg-yellow-500"
                }`}></div>
                <Badge 
                  variant={boletinActual.estado === 'abierto' || boletinActual.estado === 'leido' ? 'default' : 'secondary'}
                  className={
                    boletinActual.estado === 'leido' ? 'bg-green-100 text-green-700' :
                    boletinActual.estado === 'generado' ? 'bg-blue-100 text-blue-700' :
                    boletinActual.estado === 'abierto' ? 'bg-emerald-100 text-emerald-700' :
                    boletinActual.estado === 'cerrado' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }
                >
                  {boletinActual.estado === 'leido' ? 'Leído' :
                   boletinActual.estado === 'generado' ? 'Generado' :
                   boletinActual.estado === 'abierto' ? 'Abierto' :
                   boletinActual.estado === 'cerrado' ? 'Cerrado' :
                   'Pendiente'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Promedio General"
          value={boletinActual.promediototal.toFixed(1)}
          icon={TrendingUp}
          color="blue"
          subtitle="Tu promedio general del período"
        />
        <StatsCard
          label="Asistencia"
          value={`${boletinActual.asistencia?.porcentaje || 0}%`}
          icon={UserCheck}
          color="green"
          subtitle={`${boletinActual.asistencia?.presentes || 0}/${boletinActual.asistencia?.total || 0} clases`}
        />
        <StatsCard
          label="Materias Aprobadas"
          value={`${stats.materiasAprobadas}/${stats.totalMaterias}`}
          icon={BookOpen}
          color="emerald"
          subtitle="Materias con promedio ≥ 7.0"
        />
        <StatsCard
          label="Materias Destacadas"
          value={stats.materiasDestacadas.toString()}
          icon={GraduationCap}
          color="purple"
          subtitle="Materias con promedio ≥ 9.0"
        />
      </div>
      {/* Información detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen de rendimiento */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Resumen de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Promedio General</span>
              <span className={`font-bold text-lg ${
                boletinActual.promediototal >= 9.0 ? 'text-emerald-600' :
                boletinActual.promediototal >= 8.0 ? 'text-blue-600' :
                boletinActual.promediototal >= 7.0 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {boletinActual.promediototal.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado Académico</span>
              <Badge 
                variant={boletinActual.promediototal >= 7.0 ? 'default' : 'destructive'}
                className={boletinActual.promediototal >= 7.0 ? 'bg-green-100 text-green-700' : ''}
              >
                {boletinActual.promediototal >= 7.0 ? 'Aprobado' : 'En Riesgo'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Alertas</span>
              <div className="flex items-center gap-1">
                <AlertTriangle className={`h-4 w-4 ${boletinActual.alertas > 0 ? 'text-red-500' : 'text-green-500'}`} />
                <span className={boletinActual.alertas > 0 ? 'text-red-600' : 'text-green-600'}>
                  {boletinActual.alertas}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de asistencia */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
              Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Porcentaje</span>
              <span className={`font-bold text-lg ${
                (boletinActual.asistencia?.porcentaje || 0) >= 90 ? 'text-emerald-600' :
                (boletinActual.asistencia?.porcentaje || 0) >= 80 ? 'text-blue-600' :
                (boletinActual.asistencia?.porcentaje || 0) >= 70 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {boletinActual.asistencia?.porcentaje || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Clases Asistidas</span>
              <span className="font-semibold text-gray-900">
                {boletinActual.asistencia?.presentes || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Clases Totales</span>
              <span className="font-semibold text-gray-900">
                {boletinActual.asistencia?.total || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-indigo-600" />
              Acciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BoletinView 
              row={boletinActual} 
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Boletin Completo
                </Button>
              }
            />
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              <Download className={`h-4 w-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Comentario general si existe */}
      {boletinActual.comentario && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Comentario General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {boletinActual.comentario}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
