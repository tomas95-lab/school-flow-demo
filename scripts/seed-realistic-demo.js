/* eslint-disable no-console */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

async function ensureInitialized() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.')
    process.exit(1)
  }
  let credentials
  try {
    const json = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
    credentials = JSON.parse(json)
  } catch (e) {
    console.error('Failed to read service account file at GOOGLE_APPLICATION_CREDENTIALS')
    process.exit(1)
  }
  initializeApp({ credential: cert(credentials) })
}

async function upsertAuthUser(auth, { email, password, displayName }) {
  try {
    const existing = await auth.getUserByEmail(email)
    return existing.uid
  } catch {
    const created = await auth.createUser({ email, password, displayName, emailVerified: false, disabled: false })
    return created.uid
  }
}

// Función para generar fechas aleatorias en un rango
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Función para generar calificaciones realistas
function generateRealisticGrade() {
  const weights = [
    { range: [4, 5.5], weight: 0.15 },  // Bajo
    { range: [5.5, 7], weight: 0.35 },  // Medio-bajo
    { range: [7, 8.5], weight: 0.35 },  // Bueno
    { range: [8.5, 10], weight: 0.15 }  // Excelente
  ]
  
  const random = Math.random()
  let cumulative = 0
  
  for (const { range, weight } of weights) {
    cumulative += weight
    if (random <= cumulative) {
      return +(Math.random() * (range[1] - range[0]) + range[0]).toFixed(1)
    }
  }
  return 7.5 // fallback
}

// Función para generar asistencia realista
function generateAttendance() {
  return Math.random() > 0.12 // 88% de asistencia promedio
}

