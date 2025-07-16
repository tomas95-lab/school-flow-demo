import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig.js"


// Tipos de alertas que podemos tener
const ALERT_TYPES = {
  ACADEMIC: "academic",      // Problemas académicos
  ATTENDANCE: "attendance",  // Problemas de asistencia
  BEHAVIOR: "behavior",      // Problemas de comportamiento
  SYSTEM: "system",         // Alertas del sistema
  GENERAL: "general"        // Alertas generales
};

// Niveles de prioridad
const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical"
};

// Estados de la alerta
const ALERT_STATUS = {
  PENDING: "pending",    // Pendiente de revisión
  IN_PROGRESS: "in_progress", // En proceso de resolución
  RESOLVED: "resolved",  // Resuelta
  CLOSED: "closed"       // Cerrada
};

export async function createAlert(alertData) {
  try {
    const docRef = await addDoc(collection(db, "alerts"), {
      ...alertData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isRead: false,
      isActive: true
    });
    console.log("✅ Alerta creada con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error al crear la alerta:", error);
  }
}

// Función para obtener datos reales de Firestore
async function getRealData() {
  console.log("📊 Obteniendo datos reales de Firestore...");
  
  try {
    // Obtener todas las colecciones
    const [studentsSnap, teachersSnap, coursesSnap, subjectsSnap, calificacionesSnap, attendancesSnap] = await Promise.all([
      getDocs(collection(db, "students")),
      getDocs(collection(db, "teachers")),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "subjects")),
      getDocs(collection(db, "calificaciones")),
      getDocs(collection(db, "attendances"))
    ]);

    const students = studentsSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    const teachers = teachersSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    const courses = coursesSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    const subjects = subjectsSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    const calificaciones = calificacionesSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
    const attendances = attendancesSnap.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));

    console.log(`📈 Datos obtenidos: ${students.length} alumnos, ${teachers.length} docentes, ${courses.length} cursos, ${subjects.length} materias, ${calificaciones.length} calificaciones, ${attendances.length} asistencias`);

    return { students, teachers, courses, subjects, calificaciones, attendances };
  } catch (error) {
    console.error("❌ Error al obtener datos:", error);
    return null;
  }
}

