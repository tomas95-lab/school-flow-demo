"use client";

import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { BookOpen, Users, GraduationCap, TrendingUp, Plus } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import type { Course } from "@/components/CourseCard";
import { StatsCard } from "./StatCards";


// Componente de estado vacío mejorado
const EmptyState = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-8 mb-8">
      <BookOpen className="h-16 w-16 text-indigo-600" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">
      ¡Comienza a gestionar tu institución!
    </h3>
    <p className="text-gray-600 max-w-md mb-8">
      No hay cursos registrados aún. Crea el primer curso para comenzar a administrar asistencias y estudiantes.
    </p>
    <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
      <Plus className="h-5 w-5" />
      Crear Primer Curso
    </button>
  </div>
)


export default function AdminAttendanceOverview() {
  const { data: courses = []} = useFirestoreCollection<Course>("courses");
  const {data: students} = useFirestoreCollection("students");
  const {data: teachers} = useFirestoreCollection("teachers");
  const {data: subjects} = useFirestoreCollection("subjects");
  const {data: attendances} = useFirestoreCollection("attendances")



  // Calcular estadísticas para el dashboard
  const totalCourses = courses.length;
  const totalTeachers = teachers.length;
  const totalStudents = students.length
  const totalAsistencia = subjects.length
  
  let presentes = (attendances.filter((attendance) => attendance.presente == true)).length

  const avgAttendance = Math.round((totalAsistencia / presentes) * 100);

  return (
      <div>
        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                icon={BookOpen}
                label="Total Cursos"
                value={totalCourses}
                subtitle="Cursos activos"
                color="indigo"
              />
              <StatsCard 
                icon={Users}
                label="Estudiantes"
                value={totalStudents}
                subtitle="Total matriculados"
                color="green"
              />
              <StatsCard 
                icon={GraduationCap}
                label="Docentes"
                value={totalTeachers}
                // value={32}
                subtitle="Profesores activos"
                color="purple"
              />
              <StatsCard 
                icon={TrendingUp}
                label="Asistencia"
                value={`${avgAttendance}%`}
                subtitle="Promedio general"
                color="blue"
              />
            </div>

            {/* Lista de Cursos */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos los Cursos ({totalCourses})
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Todos los cursos activos</span>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                Administra cursos, revisa asistencias y gestiona información académica
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course, index) => (
                <div key={course.firestoreId || index} className="transform transition-all duration-200 hover:scale-105">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            {/* Footer con información adicional */}
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Centro de Ayuda</h3>
                  <p className="text-gray-600 mb-4">
                    ¿Necesitas ayuda con la administración del sistema? Consulta nuestros recursos.
                  </p>
                  <div className="flex gap-3">
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Guía de usuario
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                      Soporte técnico
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Última Actualización</h3>
                  <p className="text-gray-600">
                    Los datos fueron actualizados por última vez hace pocos minutos. 
                    El sistema se sincroniza automáticamente cada 5 minutos.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}