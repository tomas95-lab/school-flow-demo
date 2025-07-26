import { useMemo } from "react";
import { useFirestoreCollection } from "./useFireStoreCollection";
import type { Course, Subject } from "@/types";

/**
 * Hook personalizado para obtener los cursos del docente de forma estandarizada
 * 
 * Lógica: Docente → Materias → Cursos (a través de subject.cursoId)
 * Esto es más consistente porque un docente puede enseñar múltiples materias
 * en diferentes cursos, y las materias son la relación real entre docente y curso.
 */
export function useTeacherCourses(teacherId?: string) {
  const { data: courses } = useFirestoreCollection<Course>("courses");
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");

  const teacherCourses = useMemo(() => {
    if (!teacherId || !courses || !subjects) return [];

    // 1. Obtener materias del docente
    const teacherSubjects = subjects.filter(s => s.teacherId === teacherId);
    
    if (teacherSubjects.length === 0) return [];

    // 2. Obtener IDs de cursos donde enseña
    const teacherCourseIds = new Set<string>();
    teacherSubjects.forEach(subject => {
      if (Array.isArray(subject.cursoId)) {
        subject.cursoId.forEach(courseId => {
          if (courseId) teacherCourseIds.add(courseId);
        });
      } else if (subject.cursoId) {
        teacherCourseIds.add(subject.cursoId);
      }
    });

    // 3. Filtrar cursos
    return courses.filter(course => 
      course.firestoreId && teacherCourseIds.has(course.firestoreId)
    );
  }, [teacherId, courses, subjects]);

  const teacherSubjects = useMemo(() => {
    if (!teacherId || !subjects) return [];
    return subjects.filter(s => s.teacherId === teacherId);
  }, [teacherId, subjects]);

  return {
    teacherCourses,
    teacherSubjects,
    isLoading: !courses || !subjects
  };
}

/**
 * Hook para obtener estudiantes de los cursos del docente
 */
export function useTeacherStudents(teacherId?: string) {
  const { data: students } = useFirestoreCollection("students");
  const { teacherCourses } = useTeacherCourses(teacherId);

  const teacherStudents = useMemo(() => {
    if (!students || !teacherCourses.length) return [];

    const courseIds = teacherCourses.map(c => c.firestoreId);
    return students.filter(student => 
      student.cursoId && courseIds.includes(student.cursoId)
    );
  }, [students, teacherCourses]);

  return {
    teacherStudents,
    isLoading: !students
  };
}

/**
 * Hook para obtener materias específicas del docente en un curso
 */
export function useTeacherSubjectsInCourse(teacherId?: string, courseId?: string) {
  const { teacherSubjects } = useTeacherCourses(teacherId);

  const subjectsInCourse = useMemo(() => {
    if (!courseId || !teacherSubjects.length) return [];

    return teacherSubjects.filter(subject => {
      if (Array.isArray(subject.cursoId)) {
        return subject.cursoId.includes(courseId);
      }
      return subject.cursoId === courseId;
    });
  }, [teacherSubjects, courseId]);

  return subjectsInCourse;
} 