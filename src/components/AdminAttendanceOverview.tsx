"use client";

import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { Calendar, BookOpen, GraduationCap } from "lucide-react";
import { CourseCard } from "./CourseCard";
import type { Course } from "./CourseCard";

export default function AdminAttendanceOverview() {
  const { data: courses = [], loading } = useFirestoreCollection<Course>("courses");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    );
  }

  return (
      <div className="p-8">
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay cursos disponibles
            </h3>
            <p className="text-gray-600">
              Agrega cursos para comenzar a gestionar las asistencias
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <CourseCard course={course} key={course.firestoreId || index} />
            ))}
          </div>
        )}
        
      </div>

      
  );
}
