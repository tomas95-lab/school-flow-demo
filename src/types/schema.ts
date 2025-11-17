import type { User, Course, Subject, Student, Teacher, Attendance, Grade, Alert, Message, Tarea } from './index';

// Mapa colección → tipo de documento
export type CollectionsMap = {
  users: User;
  teachers: Teacher;
  students: Student;
  courses: Course;
  subjects: Subject;
  attendances: Attendance;
  calificaciones: Grade;
  alerts: Alert;
  messages: Message;
  tareas: Tarea;
};

export type CollectionName = keyof CollectionsMap;

// Helper para obtener el tipo de un documento desde el nombre de colección
export type DocumentOf<C extends CollectionName> = CollectionsMap[C];

// Campos comunes que muchas colecciones usan
export type WithTimestamps<T> = T & { createdAt?: unknown; updatedAt?: unknown };

// Definiciones de relaciones principales (para documentación interna y validación en runtime si se desea)
export const Relations = {
  SubjectBelongsToCourse: {
    from: 'subjects',
    to: 'courses',
    localField: 'cursoId',
    foreignField: 'firestoreId',
  },
  SubjectBelongsToTeacher: {
    from: 'subjects',
    to: 'teachers',
    localField: 'teacherId',
    foreignField: 'firestoreId',
  },
  StudentBelongsToCourse: {
    from: 'students',
    to: 'courses',
    localField: 'cursoId',
    foreignField: 'firestoreId',
  },
  AttendanceRelations: {
    studentId: { to: 'students' },
    courseId: { to: 'courses' },
    subjectId: { to: 'subjects' },
  },
} as const;


