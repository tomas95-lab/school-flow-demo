// Tipos base para el sistema
export interface User {
  uid: string;
  id?: string;
  email: string | null;
  name: string | null;
  role: 'admin' | 'docente' | 'alumno' | 'familiar';
  teacherId: string;
  studentId: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
  createdBy?: string;
  updatedBy?: string;
}

export interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
  año: string;
  creadoEn?: string;
  status?: 'active' | 'inactive';
}

export interface Subject {
  firestoreId: string;
  nombre: string;
  cursoId: string;
  teacherId?: string;
  creadoEn?: string;
  status?: 'active' | 'inactive';
}

export interface Student {
  firestoreId: string;
  nombre: string;
  apellido: string;
  cursoId: string;
  email?: string | null;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Teacher {
  firestoreId: string;
  nombre: string;
  apellido: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Attendance {
  firestoreId: string;
  studentId: string;
  subjectId: string;
  fecha: string;
  presente: boolean;
  justificada?: boolean;
  comentario?: string;
  creadoEn?: string;
  creadoPor?: string;
}

export interface Grade {
  firestoreId: string;
  studentId: string;
  subjectId: string;
  Actividad: string;
  valor: number | null;
  ausente: boolean;
  fecha: string;
  Comentario?: string;
  creadoEn?: string;
  creadoPor?: string;
}

export interface Alert {
  firestoreId: string;
  title: string;
  description: string;
  type: 'academic' | 'behavioral' | 'attendance' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  courseId?: string;
  courseName?: string;
  selectedStudents?: string[];
  selectedCourse?: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'expired';
  readBy: string[];
  expiresAt?: string;
  customMessage?: string;
  targetUserId?: string;
}

// Tipos para formularios
export interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'alumno' | 'familiar';
  status: 'active' | 'inactive';
  password: string;
  confirmPassword: string;
}

export interface AlertFormData {
  title: string;
  description: string;
  type: 'academic' | 'behavioral' | 'attendance' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  courseId: string;
  courseName: string;
  isActive: boolean;
  expiresAt: string;
  customMessage: string;
  targetUserId: string;
  selectedStudents: string[];
  selectedCourse: string;
}

export interface GradeFormData {
  actividad: string;
  valor: string;
  fecha: string;
  comentario: string;
}

// Tipos para tablas
export interface CalificacionesRow {
  firestoreId: string;
  Nombre: string;
  Materia: string;
  Actividad: string;
  Valor: number | null;
  fecha: string;
  Comentario?: string;
  ausente: boolean;
}

export interface AttendanceRow {
  firestoreId: string;
  Estudiante: string;
  Materia: string;
  Fecha: string;
  Presente: boolean;
  Justificada?: boolean;
  Comentario?: string;
}

export interface UserRow {
  firestoreId: string;
  Nombre: string;
  Email: string;
  Rol: string;
  Estado: string;
  UltimoAcceso?: string;
}

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CSVStudent {
  nombre: string;
  apellido: string;
  cursoId: string;
  email?: string;
  status?: string;
}

// Tipos para errores
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: string;
}

// Tipos para hooks
export interface FirestoreCollectionOptions {
  limit?: number;
  orderBy?: string;
  enableCache?: boolean;
  dependencies?: unknown[];
}

// Tipos para componentes
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface TableColumn {
  accessorKey: string;
  header: string;
  cell?: (props: { row: { original: Record<string, unknown> } }) => React.ReactNode;
}

// Tipos para estadísticas
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalAlerts: number;
  attendanceRate?: number;
  averageGrade?: number;
}

// Tipos para filtros
export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  course?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
} 