/**
 * Verifica si una materia pertenece a un curso específico
 * @param subject - La materia a verificar
 * @param courseId - El ID del curso
 * @returns true si la materia pertenece al curso
 */
export function subjectBelongsToCourse(subject: { cursoId: string | string[] }, courseId: string): boolean {
  if (!subject.cursoId || !courseId) return false;
  
  if (Array.isArray(subject.cursoId)) {
    return subject.cursoId.includes(courseId);
  }
  
  // Fallback para strings (compatibilidad)
  if (typeof subject.cursoId === 'string') {
    if (subject.cursoId.includes(',')) {
      const courseIds = subject.cursoId.split(',').map(id => id.trim());
      return courseIds.includes(courseId);
    }
    return subject.cursoId === courseId;
  }
  
  return false;
}

/**
 * Filtra materias por curso
 * @param subjects - Array de materias
 * @param courseId - ID del curso
 * @returns Array de materias que pertenecen al curso
 */
export function filterSubjectsByCourse<T extends { cursoId: string | string[] }>(
  subjects: T[],
  courseId: string
): T[] {
  if (!courseId) return [];
  return subjects.filter(subject => subjectBelongsToCourse(subject, courseId));
} 
