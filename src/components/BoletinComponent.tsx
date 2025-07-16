import { useState } from 'react';
import { 
  GraduationCap, 
  User, 
  Download, 
  Eye,
  EyeOff,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react';
import { generarPDFBoletin } from '@/utils/boletines';

export function BoletinComponent({ row }: { row: any }) {
  const [showComments, setShowComments] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'name'>('name');
  const [isDownloading, setIsDownloading] = useState(false);

  // Función para manejar la descarga del PDF
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await generarPDFBoletin(row);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Función para obtener el color de la calificación
  const getGradeColor = (grade: number) => {
    if (grade >= 9.0) return 'text-emerald-600';
    if (grade >= 8.0) return 'text-blue-600';
    if (grade >= 7.0) return 'text-amber-600';
    if (grade >= 6.0) return 'text-orange-600';
    return 'text-red-600';
  };

  // Función para obtener el estado
  const getStatusColor = (grade: number) => {
    return grade >= 7.0 
      ? 'text-emerald-700 bg-emerald-100' 
      : 'text-red-700 bg-red-100';
  };

  // Función para obtener el color de asistencia
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  // Función para ordenar materias
  const getSortedMaterias = () => {
    if (!row.materias) return [];
    
    const sorted = [...row.materias];
    switch (sortOrder) {
      case 'asc':
        return sorted.sort((a, b) => {
          const avgA = (a.t1 + a.t2 + a.t3) / 3;
          const avgB = (b.t1 + b.t2 + b.t3) / 3;
          return avgA - avgB;
        });
      case 'desc':
        return sorted.sort((a, b) => {
          const avgA = (a.t1 + a.t2 + a.t3) / 3;
          const avgB = (b.t1 + b.t2 + b.t3) / 3;
          return avgB - avgA;
        });
      case 'name':
      default:
        return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
  };

  // Obtener estadísticas
  type Materia = {
    nombre: string;
    t1: number;
    t2: number;
    t3: number;
  };

  const stats = {
    totalMaterias: (row.materias as Materia[] | undefined)?.length || 0,
    materiasAprobadas: (row.materias as Materia[] | undefined)?.filter((m: Materia) => {
      const promedio = (m.t1 + m.t2 + m.t3) / 3;
      return promedio >= 7.0;
    }).length || 0,
    materiasDestacadas: (row.materias as Materia[] | undefined)?.filter((m: Materia) => {
      const promedio = (m.t1 + m.t2 + m.t3) / 3;
      return promedio >= 9.0;
    }).length || 0,
    materiasEnRiesgo: (row.materias as Materia[] | undefined)?.filter((m: Materia) => {
      const promedio = (m.t1 + m.t2 + m.t3) / 3;
      return promedio < 7.0;
    }).length || 0
  };

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-indigo-100 p-2 md:p-3 rounded-xl">
              <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Boletín de Calificaciones</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {row.periodo ? `Período ${row.periodo}` : 'Período Académico'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              isDownloading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isDownloading ? 'Generando...' : 'Descargar'}</span>
            <span className="sm:hidden">{isDownloading ? '...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Información del estudiante y asistencia */}
      <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Estudiante</p>
              <p className="font-semibold text-gray-900">{row.Nombre}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Promedio</p>
              <p className={`font-bold ${getGradeColor(row.promediototal)}`}>
                {row.promediototal.toFixed(1)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <p className={`font-semibold ${row.estado === 'cerrado' ? 'text-gray-600' : 'text-emerald-600'}`}>
                {row.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Alertas</p>
              <p className={`font-semibold ${row.alertas > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {row.alertas}
              </p>
            </div>
          </div>

          {row.asistencia && (
            <>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Asistencia</p>
                  <p className={`font-semibold ${getAttendanceColor(row.asistencia.porcentaje)}`}>
                    {row.asistencia.porcentaje}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Clases</p>
                  <p className="font-semibold text-gray-900">
                    {row.asistencia.presentes}/{row.asistencia.total}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-4 md:px-8 py-4 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalMaterias}</div>
            <div className="text-xs md:text-sm text-gray-600">Total Materias</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-emerald-600">{stats.materiasAprobadas}</div>
            <div className="text-xs md:text-sm text-gray-600">Aprobadas</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{stats.materiasDestacadas}</div>
            <div className="text-xs md:text-sm text-gray-600">Destacadas</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-red-600">{stats.materiasEnRiesgo}</div>
            <div className="text-xs md:text-sm text-gray-600">En Riesgo</div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <button
            onClick={() => setShowComments(!showComments)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
          >
            {showComments ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{showComments ? 'Ocultar' : 'Mostrar'} Comentarios</span>
            <span className="sm:hidden">{showComments ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Ordenar por:</span>
            <span className="text-sm text-gray-600 sm:hidden">Orden:</span>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc' | 'name')}
              className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Nombre</option>
              <option value="desc">Promedio (Mayor a Menor)</option>
              <option value="asc">Promedio (Menor a Mayor)</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 text-sm md:text-base">Asignatura</th>
                <th className="text-center px-2 md:px-4 py-3 md:py-4 font-semibold text-gray-900 text-sm md:text-base">T1</th>
                <th className="text-center px-2 md:px-4 py-3 md:py-4 font-semibold text-gray-900 text-sm md:text-base">T2</th>
                <th className="text-center px-2 md:px-4 py-3 md:py-4 font-semibold text-gray-900 text-sm md:text-base">T3</th>
                {showComments && (
                  <th className="text-left px-3 md:px-6 py-3 md:py-4 font-semibold text-gray-900 text-sm md:text-base">Observaciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {getSortedMaterias().map((materia, index) => {
                const promedioGeneral = (materia.t1 + materia.t2 + materia.t3) / 3;
                return (
                  <tr 
                    key={`${materia.nombre}-${index}`}
                    className={`border-t border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="font-medium text-gray-900 text-sm md:text-base">{materia.nombre}</div>
                    </td>
                    <td className="text-center px-2 md:px-4 py-3 md:py-4">
                      <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getGradeColor(materia.t1)}`}>
                        {materia.t1.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-center px-2 md:px-4 py-3 md:py-4">
                      <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getGradeColor(materia.t2)}`}>
                        {materia.t2.toFixed(1)}
                      </span>
                    </td>
                    <td className="text-center px-2 md:px-4 py-3 md:py-4">
                      <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getGradeColor(materia.t3)}`}>
                        {materia.t3.toFixed(1)}
                      </span>
                    </td>
                    {showComments && (
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="text-xs md:text-sm text-gray-600 max-w-xs">
                          {promedioGeneral >= 9.0 && 'Excelente desempeño académico'}
                          {promedioGeneral >= 8.0 && promedioGeneral < 9.0 && 'Muy buen rendimiento'}
                          {promedioGeneral >= 7.0 && promedioGeneral < 8.0 && 'Buen desempeño'}
                          {promedioGeneral >= 6.0 && promedioGeneral < 7.0 && 'Requiere mejora'}
                          {promedioGeneral < 6.0 && 'Necesita apoyo adicional'}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Comentario general */}
        {row.comentario && (
          <div className="mt-4 md:mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="flex items-center space-x-2 text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <span>Comentario General</span>
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              {row.comentario}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-gray-500 border-t border-gray-200 pt-4 md:pt-6">
          <p>Documento generado automáticamente - Sistema de Gestión Escolar</p>
          <p className="mt-1">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
    </div>
  )
}

