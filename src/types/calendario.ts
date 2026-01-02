export interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tipo: 'tarea' | 'reunion' | 'evento' | 'examen';
  descripcion?: string;
  allDay?: boolean;
  color?: string;
  metadata?: {
    tareaId?: string;
    reunionId?: string;
    eventoId?: string;
    courseId?: string;
    subjectId?: string;
    studentId?: string;
    teacherId?: string;
    status?: string;
    priority?: string;
  };
}

export interface EventoEscolar {
  firestoreId: string;
  title: string;
  descripcion: string;
  fecha: string;
  fechaFin?: string;
  tipo: 'examen' | 'evento' | 'festivo' | 'reunion_general' | 'otro';
  allDay: boolean;
  courseId?: string;
  subjectId?: string;
  createdBy: string;
  createdAt: string;
  color?: string;
}