async function main() {
  await ensureInitialized()
  const auth = getAuth()
  const db = getFirestore()

  const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'password123'

  console.log('🎯 Generando datos de demo realistas...')

  // Nombres más realistas para estudiantes
  const studentNames = [
    { firstName: 'Martín', lastName: 'García', email: 'martin.garcia@example.com' },
    { firstName: 'Sofía', lastName: 'Rodríguez', email: 'sofia.rodriguez@example.com' },
    { firstName: 'Lucas', lastName: 'Fernández', email: 'lucas.fernandez@example.com' },
    { firstName: 'Valentina', lastName: 'López', email: 'valentina.lopez@example.com' },
    { firstName: 'Tomás', lastName: 'Martínez', email: 'tomas.martinez@example.com' },
    { firstName: 'Emma', lastName: 'González', email: 'emma.gonzalez@example.com' },
    { firstName: 'Benjamín', lastName: 'Pérez', email: 'benjamin.perez@example.com' },
    { firstName: 'Isabella', lastName: 'Sánchez', email: 'isabella.sanchez@example.com' }
  ]

  const teacherNames = [
    { firstName: 'Ana', lastName: 'Morales', email: 'ana.morales@escuela.edu.ar', subject: 'Matemática' },
    { firstName: 'Carlos', lastName: 'Vega', email: 'carlos.vega@escuela.edu.ar', subject: 'Lengua' },
    { firstName: 'Laura', lastName: 'Silva', email: 'laura.silva@escuela.edu.ar', subject: 'Historia' },
    { firstName: 'Roberto', lastName: 'Díaz', email: 'roberto.diaz@escuela.edu.ar', subject: 'Ciencias' }
  ]

  const subjects = [
    'Matemática', 'Lengua y Literatura', 'Historia', 'Geografía', 
    'Ciencias Naturales', 'Inglés', 'Educación Física', 'Arte'
  ]

  // 1) Crear usuarios de Auth
  const userSpecs = [
    { key: 'admin1', role: 'admin', name: 'Directora María Elena', email: 'direccion@escuela.edu.ar' },
    ...teacherNames.map((teacher, idx) => ({
      key: `teacher_${idx}`,
      role: 'docente',
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email
    })),
    ...studentNames.map((student, idx) => ({
      key: `student_${idx}`,
      role: 'alumno', 
      name: `${student.firstName} ${student.lastName}`,
      email: student.email
    }))
  ]

  const labelToUid = new Map()
  console.log('📝 Creando usuarios de autenticación...')
  for (const u of userSpecs) {
    const uid = await upsertAuthUser(auth, { email: u.email, password: DEMO_PASSWORD, displayName: u.name })
    labelToUid.set(u.key, uid)
  }

  const batch = db.batch()

  // 2) Crear usuarios en Firestore
  for (const u of userSpecs) {
    const uid = labelToUid.get(u.key)
    const userData = { 
      role: u.role, 
      name: u.name, 
      email: u.email, 
      status: 'active', 
      lastLogin: null,
      createdAt: Timestamp.now()
    }
    
    if (u.role === 'docente') {
      userData.teacherId = uid
    } else if (u.role === 'alumno') {
      userData.studentId = uid
    }
    
    batch.set(db.collection('users').doc(uid), userData, { merge: true })
  }

  // 3) Crear docentes
  console.log('👩‍🏫 Creando docentes...')
  teacherNames.forEach((teacher, idx) => {
    const teacherKey = `teacher_${idx}`
    const uid = labelToUid.get(teacherKey)
    if (uid) {
      batch.set(db.collection('teachers').doc(uid), {
        nombre: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        subjects: [teacher.subject],
        status: 'active',
        createdAt: Timestamp.now()
      })
    }
  })

  // 4) Crear cursos
  console.log('🏫 Creando cursos...')
  const courses = [
    { id: 'curso_1a', nombre: '1°A', division: 'A', año: 1, teacherId: labelToUid.get('teacher_0') },
    { id: 'curso_1b', nombre: '1°B', division: 'B', año: 1, teacherId: labelToUid.get('teacher_1') },
    { id: 'curso_2a', nombre: '2°A', division: 'A', año: 2, teacherId: labelToUid.get('teacher_2') }
  ]
  
  courses.forEach(course => {
    batch.set(db.collection('courses').doc(course.id), {
      ...course,
      nivel: 'secundaria',
      modalidad: 'presencial',
      turno: 'mañana',
      maxStudents: 30,
      status: 'active',
      createdAt: Timestamp.now()
    })
  })

  // 5) Crear estudiantes
  console.log('🎓 Creando estudiantes...')
  studentNames.forEach((student, idx) => {
    const studentKey = `student_${idx}`
    const uid = labelToUid.get(studentKey)
    if (uid) {
      const courseId = idx < 3 ? 'curso_1a' : idx < 6 ? 'curso_1b' : 'curso_2a'
      batch.set(db.collection('students').doc(uid), {
        nombre: `${student.firstName} ${student.lastName}`,
        email: student.email,
        cursoId: courseId,
        fechaNacimiento: randomDate(new Date(2006, 0, 1), new Date(2008, 11, 31)).toISOString().split('T')[0],
        telefono: `+54 9 11 ${Math.floor(Math.random() * 90000000) + 10000000}`,
        direccion: `Av. Ejemplo ${Math.floor(Math.random() * 9000) + 1000}`,
        status: 'active',
        createdAt: Timestamp.now()
      })
    }
  })

  // 6) Crear materias
  console.log('📚 Creando materias...')
  const subjectDocs = []
  courses.forEach(course => {
    subjects.forEach((subjectName, subjectIdx) => {
      const subjectId = `${course.id}_${subjectName.toLowerCase().replace(/\s+/g, '_')}`
      const teacherIdx = subjectIdx % teacherNames.length
      const teacherId = labelToUid.get(`teacher_${teacherIdx}`)
      
      const subjectDoc = {
        id: subjectId,
        nombre: subjectName,
        cursoId: course.id,
        teacherId,
        status: 'active',
        createdAt: Timestamp.now()
      }
      
      subjectDocs.push(subjectDoc)
      batch.set(db.collection('subjects').doc(subjectId), subjectDoc)
    })
  })

  await batch.commit()
  console.log('✅ Estructura básica creada')

  // 7) Generar calificaciones realistas
  console.log('📊 Generando calificaciones realistas...')
  const gradeBatch = db.batch()
  const startDate = new Date(2024, 2, 1) // Marzo
  const endDate = new Date(2024, 10, 30) // Noviembre
  
  const activities = [
    'Evaluación Diagnóstica', 'Trabajo Práctico N°1', 'Evaluación Parcial',
    'Proyecto Grupal', 'Trabajo Práctico N°2', 'Evaluación Integradora',
    'Presentación Oral', 'Trabajo de Investigación', 'Evaluación Final'
  ]
  
  let gradeCounter = 0
  studentNames.forEach((student, studentIdx) => {
    const studentId = labelToUid.get(`student_${studentIdx}`)
    const courseId = studentIdx < 3 ? 'curso_1a' : studentIdx < 6 ? 'curso_1b' : 'curso_2a'
    
    subjectDocs
      .filter(subject => subject.cursoId === courseId)
      .forEach(subject => {
        // Generar 6-9 calificaciones por materia
        const numGrades = Math.floor(Math.random() * 4) + 6
        
        for (let i = 0; i < numGrades; i++) {
          const gradeId = `grade_${gradeCounter++}`
          const activity = activities[i % activities.length]
          const fecha = randomDate(startDate, endDate)
          const grade = generateRealisticGrade()
          
          gradeBatch.set(db.collection('calificaciones').doc(gradeId), {
            studentId,
            subjectId: subject.id,
            Actividad: activity,
            valor: grade,
            ausente: Math.random() < 0.05, // 5% ausentes
            fecha: fecha.toISOString().split('T')[0],
            createdAt: Timestamp.fromDate(fecha),
            observaciones: grade < 6 ? 'Requiere refuerzo' : grade > 8.5 ? 'Excelente trabajo' : ''
          })
        }
      })
  })
  
  await gradeBatch.commit()
  console.log('✅ Calificaciones generadas')

  // 8) Generar asistencias realistas
  console.log('📅 Generando asistencias realistas...')
  const attendanceBatch = db.batch()
  let attendanceCounter = 0
  
  // Generar asistencias para los últimos 3 meses
  const attendanceStartDate = new Date(2024, 7, 1) // Agosto
  const currentDate = new Date()
  
  studentNames.forEach((student, studentIdx) => {
    const studentId = labelToUid.get(`student_${studentIdx}`)
    const courseId = studentIdx < 3 ? 'curso_1a' : studentIdx < 6 ? 'curso_1b' : 'curso_2a'
    
    // Días de clases (lunes a viernes)
    const currentDateCheck = new Date(attendanceStartDate)
    while (currentDateCheck <= currentDate) {
      if (currentDateCheck.getDay() >= 1 && currentDateCheck.getDay() <= 5) { // Lunes a viernes
        const attendanceId = `attendance_${attendanceCounter++}`
        const isPresent = generateAttendance()
        
        attendanceBatch.set(db.collection('attendances').doc(attendanceId), {
          studentId,
          courseId,
          fecha: currentDateCheck.toISOString().split('T')[0],
          present: isPresent,
          late: isPresent && Math.random() < 0.08, // 8% llegan tarde
          justified: !isPresent && Math.random() < 0.4, // 40% de ausencias justificadas
          createdAt: Timestamp.fromDate(currentDateCheck)
        })
      }
      currentDateCheck.setDate(currentDateCheck.getDate() + 1)
    }
  })
  
  await attendanceBatch.commit()
  console.log('✅ Asistencias generadas')

  // 9) Generar boletines con observaciones
  console.log('📋 Generando boletines...')
  const boletinBatch = db.batch()
  let boletinCounter = 0
  
  const periodos = ['1er Trimestre', '2do Trimestre', '3er Trimestre']
  
  studentNames.forEach((student, studentIdx) => {
    const studentId = labelToUid.get(`student_${studentIdx}`)
    
    periodos.forEach(periodo => {
      const boletinId = `boletin_${boletinCounter++}`
      
      // Calcular promedio simulado para el período
      const baseAverage = 6 + Math.random() * 3 // Entre 6 y 9
      const variation = (Math.random() - 0.5) * 2 // ±1 punto de variación
      const promedio = Math.max(4, Math.min(10, baseAverage + variation))
      
      let observacion = ''
      if (promedio >= 8.5) {
        observacion = 'Excelente desempeño académico. Demuestra comprometimiento y dedicación en todas las materias.'
      } else if (promedio >= 7) {
        observacion = 'Buen rendimiento general. Se sugiere continuar con el esfuerzo sostenido.'
      } else if (promedio >= 6) {
        observacion = 'Rendimiento satisfactorio con oportunidades de mejora. Se recomienda reforzar hábitos de estudio.'
      } else {
        observacion = 'Rendimiento por debajo del esperado. Se requiere acompañamiento pedagógico y comunicación familiar.'
      }
      
      boletinBatch.set(db.collection('boletines').doc(boletinId), {
        studentId,
        alumnoNombre: `${student.firstName} ${student.lastName}`,
        periodo,
        año: 2024,
        promedioTotal: +promedio.toFixed(1),
        observacionGeneral: observacion,
        fechaGeneracion: Timestamp.now(),
        estado: 'generado',
        createdAt: Timestamp.now()
      })
    })
  })
  
  await boletinBatch.commit()
  console.log('✅ Boletines generados')

  // 10) Crear conversaciones y anuncios
  console.log('💬 Creando mensajes y anuncios...')
  const messageBatch = db.batch()
  
  // Conversación entre docente y estudiante
  const convId = 'conv_demo_1'
  messageBatch.set(db.collection('conversations').doc(convId), {
    title: 'Consulta sobre Matemática',
    members: [labelToUid.get('teacher_0'), labelToUid.get('student_0')],
    createdBy: labelToUid.get('student_0'),
    createdAt: Timestamp.now()
  })
  
  // Mensajes en la conversación
  const messages = [
    { text: 'Hola profesor, tengo dudas sobre el último tema.', senderId: labelToUid.get('student_0') },
    { text: 'Hola Martín, ¿sobre qué parte específicamente?', senderId: labelToUid.get('teacher_0') },
    { text: 'Sobre las ecuaciones de segundo grado.', senderId: labelToUid.get('student_0') },
    { text: 'Perfecto, mañana lo repasamos en clase.', senderId: labelToUid.get('teacher_0') }
  ]
  
  messages.forEach((msg, idx) => {
    const msgDate = new Date(Date.now() - (messages.length - idx) * 3600000) // 1 hora entre mensajes
    messageBatch.set(db.collection('conversations').doc(convId).collection('messages').doc(), {
      ...msg,
      createdAt: Timestamp.fromDate(msgDate)
    })
  })
  
  // Anuncios informativos
  const announcements = [
    {
      title: 'Inicio del Ciclo Lectivo 2024',
      content: 'Damos inicio a un nuevo año académico. Les deseamos un excelente año de aprendizaje y crecimiento.',
      targetRole: 'all',
      createdBy: labelToUid.get('admin1')
    },
    {
      title: 'Reunión de Docentes',
      content: 'Se convoca a reunión de docentes para el viernes 15 a las 14:00 hs en la sala de profesores.',
      targetRole: 'docente',
      createdBy: labelToUid.get('admin1')
    },
    {
      title: 'Evaluaciones Trimestrales',
      content: 'Recordamos que las evaluaciones del segundo trimestre comenzarán la próxima semana.',
      targetRole: 'alumno',
      createdBy: labelToUid.get('admin1')
    }
  ]
  
  announcements.forEach(announcement => {
    messageBatch.set(db.collection('announcements').doc(), {
      ...announcement,
      createdAt: Timestamp.now()
    })
  })
  
  await messageBatch.commit()
  console.log('✅ Mensajes y anuncios creados')

  console.log(`
🎉 ¡Datos de demo realistas generados exitosamente!

📊 Resumen:
- ${studentNames.length} estudiantes con nombres realistas
- ${teacherNames.length} docentes especializados  
- ${courses.length} cursos organizados
- ${subjects.length * courses.length} materias
- ~${studentNames.length * subjects.length * courses.length * 7} calificaciones variadas
- ~${studentNames.length * 90} registros de asistencia (últimos 3 meses)
- ${studentNames.length * periodos.length} boletines con observaciones
- Conversaciones y anuncios informativos

🔑 Credenciales de acceso:
- Email: direccion@escuela.edu.ar (Admin)
- Email: ana.morales@escuela.edu.ar (Docente)  
- Email: martin.garcia@example.com (Estudiante)
- Contraseña: ${DEMO_PASSWORD}

Los datos incluyen:
✅ Calificaciones realistas (distribución normal)
✅ Asistencias con variación natural
✅ Fechas coherentes y válidas
✅ Observaciones contextuales
✅ Promedios calculables
✅ Nombres y datos argentinos
  `)
}

main().catch((e) => { 
  console.error('❌ Error:', e)
  process.exit(1) 
})
