// Sistema unificado de validaciones para SchoolFlow

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

// Validaciones comunes
export const commonValidations = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value) return 'El email es requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'El formato del email no es válido';
      }
      return null;
    }
  },
  
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (!value) return 'La contraseña es requerida';
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      return null;
    }
  },
  
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      if (!value?.trim()) return 'El nombre es requerido';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
      if (value.trim().length > 50) return 'El nombre no puede exceder 50 caracteres';
      return null;
    }
  },
  
  grade: {
    required: true,
    custom: (value: number | string) => {
      if (value === null || value === undefined || value === '') {
        return 'La calificación es requerida';
      }
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return 'La calificación debe ser un número';
      if (numValue < 0 || numValue > 10) return 'La calificación debe estar entre 0 y 10';
      return null;
    }
  },
  
  date: {
    required: true,
    custom: (value: string) => {
      if (!value) return 'La fecha es requerida';
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'La fecha no es válida';
      return null;
    }
  },
  
  courseId: {
    required: true,
    custom: (value: string) => {
      if (!value?.trim()) return 'El curso es requerido';
      return null;
    }
  },
  
  subjectId: {
    required: true,
    custom: (value: string) => {
      if (!value?.trim()) return 'La materia es requerida';
      return null;
    }
  },
  
  studentIds: {
    required: true,
    custom: (value: string[]) => {
      if (!value || value.length === 0) return 'Debe seleccionar al menos un estudiante';
      return null;
    }
  }
};

// Función principal de validación
export function validateField(value: any, rules: ValidationRule): string | null {
  // Validación requerida
  if (rules.required && (value === null || value === undefined || value === '')) {
    return 'Este campo es requerido';
  }
  
  // Si no es requerido y está vacío, no validar más
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null;
  }
  
  // Validación de longitud mínima
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return `Debe tener al menos ${rules.minLength} caracteres`;
  }
  
  // Validación de longitud máxima
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return `No puede exceder ${rules.maxLength} caracteres`;
  }
  
  // Validación de patrón
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return 'El formato no es válido';
  }
  
  // Validación personalizada
  if (rules.custom) {
    return rules.custom(value);
  }
  
  return null;
}

// Validar múltiples campos
export function validateForm(data: any, schema: ValidationSchema): ValidationResult {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules);
    if (error) {
      errors.push(`${field}: ${error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validaciones específicas para formularios
export const formValidations = {
  // Validación de usuario
  user: {
    name: commonValidations.name,
    email: commonValidations.email,
    password: commonValidations.password,
    role: {
      required: true,
      custom: (value: string) => {
        if (!value) return 'El rol es requerido';
        if (!['admin', 'docente', 'alumno'].includes(value)) {
          return 'El rol debe ser admin, docente o alumno';
        }
        return null;
      }
    }
  },
  
  // Validación de calificación
  grade: {
    studentId: {
      required: true,
      custom: (value: string) => {
        if (!value?.trim()) return 'El estudiante es requerido';
        return null;
      }
    },
    subjectId: commonValidations.subjectId,
    valor: commonValidations.grade,
    fecha: commonValidations.date,
    actividad: {
      required: true,
      minLength: 3,
      maxLength: 100,
      custom: (value: string) => {
        if (!value?.trim()) return 'La actividad es requerida';
        if (value.trim().length < 3) return 'La actividad debe tener al menos 3 caracteres';
        if (value.trim().length > 100) return 'La actividad no puede exceder 100 caracteres';
        return null;
      }
    }
  },
  
  // Validación de asistencia
  attendance: {
    studentId: {
      required: true,
      custom: (value: string) => {
        if (!value?.trim()) return 'El estudiante es requerido';
        return null;
      }
    },
    courseId: commonValidations.courseId,
    subject: {
      required: true,
      custom: (value: string) => {
        if (!value?.trim()) return 'La materia es requerida';
        return null;
      }
    },
    date: commonValidations.date
  },
  
  // Validación de alerta
  alert: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 100,
      custom: (value: string) => {
        if (!value?.trim()) return 'El título es requerido';
        if (value.trim().length < 5) return 'El título debe tener al menos 5 caracteres';
        if (value.trim().length > 100) return 'El título no puede exceder 100 caracteres';
        return null;
      }
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 500,
      custom: (value: string) => {
        if (!value?.trim()) return 'La descripción es requerida';
        if (value.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres';
        if (value.trim().length > 500) return 'La descripción no puede exceder 500 caracteres';
        return null;
      }
    },
    type: {
      required: true,
      custom: (value: string) => {
        if (!value) return 'El tipo de alerta es requerido';
        if (!['academic', 'attendance', 'behavior', 'general'].includes(value)) {
          return 'El tipo debe ser academic, attendance, behavior o general';
        }
        return null;
      }
    },
    priority: {
      required: true,
      custom: (value: string) => {
        if (!value) return 'La prioridad es requerida';
        if (!['low', 'medium', 'high', 'critical'].includes(value)) {
          return 'La prioridad debe ser low, medium, high o critical';
        }
        return null;
      }
    }
  }
};

// Utilidades de validación
export const validationUtils = {
  // Validar email único
  async validateUniqueEmail(email: string, excludeUserId?: string): Promise<string | null> {
    // Esta función debería hacer una consulta a Firestore
    // Por ahora retorna null (válido)
    return null;
  },
  
  // Validar que la fecha no sea futura
  validateNotFutureDate(date: string): string | null {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    
    if (selectedDate > today) {
      return 'La fecha no puede ser futura';
    }
    return null;
  },
  
  // Validar que la fecha no sea muy antigua
  validateNotTooOldDate(date: string, maxDaysOld: number = 365): string | null {
    const selectedDate = new Date(date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDaysOld);
    
    if (selectedDate < cutoffDate) {
      return `La fecha no puede ser anterior a ${maxDaysOld} días`;
    }
    return null;
  },
  
  // Validar rango de fechas
  validateDateRange(startDate: string, endDate: string): string | null {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return 'La fecha de inicio no puede ser posterior a la fecha de fin';
    }
    return null;
  }
};

export default {
  validateField,
  validateForm,
  commonValidations,
  formValidations,
  validationUtils
}; 