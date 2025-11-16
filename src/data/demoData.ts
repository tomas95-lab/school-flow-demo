// Datos demo para el sistema cuando está en modo demo
export const DEMO_DATA = {
  students: [
    {
      firestoreId: 'demo-student-1',
      nombre: 'María García',
      apellido: 'López',
      cursoId: 'demo-course-1',
      email: 'maria.garcia@demo.com'
    },
    {
      firestoreId: 'demo-student-2',
      nombre: 'Juan Pérez',
      apellido: 'Martínez',
      cursoId: 'demo-course-1',
      email: 'juan.perez@demo.com'
    },
    {
      firestoreId: 'demo-student-3',
      nombre: 'Ana Rodríguez',
      apellido: 'González',
      cursoId: 'demo-course-2',
      email: 'ana.rodriguez@demo.com'
    }
  ],
  
  courses: [
    {
      firestoreId: 'demo-course-1',
      nombre: '1°A',
      division: 'A',
      año: 1,
      teacherId: 'demo-teacher-1'
    },
    {
      firestoreId: 'demo-course-2',
      nombre: '1°B',
      division: 'B',
      año: 1,
      teacherId: 'demo-teacher-2'
    }
  ],
  
  subjects: [
    {
      firestoreId: 'demo-subject-1',
      nombre: 'Matemática',
      cursoId: 'demo-course-1',
      teacherId: 'demo-teacher-1'
    },
    {
      firestoreId: 'demo-subject-2',
      nombre: 'Lengua',
      cursoId: 'demo-course-1',
      teacherId: 'demo-teacher-1'
    },
    {
      firestoreId: 'demo-subject-3',
      nombre: 'Ciencias',
      cursoId: 'demo-course-1',
      teacherId: 'demo-teacher-1'
    },
    {
      firestoreId: 'demo-subject-4',
      nombre: 'Historia',
      cursoId: 'demo-course-1',
      teacherId: 'demo-teacher-1'
    }
  ],
  
  teachers: [
    {
      firestoreId: 'demo-teacher-1',
      nombre: 'Prof. Carlos Mendoza',
      subjects: ['demo-subject-1', 'demo-subject-2']
    },
    {
      firestoreId: 'demo-teacher-2',
      nombre: 'Prof. Laura Silva',
      subjects: ['demo-subject-3', 'demo-subject-4']
    }
  ],
  
  calificaciones: [
    // María García - Matemática
    { studentId: 'demo-student-1', subjectId: 'demo-subject-1', valor: 8.5, fecha: '2024-03-15' },
    { studentId: 'demo-student-1', subjectId: 'demo-subject-1', valor: 9.0, fecha: '2024-04-10' },
    { studentId: 'demo-student-1', subjectId: 'demo-subject-1', valor: 7.5, fecha: '2024-05-20' },
    
    // María García - Lengua
    { studentId: 'demo-student-1', subjectId: 'demo-subject-2', valor: 8.0, fecha: '2024-03-20' },
    { studentId: 'demo-student-1', subjectId: 'demo-subject-2', valor: 8.5, fecha: '2024-04-15' },
    { studentId: 'demo-student-1', subjectId: 'demo-subject-2', valor: 9.0, fecha: '2024-05-25' },
    
    // Juan Pérez - Matemática
    { studentId: 'demo-student-2', subjectId: 'demo-subject-1', valor: 6.5, fecha: '2024-03-15' },
    { studentId: 'demo-student-2', subjectId: 'demo-subject-1', valor: 7.0, fecha: '2024-04-10' },
    { studentId: 'demo-student-2', subjectId: 'demo-subject-1', valor: 6.0, fecha: '2024-05-20' },
    
    // Juan Pérez - Lengua
    { studentId: 'demo-student-2', subjectId: 'demo-subject-2', valor: 7.5, fecha: '2024-03-20' },
    { studentId: 'demo-student-2', subjectId: 'demo-subject-2', valor: 8.0, fecha: '2024-04-15' },
    { studentId: 'demo-student-2', subjectId: 'demo-subject-2', valor: 7.0, fecha: '2024-05-25' },
    
    // Ana Rodríguez - Ciencias
    { studentId: 'demo-student-3', subjectId: 'demo-subject-3', valor: 9.5, fecha: '2024-03-18' },
    { studentId: 'demo-student-3', subjectId: 'demo-subject-3', valor: 9.0, fecha: '2024-04-12' },
    { studentId: 'demo-student-3', subjectId: 'demo-subject-3', valor: 8.5, fecha: '2024-05-22' },
    
    // Ana Rodríguez - Historia
    { studentId: 'demo-student-3', subjectId: 'demo-subject-4', valor: 8.0, fecha: '2024-03-22' },
    { studentId: 'demo-student-3', subjectId: 'demo-subject-4', valor: 8.5, fecha: '2024-04-18' },
    { studentId: 'demo-student-3', subjectId: 'demo-subject-4', valor: 9.0, fecha: '2024-05-28' }
  ],
  
  attendances: [
    // María García - Presente la mayoría de días
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-01' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-02' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: false, fecha: '2024-03-03' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-04' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-05' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-08' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-09' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-10' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-11' },
    { studentId: 'demo-student-1', courseId: 'demo-course-1', present: true, fecha: '2024-03-12' },
    
    // Juan Pérez - Más ausencias
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: true, fecha: '2024-03-01' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: false, fecha: '2024-03-02' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: false, fecha: '2024-03-03' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: true, fecha: '2024-03-04' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: false, fecha: '2024-03-05' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: true, fecha: '2024-03-08' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: false, fecha: '2024-03-09' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: true, fecha: '2024-03-10' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: false, fecha: '2024-03-11' },
    { studentId: 'demo-student-2', courseId: 'demo-course-1', present: true, fecha: '2024-03-12' },
    
    // Ana Rodríguez - Excelente asistencia
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-01' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-02' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-03' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-04' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-05' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-08' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-09' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-10' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-11' },
    { studentId: 'demo-student-3', courseId: 'demo-course-2', present: true, fecha: '2024-03-12' }
  ],
  
  alerts: [
    {
      id: 'demo-alert-1',
      title: 'Riesgo Académico - Juan Pérez',
      description: 'Promedio por debajo de 7.0 en Matemática',
      type: 'academic',
      priority: 'high',
      status: 'pending',
      studentId: 'demo-student-2',
      createdAt: '2024-05-20T10:00:00Z',
      createdBy: 'demo-teacher-1'
    },
    {
      id: 'demo-alert-2',
      title: 'Ausentismo - Juan Pérez',
      description: 'Más del 30% de ausencias en el último mes',
      type: 'attendance',
      priority: 'medium',
      status: 'resolved',
      studentId: 'demo-student-2',
      createdAt: '2024-05-18T14:30:00Z',
      resolvedAt: '2024-05-25T16:00:00Z',
      createdBy: 'demo-teacher-1'
    },
    {
      id: 'demo-alert-3',
      title: 'Excelente Rendimiento - Ana Rodríguez',
      description: 'Promedio superior a 9.0 en todas las materias',
      type: 'academic',
      priority: 'low',
      status: 'resolved',
      studentId: 'demo-student-3',
      createdAt: '2024-05-15T09:15:00Z',
      resolvedAt: '2024-05-22T11:30:00Z',
      createdBy: 'demo-teacher-2'
    },
    {
      id: 'demo-alert-4',
      title: 'Alerta Crítica - Carlos Rodríguez',
      description: 'Múltiples faltas de asistencia y bajo rendimiento',
      type: 'academic',
      priority: 'critical',
      status: 'pending',
      studentId: 'demo-student-4',
      createdAt: '2024-05-10T08:00:00Z',
      createdBy: 'demo-teacher-1'
    }
  ],
  
  announcements: [
    {
      id: 'demo-announcement-1',
      title: 'Bienvenida al Ciclo Lectivo 2024',
      content: 'Les damos la bienvenida al nuevo ciclo lectivo. Esperamos un año lleno de aprendizajes y crecimiento.',
      targetRole: 'all',
      createdAt: '2024-03-01T08:00:00Z',
      createdBy: 'demo-admin-1'
    },
    {
      id: 'demo-announcement-2',
      title: 'Reunión de Padres - 1°A',
      content: 'Se convoca a los padres de 1°A a una reunión informativa el viernes 15 de marzo a las 18:00hs.',
      targetRole: 'familiar',
      createdAt: '2024-03-10T16:00:00Z',
      createdBy: 'demo-teacher-1'
    }
  ],
  
  messages: [
    {
      id: 'demo-message-1',
      content: '¡Hola! ¿Cómo están todos?',
      authorId: 'demo-teacher-1',
      authorName: 'Prof. Carlos Mendoza',
      authorRole: 'docente',
      courseId: 'demo-course-1',
      messageType: 'general',
      priority: 'normal',
      attachments: [],
      createdAt: '2024-03-15T10:00:00Z',
      isPinned: false,
      isEdited: false,
      likes: ['demo-student-1', 'demo-student-2'],
      replies: [],
      status: 'active'
    },
    {
      id: 'demo-message-2',
      content: 'Recordatorio: Examen de Matemática el próximo viernes',
      authorId: 'demo-teacher-1',
      authorName: 'Prof. Carlos Mendoza',
      authorRole: 'docente',
      courseId: 'demo-course-1',
      messageType: 'announcement',
      priority: 'high',
      attachments: [],
      createdAt: '2024-03-20T14:30:00Z',
      isPinned: true,
      isEdited: false,
      likes: [],
      replies: [
        {
          id: 'demo-reply-1',
          content: '¿Qué temas entran en el examen?',
          authorId: 'demo-student-1',
          authorName: 'María García',
          createdAt: '2024-03-20T15:00:00Z'
        }
      ],
      status: 'active'
    }
  ],
  
  conversations: [
    {
      id: 'demo-conversation-1',
      title: 'Consulta sobre Matemática',
      members: ['demo-teacher-1', 'demo-student-1'],
      createdBy: 'demo-student-1',
      createdAt: '2024-03-18T09:00:00Z',
      updatedAt: '2024-03-18T09:30:00Z',
      lastMessageText: 'Gracias por la explicación',
      lastMessageSenderId: 'demo-student-1',
      lastMessageAt: '2024-03-18T09:30:00Z',
      reads: {
        'demo-teacher-1': '2024-03-18T09:30:00Z',
        'demo-student-1': '2024-03-18T09:30:00Z'
      }
    }
  ],

  boletines: [
    {
      id: 'demo-boletin-1',
      alumnoId: 'demo-student-1',
      alumnoNombre: 'María García',
      curso: 'demo-course-1',
      periodo: 'T1',
      fechaGeneracion: '2024-03-15T10:00:00Z',
      abierto: true,
      comentario: 'Excelente desempeño en el primer trimestre. Continúa así.',
      observacionGeneral: 'Excelente',
      materias: [
        {
          nombre: 'Matemática',
          T1: 9,
          T2: 8,
          T3: 9,
          promedio: 8.7
        },
        {
          nombre: 'Lengua',
          T1: 8,
          T2: 9,
          T3: 8,
          promedio: 8.3
        },
        {
          nombre: 'Ciencias Naturales',
          T1: 7,
          T2: 8,
          T3: 9,
          promedio: 8.0
        },
        {
          nombre: 'Ciencias Sociales',
          T1: 8,
          T2: 7,
          T3: 8,
          promedio: 7.7
        },
        {
          nombre: 'Educación Física',
          T1: 9,
          T2: 9,
          T3: 8,
          promedio: 8.7
        }
      ]
    },
    {
      id: 'demo-boletin-2',
      alumnoId: 'demo-student-2',
      alumnoNombre: 'Juan Pérez',
      curso: 'demo-course-1',
      periodo: 'T1',
      fechaGeneracion: '2024-03-15T10:00:00Z',
      abierto: true,
      comentario: 'Buen rendimiento general. Necesita mejorar en Matemática.',
      observacionGeneral: 'Bueno',
      materias: [
        {
          nombre: 'Matemática',
          T1: 6,
          T2: 7,
          T3: 6,
          promedio: 6.3
        },
        {
          nombre: 'Lengua',
          T1: 8,
          T2: 8,
          T3: 7,
          promedio: 7.7
        },
        {
          nombre: 'Ciencias Naturales',
          T1: 7,
          T2: 8,
          T3: 7,
          promedio: 7.3
        },
        {
          nombre: 'Ciencias Sociales',
          T1: 8,
          T2: 7,
          T3: 8,
          promedio: 7.7
        },
        {
          nombre: 'Educación Física',
          T1: 9,
          T2: 8,
          T3: 9,
          promedio: 8.7
        }
      ]
    },
    {
      id: 'demo-boletin-3',
      alumnoId: 'demo-student-3',
      alumnoNombre: 'Ana López',
      curso: 'demo-course-1',
      periodo: 'T1',
      fechaGeneracion: '2024-03-15T10:00:00Z',
      abierto: false,
      comentario: 'Rendimiento sobresaliente en todas las materias.',
      observacionGeneral: 'Excelente',
      materias: [
        {
          nombre: 'Matemática',
          T1: 10,
          T2: 9,
          T3: 10,
          promedio: 9.7
        },
        {
          nombre: 'Lengua',
          T1: 9,
          T2: 10,
          T3: 9,
          promedio: 9.3
        },
        {
          nombre: 'Ciencias Naturales',
          T1: 9,
          T2: 9,
          T3: 10,
          promedio: 9.3
        },
        {
          nombre: 'Ciencias Sociales',
          T1: 10,
          T2: 9,
          T3: 9,
          promedio: 9.3
        },
        {
          nombre: 'Educación Física',
          T1: 9,
          T2: 10,
          T3: 9,
          promedio: 9.3
        }
      ]
    },
    {
      id: 'demo-boletin-4',
      alumnoId: 'demo-student-4',
      alumnoNombre: 'Carlos Rodríguez',
      curso: 'demo-course-2',
      periodo: 'T1',
      fechaGeneracion: '2024-03-15T10:00:00Z',
      abierto: true,
      comentario: 'Necesita mayor dedicación en el estudio.',
      observacionGeneral: 'Regular',
      materias: [
        {
          nombre: 'Matemática',
          T1: 5,
          T2: 6,
          T3: 5,
          promedio: 5.3
        },
        {
          nombre: 'Lengua',
          T1: 6,
          T2: 7,
          T3: 6,
          promedio: 6.3
        },
        {
          nombre: 'Ciencias Naturales',
          T1: 6,
          T2: 5,
          T3: 6,
          promedio: 5.7
        },
        {
          nombre: 'Ciencias Sociales',
          T1: 7,
          T2: 6,
          T3: 7,
          promedio: 6.7
        },
        {
          nombre: 'Educación Física',
          T1: 8,
          T2: 7,
          T3: 8,
          promedio: 7.7
        }
      ]
    },
    {
      id: 'demo-boletin-5',
      alumnoId: 'demo-student-5',
      alumnoNombre: 'Sofía Martínez',
      curso: 'demo-course-2',
      periodo: 'T1',
      fechaGeneracion: '2024-03-15T10:00:00Z',
      abierto: true,
      comentario: 'Muy buen desempeño académico.',
      observacionGeneral: 'Muy Bueno',
      materias: [
        {
          nombre: 'Matemática',
          T1: 8,
          T2: 9,
          T3: 8,
          promedio: 8.3
        },
        {
          nombre: 'Lengua',
          T1: 9,
          T2: 8,
          T3: 9,
          promedio: 8.7
        },
        {
          nombre: 'Ciencias Naturales',
          T1: 8,
          T2: 8,
          T3: 9,
          promedio: 8.3
        },
        {
          nombre: 'Ciencias Sociales',
          T1: 9,
          T2: 8,
          T3: 8,
          promedio: 8.3
        },
        {
          nombre: 'Educación Física',
          T1: 8,
          T2: 9,
          T3: 8,
          promedio: 8.3
        }
      ]
    }
  ],

  users: [
    {
      firestoreId: 'demo-admin-1',
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@schoolflow.com',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-05-20T10:00:00Z',
      isActive: true
    },
    {
      firestoreId: 'demo-teacher-1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'carlos.mendoza@schoolflow.com',
      role: 'docente',
      teacherId: 'demo-teacher-1',
      createdAt: '2024-01-15T00:00:00Z',
      lastLogin: '2024-05-20T09:30:00Z',
      isActive: true
    },
    {
      firestoreId: 'demo-teacher-2',
      nombre: 'Laura',
      apellido: 'Fernández',
      email: 'laura.fernandez@schoolflow.com',
      role: 'docente',
      teacherId: 'demo-teacher-2',
      createdAt: '2024-01-20T00:00:00Z',
      lastLogin: '2024-05-19T16:45:00Z',
      isActive: true
    },
    {
      firestoreId: 'demo-student-1',
      nombre: 'María',
      apellido: 'García',
      email: 'maria.garcia@student.com',
      role: 'alumno',
      studentId: 'demo-student-1',
      createdAt: '2024-02-01T00:00:00Z',
      lastLogin: '2024-05-20T08:15:00Z',
      isActive: true
    },
    {
      firestoreId: 'demo-student-2',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@student.com',
      role: 'alumno',
      studentId: 'demo-student-2',
      createdAt: '2024-02-01T00:00:00Z',
      lastLogin: '2024-05-19T14:20:00Z',
      isActive: true
    },
    {
      firestoreId: 'demo-parent-1',
      nombre: 'Roberto',
      apellido: 'García',
      email: 'roberto.garcia@parent.com',
      role: 'familiar',
      studentId: 'demo-student-1',
      createdAt: '2024-02-05T00:00:00Z',
      lastLogin: '2024-05-20T11:30:00Z',
      isActive: true
    }
  ],

  audit: [
    {
      id: 'demo-audit-1',
      action: 'LOGIN',
      userId: 'demo-admin-1',
      userEmail: 'admin@schoolflow.com',
      userRole: 'admin',
      details: 'Inicio de sesión exitoso',
      timestamp: '2024-05-20T10:00:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 'demo-audit-2',
      action: 'CREATE_GRADE',
      userId: 'demo-teacher-1',
      userEmail: 'carlos.mendoza@schoolflow.com',
      userRole: 'docente',
      details: 'Calificación creada para Juan Pérez en Matemática: 7.5',
      timestamp: '2024-05-20T09:45:00Z',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 'demo-audit-3',
      action: 'UPDATE_ATTENDANCE',
      userId: 'demo-teacher-1',
      userEmail: 'carlos.mendoza@schoolflow.com',
      userRole: 'docente',
      details: 'Asistencia actualizada para María García: Presente',
      timestamp: '2024-05-20T09:30:00Z',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 'demo-audit-4',
      action: 'GENERATE_REPORT',
      userId: 'demo-admin-1',
      userEmail: 'admin@schoolflow.com',
      userRole: 'admin',
      details: 'Reporte de boletines generado para 1°A',
      timestamp: '2024-05-20T08:15:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
      id: 'demo-audit-5',
      action: 'RESOLVE_ALERT',
      userId: 'demo-teacher-2',
      userEmail: 'laura.fernandez@schoolflow.com',
      userRole: 'docente',
      details: 'Alerta resuelta: Excelente Rendimiento - Ana Rodríguez',
      timestamp: '2024-05-19T16:30:00Z',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  ],

  finances: [
    {
      id: 'demo-finance-1',
      type: 'tuition',
      studentId: 'demo-student-1',
      studentName: 'María García',
      amount: 25000,
      currency: 'ARS',
      dueDate: '2024-06-01T00:00:00Z',
      status: 'paid',
      paymentDate: '2024-05-15T10:30:00Z',
      paymentMethod: 'transfer',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z'
    },
    {
      id: 'demo-finance-2',
      type: 'tuition',
      studentId: 'demo-student-2',
      studentName: 'Juan Pérez',
      amount: 25000,
      currency: 'ARS',
      dueDate: '2024-06-01T00:00:00Z',
      status: 'pending',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z'
    },
    {
      id: 'demo-finance-3',
      type: 'tuition',
      studentId: 'demo-student-3',
      studentName: 'Ana Rodríguez',
      amount: 25000,
      currency: 'ARS',
      dueDate: '2024-06-01T00:00:00Z',
      status: 'paid',
      paymentDate: '2024-05-10T14:20:00Z',
      paymentMethod: 'cash',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z'
    },
    {
      id: 'demo-finance-4',
      type: 'fee',
      studentId: 'demo-student-1',
      studentName: 'María García',
      amount: 5000,
      currency: 'ARS',
      dueDate: '2024-05-15T00:00:00Z',
      status: 'paid',
      paymentDate: '2024-05-12T09:15:00Z',
      paymentMethod: 'card',
      description: 'Matrícula anual',
      createdAt: '2024-03-01T00:00:00Z'
    },
    {
      id: 'demo-finance-5',
      type: 'fee',
      studentId: 'demo-student-2',
      studentName: 'Juan Pérez',
      amount: 5000,
      currency: 'ARS',
      dueDate: '2024-05-15T00:00:00Z',
      status: 'overdue',
      description: 'Matrícula anual',
      createdAt: '2024-03-01T00:00:00Z'
    }
  ],

  auditLogs: [
    {
      firestoreId: 'demo-audit-log-1',
      action: 'LOGIN',
      entity: 'user',
      entityId: 'demo-admin-1',
      userEmail: 'admin@schoolflow.com',
      userId: 'demo-admin-1',
      createdAt: '2024-05-20T10:00:00Z',
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true
      }
    },
    {
      firestoreId: 'demo-audit-log-2',
      action: 'CREATE_GRADE',
      entity: 'calificacion',
      entityId: 'demo-grade-1',
      userEmail: 'carlos.mendoza@schoolflow.com',
      userId: 'demo-teacher-1',
      createdAt: '2024-05-20T09:45:00Z',
      details: {
        studentId: 'demo-student-2',
        studentName: 'Juan Pérez',
        subjectId: 'demo-subject-1',
        subjectName: 'Matemática',
        grade: 7.5
      }
    },
    {
      firestoreId: 'demo-audit-log-3',
      action: 'UPDATE_ATTENDANCE',
      entity: 'attendance',
      entityId: 'demo-attendance-1',
      userEmail: 'carlos.mendoza@schoolflow.com',
      userId: 'demo-teacher-1',
      createdAt: '2024-05-20T09:30:00Z',
      details: {
        studentId: 'demo-student-1',
        studentName: 'María García',
        courseId: 'demo-course-1',
        present: true,
        date: '2024-05-20'
      }
    },
    {
      firestoreId: 'demo-audit-log-4',
      action: 'GENERATE_REPORT',
      entity: 'report',
      entityId: 'demo-report-1',
      userEmail: 'admin@schoolflow.com',
      userId: 'demo-admin-1',
      createdAt: '2024-05-20T08:15:00Z',
      details: {
        reportType: 'boletines',
        courseId: 'demo-course-1',
        courseName: '1°A',
        period: 'T1'
      }
    },
    {
      firestoreId: 'demo-audit-log-5',
      action: 'RESOLVE_ALERT',
      entity: 'alert',
      entityId: 'demo-alert-3',
      userEmail: 'laura.fernandez@schoolflow.com',
      userId: 'demo-teacher-2',
      createdAt: '2024-05-19T16:30:00Z',
      details: {
        alertTitle: 'Excelente Rendimiento - Ana Rodríguez',
        alertType: 'academic',
        resolution: 'Alerta confirmada y documentada'
      }
    },
    {
      firestoreId: 'demo-audit-log-6',
      action: 'CREATE_USER',
      entity: 'user',
      entityId: 'demo-student-4',
      userEmail: 'admin@schoolflow.com',
      userId: 'demo-admin-1',
      createdAt: '2024-05-18T14:20:00Z',
      details: {
        newUserEmail: 'carlos.rodriguez@student.com',
        newUserRole: 'alumno',
        newUserName: 'Carlos Rodríguez'
      }
    }
  ],

  invoices: [
    {
      firestoreId: 'demo-invoice-1',
      alumnoId: 'demo-student-1',
      alumnoNombre: 'María García',
      total: 25000,
      currency: 'ARS',
      status: 'paid',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z',
      dueDate: '2024-06-01T00:00:00Z',
      paymentDate: '2024-05-15T10:30:00Z',
      paymentMethod: 'transfer'
    },
    {
      firestoreId: 'demo-invoice-2',
      alumnoId: 'demo-student-2',
      alumnoNombre: 'Juan Pérez',
      total: 25000,
      currency: 'ARS',
      status: 'pending',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z',
      dueDate: '2024-06-01T00:00:00Z'
    },
    {
      firestoreId: 'demo-invoice-3',
      alumnoId: 'demo-student-3',
      alumnoNombre: 'Ana Rodríguez',
      total: 25000,
      currency: 'ARS',
      status: 'paid',
      description: 'Cuota mensual - Junio 2024',
      createdAt: '2024-05-01T00:00:00Z',
      dueDate: '2024-06-01T00:00:00Z',
      paymentDate: '2024-05-10T14:20:00Z',
      paymentMethod: 'cash'
    },
    {
      firestoreId: 'demo-invoice-4',
      alumnoId: 'demo-student-1',
      alumnoNombre: 'María García',
      total: 5000,
      currency: 'ARS',
      status: 'paid',
      description: 'Matrícula anual',
      createdAt: '2024-03-01T00:00:00Z',
      dueDate: '2024-05-15T00:00:00Z',
      paymentDate: '2024-05-12T09:15:00Z',
      paymentMethod: 'card'
    },
    {
      firestoreId: 'demo-invoice-5',
      alumnoId: 'demo-student-2',
      alumnoNombre: 'Juan Pérez',
      total: 5000,
      currency: 'ARS',
      status: 'failed',
      description: 'Matrícula anual',
      createdAt: '2024-03-01T00:00:00Z',
      dueDate: '2024-05-15T00:00:00Z'
    }
  ],

  inscripciones: [
    {
      id: 'demo-inscripcion-1',
      studentId: 'demo-student-1',
      studentName: 'María García',
      courseId: 'demo-course-1',
      courseName: '1°A',
      subjectId: 'demo-subject-1',
      subjectName: 'Matemática',
      teacherId: 'demo-teacher-1',
      teacherName: 'Carlos Mendoza',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'A'
    },
    {
      id: 'demo-inscripcion-2',
      studentId: 'demo-student-1',
      studentName: 'María García',
      courseId: 'demo-course-1',
      courseName: '1°A',
      subjectId: 'demo-subject-2',
      subjectName: 'Lengua',
      teacherId: 'demo-teacher-1',
      teacherName: 'Carlos Mendoza',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'A'
    },
    {
      id: 'demo-inscripcion-3',
      studentId: 'demo-student-2',
      studentName: 'Juan Pérez',
      courseId: 'demo-course-1',
      courseName: '1°A',
      subjectId: 'demo-subject-1',
      subjectName: 'Matemática',
      teacherId: 'demo-teacher-1',
      teacherName: 'Carlos Mendoza',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'A'
    },
    {
      id: 'demo-inscripcion-4',
      studentId: 'demo-student-2',
      studentName: 'Juan Pérez',
      courseId: 'demo-course-1',
      courseName: '1°A',
      subjectId: 'demo-subject-2',
      subjectName: 'Lengua',
      teacherId: 'demo-teacher-1',
      teacherName: 'Carlos Mendoza',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'A'
    },
    {
      id: 'demo-inscripcion-5',
      studentId: 'demo-student-3',
      studentName: 'Ana Rodríguez',
      courseId: 'demo-course-2',
      courseName: '1°B',
      subjectId: 'demo-subject-3',
      subjectName: 'Ciencias Naturales',
      teacherId: 'demo-teacher-2',
      teacherName: 'Laura Fernández',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'B'
    },
    {
      id: 'demo-inscripcion-6',
      studentId: 'demo-student-3',
      studentName: 'Ana Rodríguez',
      courseId: 'demo-course-2',
      courseName: '1°B',
      subjectId: 'demo-subject-4',
      subjectName: 'Ciencias Sociales',
      teacherId: 'demo-teacher-2',
      teacherName: 'Laura Fernández',
      status: 'active',
      enrolledAt: '2024-03-01T00:00:00Z',
      grade: '1°',
      division: 'B'
    }
  ]
};

