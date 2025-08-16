/**
 * Sistema de traducciones centralizado para SchoolFlow MVP
 * Resuelve inconsistencias de idioma inglés/español en la interfaz
 */

export const translations = {
  // Acciones comunes
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    update: 'Actualizar',
    create: 'Crear',
    new: 'Nuevo',
    add: 'Agregar',
    remove: 'Eliminar',
    clear: 'Limpiar',
    reset: 'Restablecer',
    submit: 'Enviar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    view: 'Ver',
    show: 'Mostrar',
    hide: 'Ocultar',
    export: 'Exportar',
    import: 'Importar'
  },

  // Estados del sistema
  states: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    processing: 'Procesando...',
    saving: 'Guardando...',
    deleting: 'Eliminando...',
    updating: 'Actualizando...'
  },

  // Niveles de prioridad
  priority: {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
  },

  // Etiquetas de prioridad con contexto
  priorityLabels: {
    'priority-low': 'Prioridad Baja',
    'priority-medium': 'Prioridad Media', 
    'priority-high': 'Prioridad Alta',
    'priority-critical': 'Prioridad Crítica'
  },

  // Mensajes de validación
  validation: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Email inválido',
    invalidNumber: 'Debe ser un número válido',
    invalidRange: 'Fuera del rango permitido',
    tooShort: 'Muy corto',
    tooLong: 'Muy largo',
    invalidDate: 'Fecha inválida'
  },

  // Mensajes del sistema
  messages: {
    dataLoaded: 'Datos cargados correctamente',
    dataSaved: 'Datos guardados correctamente',
    dataDeleted: 'Datos eliminados correctamente',
    noData: 'No hay datos disponibles',
    noResults: 'No se encontraron resultados',
    confirmDelete: '¿Estás seguro de que deseas eliminar?',
    unsavedChanges: 'Tienes cambios sin guardar'
  },

  // Módulos específicos
  modules: {
    attendance: {
      present: 'Presente',
      absent: 'Ausente',
      late: 'Tardanza',
      justified: 'Justificado',
      unjustified: 'Injustificado'
    },
    grades: {
      grade: 'Calificación',
      average: 'Promedio',
      subject: 'Materia',
      assignment: 'Actividad',
      exam: 'Examen',
      project: 'Proyecto'
    },
    alerts: {
      academicRisk: 'Riesgo Académico',
      attendanceIssue: 'Problema de Asistencia',
      behavioralIssue: 'Problema Conductual',
      improvementNoticed: 'Mejora Detectada'
    }
  },

  // Exportación de datos
  export: {
    csv: 'Exportar CSV',
    xlsx: 'Exportar XLSX',
    pdf: 'Exportar PDF',
    exporting: 'Exportando...',
    exported: 'Exportado correctamente',
    exportError: 'Error al exportar'
  },

  // Navegación y UI
  navigation: {
    dashboard: 'Panel Principal',
    students: 'Estudiantes',
    teachers: 'Docentes',
    courses: 'Cursos',
    grades: 'Calificaciones',
    attendance: 'Asistencias',
    reports: 'Reportes',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión'
  },

  kpis: {
    totalStudents: 'Estudiantes',
    totalTeachers: 'Docentes',
    totalCourses: 'Cursos',
    avgAttendance: 'Asistencia Promedio',
    avgGrades: 'Promedio General',
    criticalAlerts: 'Alertas Críticas',
    myCourses: 'Mis Cursos',
    myStudents: 'Mis Estudiantes',
    myAttendanceDocente: 'Asistencia Promedio',
    myGrades: 'Promedio General',
    myAverage: 'Mi Promedio',
    myAttendance: 'Mi Asistencia',
    approvedSubjects: 'Materias Aprobadas',
    totalSubjects: 'Total Materias'
  }
};

/**
 * Hook para usar traducciones
 * @param key - Clave de traducción en formato dot notation
 * @returns Texto traducido o la clave si no se encuentra
 */
export function useTranslation(key: string): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Función helper para traducciones rápidas
 */
export const t = useTranslation;

/**
 * Funciones auxiliares para elementos comunes de la UI
 */
export const UITranslations = {
  // Etiquetas de prioridad consistentes
  getPriorityLabel: (priority: string): string => {
    const priorityMap: Record<string, string> = {
      'critical': 'Crítica',
      'high': 'Alta', 
      'medium': 'Media',
      'low': 'Baja',
      'critica': 'Crítica',
      'alta': 'Alta',
      'media': 'Media', 
      'baja': 'Baja'
    };
    return priorityMap[priority.toLowerCase()] || priority;
  },

  // Etiquetas de tipo de alerta
  getAlertTypeLabel: (type: string): string => {
    const typeMap: Record<string, string> = {
      'academic': 'Académica',
      'attendance': 'Asistencia', 
      'behavior': 'Comportamiento',
      'general': 'General',
      'rendimiento_critico': 'Rendimiento Crítico',
      'asistencia_critica': 'Asistencia Crítica',
      'tendencia': 'Tendencia',
      'mejora': 'Mejora'
    };
    return typeMap[type.toLowerCase()] || type;
  },

  // Estados comunes
  getStatusLabel: (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'pending': 'Pendiente',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'draft': 'Borrador',
      'published': 'Publicado'
    };
    return statusMap[status.toLowerCase()] || status;
  },

  // Acciones comunes
  getActionLabel: (action: string): string => {
    const actionMap: Record<string, string> = {
      'edit': 'Editar',
      'view': 'Ver',
      'delete': 'Eliminar',
      'add': 'Agregar',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'create': 'Crear',
      'update': 'Actualizar',
      'export': 'Exportar',
      'import': 'Importar',
      'download': 'Descargar',
      'upload': 'Subir'
    };
    return actionMap[action.toLowerCase()] || action;
  }
};


