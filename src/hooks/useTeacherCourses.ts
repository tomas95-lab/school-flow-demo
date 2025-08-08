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
    if (!teacherId || !courses) return [];

    // Cursos asignados por teacherId directamente
    const coursesByTeacherId = courses.filter(course => course.teacherId === teacherId);

    // Cursos inferidos por materias (subjects) del docente
    const teacherSubjects = (subjects || []).filter(s => s.teacherId === teacherId);
    const subjectCourseIds = new Set<string>();
    teacherSubjects.forEach(subject => {
      if (Array.isArray((subject as any).cursoId)) {
        (subject as any).cursoId.forEach((courseId: string) => {
          const id = typeof courseId === 'string' ? courseId.trim() : courseId;
          if (id) subjectCourseIds.add(id);
        });
      } else if ((subject as any).cursoId) {
        const id = typeof (subject as any).cursoId === 'string' ? (subject as any).cursoId.trim() : (subject as any).cursoId;
        if (id) subjectCourseIds.add(id as string);
      }
    });
    const coursesBySubjects = courses.filter(course => course.firestoreId && subjectCourseIds.has(course.firestoreId));

    // Unión única por firestoreId
    const uniqueById = new Map<string, Course>();
    [...coursesByTeacherId, ...coursesBySubjects].forEach(c => {
      if (c.firestoreId) uniqueById.set(c.firestoreId, c);
    });
    return Array.from(uniqueById.values());
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
  const { data: teachers } = useFirestoreCollection("teachers");

  const teacherStudents = useMemo(() => {
    if (!students) return [];

    const courseIdSet = new Set<string>();
    teacherCourses.forEach(c => { if (c.firestoreId) courseIdSet.add(c.firestoreId); });

    // Incluir cursoId(s) legacy del teacher si existen
    const teacherDoc = teachers?.find((t: any) => t.firestoreId === teacherId);
    const raw = teacherDoc?.cursoId;
    if (Array.isArray(raw)) raw.forEach((id: string) => { if (typeof id === 'string' && id.trim()) courseIdSet.add(id.trim()); });
    else if (typeof raw === 'string' && raw.trim()) courseIdSet.add(raw.trim());

    if (courseIdSet.size === 0) return [];
    return students.filter((student: any) => {
      const cid = (student.cursoId || student.courseId || '').toString().trim();
      return cid && courseIdSet.has(cid);
    });
  }, [students, teacherCourses, teachers, teacherId]);

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