// Función para verificar si estamos en modo demo
export const isDemoMode = (): boolean => {
  return localStorage.getItem('DEMO_MODE') === 'true';
};

// Función para obtener datos demo con delay simulado
export const getDemoData = async <T>(collection: keyof typeof DEMO_DATA): Promise<T[]> => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  
  return DEMO_DATA[collection] as T[];
};

// Función para calcular KPIs demo
export const getDemoKPIs = () => {
  const totalStudents = DEMO_DATA.students.length;
  const totalTeachers = DEMO_DATA.teachers.length;
  const totalCourses = DEMO_DATA.courses.length;
  
  // Calcular promedio general
  const allGrades = DEMO_DATA.calificaciones.map(c => c.valor);
  const averageGrade = allGrades.length > 0 
    ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length 
    : 0;
  
  // Calcular asistencia promedio
  const allAttendances = DEMO_DATA.attendances;
  const presentCount = allAttendances.filter(a => a.present).length;
  const attendanceRate = allAttendances.length > 0 
    ? (presentCount / allAttendances.length) * 100 
    : 0;
  
  // Contar alertas activas
  const activeAlerts = DEMO_DATA.alerts.filter(a => a.status === 'active').length;
  
  return {
    totalStudents,
    totalTeachers,
    totalCourses,
    averageGrade: Number(averageGrade.toFixed(1)),
    attendanceRate: Number(attendanceRate.toFixed(1)),
    activeAlerts,
    totalGrades: allGrades.length,
    totalAttendances: allAttendances.length
  };
};