// Función para crear alertas basadas en datos reales
async function createRealAlerts() {
  console.log("🚀 Iniciando creación de alertas basadas en datos reales...");
  
  const data = await getRealData();
  if (!data) {
    console.error("❌ No se pudieron obtener los datos");
    return;
  }

  const { students, teachers, courses, subjects, calificaciones, attendances } = data;
  
  if (students.length === 0) {
    console.log("⚠️ No hay alumnos en el sistema. Creando alertas del sistema...");
    await createSystemAlerts();
    return;
  }

  const alerts = [];

  // 1. Alertas académicas basadas en calificaciones reales
  for (const student of students) {
    const studentGrades = calificaciones.filter(c => c.studentId === student.firestoreId);
    
    if (studentGrades.length > 0) {
      const averageGrade = studentGrades.reduce((sum, g) => sum + (g.valor || 0), 0) / studentGrades.length;
      
      if (averageGrade < 6) {
        alerts.push({
          type: ALERT_TYPES.ACADEMIC,
          priority: averageGrade < 4 ? PRIORITY_LEVELS.CRITICAL : PRIORITY_LEVELS.HIGH,
          status: ALERT_STATUS.PENDING,
          title: `Bajo rendimiento académico - ${student.nombre} ${student.apellido}`,
          description: `${student.nombre} ${student.apellido} tiene un promedio de ${averageGrade.toFixed(1)} en ${studentGrades.length} evaluaciones.`,
          targetUserId: student.firestoreId,
          targetUserRole: "alumno",
          courseId: student.cursoId,
          createdBy: "system",
          createdByRole: "system",
          metadata: {
            averageGrade: averageGrade,
            totalGrades: studentGrades.length,
            studentName: `${student.nombre} ${student.apellido}`
          }
        });
      }
    }
  }

  // 2. Alertas de asistencia basadas en datos reales
  for (const student of students) {
    const studentAttendances = attendances.filter(a => a.studentId === student.firestoreId);
    
    if (studentAttendances.length > 0) {
      const presentCount = studentAttendances.filter(a => a.present).length;
      const absenceCount = studentAttendances.length - presentCount;
      const attendanceRate = (presentCount / studentAttendances.length) * 100;
      
      if (attendanceRate < 80) {
        alerts.push({
          type: ALERT_TYPES.ATTENDANCE,
          priority: attendanceRate < 60 ? PRIORITY_LEVELS.CRITICAL : PRIORITY_LEVELS.HIGH,
          status: ALERT_STATUS.PENDING,
          title: `Baja asistencia - ${student.nombre} ${student.apellido}`,
          description: `${student.nombre} ${student.apellido} tiene un ${attendanceRate.toFixed(1)}% de asistencia (${presentCount} presentes de ${studentAttendances.length} total).`,
          targetUserId: student.firestoreId,
          targetUserRole: "alumno",
          courseId: student.cursoId,
          createdBy: "system",
          createdByRole: "system",
          metadata: {
            attendanceRate: attendanceRate,
            presentCount: presentCount,
            totalAttendances: studentAttendances.length,
            studentName: `${student.nombre} ${student.apellido}`
          }
        });
      }
    }
  }

  // 3. Alertas para docentes sobre sus estudiantes
  for (const teacher of teachers) {
    const teacherSubjects = subjects.filter(s => s.teacherId === teacher.firestoreId);
    const teacherCourses = courses.filter(c => c.firestoreId === teacher.cursoId);
    
    if (teacherSubjects.length > 0 && teacherCourses.length > 0) {
      const courseStudents = students.filter(s => s.cursoId === teacher.cursoId);
      
      if (courseStudents.length > 0) {
        alerts.push({
          type: ALERT_TYPES.GENERAL,
          priority: PRIORITY_LEVELS.MEDIUM,
          status: ALERT_STATUS.PENDING,
          title: `Resumen de curso - ${teacher.nombre} ${teacher.apellido}`,
          description: `El docente ${teacher.nombre} ${teacher.apellido} tiene ${courseStudents.length} estudiantes en ${teacherSubjects.length} materias.`,
          targetUserId: teacher.firestoreId,
          targetUserRole: "docente",
          courseId: teacher.cursoId,
          createdBy: "system",
          createdByRole: "system",
          metadata: {
            studentCount: courseStudents.length,
            subjectCount: teacherSubjects.length,
            teacherName: `${teacher.nombre} ${teacher.apellido}`
          }
        });
      }
    }
  }

  // 4. Alertas del sistema sobre el estado general
  if (courses.length > 0) {
    alerts.push({
      type: ALERT_TYPES.SYSTEM,
      priority: PRIORITY_LEVELS.LOW,
      status: ALERT_STATUS.PENDING,
      title: "Estado del sistema educativo",
      description: `El sistema cuenta con ${students.length} estudiantes, ${teachers.length} docentes y ${courses.length} cursos activos.`,
      targetUserId: null,
      targetUserRole: "admin",
      createdBy: "system",
      createdByRole: "system",
      metadata: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        totalSubjects: subjects.length
      }
    });
  }

  // Crear todas las alertas
  console.log(`📝 Creando ${alerts.length} alertas basadas en datos reales...`);
  
  for (const alert of alerts) {
    await createAlert(alert);
  }

  console.log("✅ Alertas basadas en datos reales creadas exitosamente!");
}

// Función para crear alertas del sistema cuando no hay datos
async function createSystemAlerts() {
  console.log("🔧 Creando alertas del sistema...");
  
  const systemAlerts = [
    {
      type: ALERT_TYPES.SYSTEM,
      priority: PRIORITY_LEVELS.MEDIUM,
      status: ALERT_STATUS.PENDING,
      title: "Sistema recién configurado",
      description: "El sistema educativo ha sido configurado. Se recomienda agregar cursos, docentes y estudiantes para comenzar a utilizarlo.",
      targetUserId: null,
      targetUserRole: "admin",
      createdBy: "system",
      createdByRole: "system",
      metadata: {
        setupDate: new Date().toISOString()
      }
    },
    {
      type: ALERT_TYPES.SYSTEM,
      priority: PRIORITY_LEVELS.LOW,
      status: ALERT_STATUS.PENDING,
      title: "Bienvenido a SchoolFlow",
      description: "Gracias por configurar SchoolFlow. Comience agregando su primer curso para aprovechar todas las funcionalidades del sistema.",
      targetUserId: null,
      targetUserRole: "admin",
      createdBy: "system",
      createdByRole: "system",
      metadata: {
        welcomeMessage: true
      }
    }
  ];

  for (const alert of systemAlerts) {
    await createAlert(alert);
  }

  console.log("✅ Alertas del sistema creadas exitosamente!");
}

// Función principal
export async function seedRealAlerts() {
  try {
    await createRealAlerts();
    console.log("🎉 Proceso de creación de alertas completado!");
  } catch (error) {
    console.error("❌ Error durante la creación de alertas:", error);
  }
}

// Exportar constantes para uso en otros archivos
export { ALERT_TYPES, PRIORITY_LEVELS, ALERT_STATUS }; 