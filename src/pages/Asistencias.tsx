import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
// import { Link } from "react-router-dom"; // Comentado para el demo
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { Users, Calendar, ChevronRight, BookOpen, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Asistencias() {
  // Mock data para el demo

  const { data: courses, loading = false } =  useFirestoreCollection("courses");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen ">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white shadow-sm border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Control de Asistencias
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Gestiona la asistencia por curso de manera eficiente
              </p>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{courses?.length || 0} cursos disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              <span>Sistema académico integrado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        {courses?.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cursos disponibles</h3>
            <p className="text-gray-600">Agrega cursos para comenzar a gestionar las asistencias</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses?.map((course, index) => (
              <Link
                to={`/asistencias/detalles?id=${course.firestoreId}`}
                key={course.firestoreId || index}
                className="group block transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'slideInUp 0.6s ease-out forwards'
                }}
              >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-blue-50/50">
                  {/* Decorative Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full"></div>
                  </div>
                  
                  <CardContent className="p-6 relative">
                    {/* Course Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-300">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>

                    {/* Course Info */}
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300 line-clamp-2">
                        {course.nombre} - {course.division}
                      </CardTitle>
                      <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                        Ver y gestionar asistencias
                      </p>
                    </div>

                    {/* Action Indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-100 group-hover:border-blue-200 transition-colors duration-300">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        <Calendar className="h-4 w-4" />
                        <span>Registrar asistencia</span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg transition-colors duration-300"></div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}