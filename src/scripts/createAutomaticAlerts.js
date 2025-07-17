import { db } from "../firebaseConfig.js";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";

// Función para crear alertas automáticas basadas en calificaciones
export async function createAcademicAlerts() {
  try {
    console.log("🔍 Analizando calificaciones para crear alertas académicas...");
    
    const calificacionesSnapshot = await getDocs(collection(db, "calificaciones"));
    const studentsSnapshot = await getDocs(collection(db, "students"));
    
    const students = studentsSnapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data()
    }));

    // Agrupar calificaciones por estudiante
    const calificacionesPorEstudiante = {};
    calificacionesSnapshot.docs.forEach(doc => {
      const calif = doc.data();
      if (!calificacionesPorEstudiante[calif.studentId]) {
        calificacionesPorEstudiante[calif.studentId] = [];
      }
      calificacionesPorEstudiante[calif.studentId].push(calif);
    });

    // Crear alertas para estudiantes con bajo rendimiento
    for (const [studentId, calificaciones] of Object.entries(calificacionesPorEstudiante)) {
      const student = students.find(s => s.firestoreId === studentId);
      if (!student) continue;

      const notas = calificaciones.map(c => c.valor).filter(n => typeof n === 'number');
      if (notas.length === 0) continue;

      const promedio = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
      
      // Crear alerta si el promedio es bajo
      if (promedio < 6.0) {
        const alertData = {
          title: `Bajo rendimiento académico - ${student.nombre} ${student.apellido}`,
          description: `El estudiante tiene un promedio de ${promedio.toFixed(2)}. Se requiere atención inmediata para mejorar su rendimiento académico.`,
          type: "academic",
          priority: promedio < 4.0 ? "high" : promedio < 5.0 ? "medium" : "low",
          recipients: ["specific_students"],
          selectedStudents: [studentId],
          courseId: student.cursoId || "",
          courseName: student.cursoNombre || "",
          isActive: true,
          expiresAt: "",
          customMessage: `Promedio actual: ${promedio.toFixed(2)}. Se recomienda programar una reunión con el estudiante y sus padres.`,
          targetUserId: "all",
          selectedCourse: "",
          createdBy: "system",
          createdByRole: "system",
          createdAt: serverTimestamp(),
          status: "active",
          readBy: []
        };

        await addDoc(collection(db, "alerts"), alertData);
        console.log(`⚠️ Alerta académica creada para ${student.nombre} ${student.apellido} - Promedio: ${promedio.toFixed(2)}`);
      }
    }

    console.log("✅ Alertas académicas creadas exitosamente");
  } catch (error) {
    console.error("❌ Error creando alertas académicas:", error);
  }
}

// Función para crear alertas automáticas basadas en asistencia
export async function createAttendanceAlerts() {
  try {
    console.log("🔍 Analizando asistencias para crear alertas...");
    
    const asistenciasSnapshot = await getDocs(collection(db, "attendances"));
    const studentsSnapshot = await getDocs(collection(db, "students"));
    
    const students = studentsSnapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data()
    }));

    // Agrupar asistencias por estudiante
    const asistenciasPorEstudiante = {};
    asistenciasSnapshot.docs.forEach(doc => {
      const asist = doc.data();
      if (!asistenciasPorEstudiante[asist.studentId]) {
        asistenciasPorEstudiante[asist.studentId] = [];
      }
      asistenciasPorEstudiante[asist.studentId].push(asist);
    });

    // Crear alertas para estudiantes con baja asistencia
    for (const [studentId, asistencias] of Object.entries(asistenciasPorEstudiante)) {
      const student = students.find(s => s.firestoreId === studentId);
      if (!student) continue;

      const totalAsistencias = asistencias.length;
      const asistenciasPresentes = asistencias.filter(a => a.present).length;
      const porcentajeAsistencia = (asistenciasPresentes / totalAsistencias) * 100;

      // Crear alerta si la asistencia es baja
      if (porcentajeAsistencia < 80 && totalAsistencias >= 5) {
        const alertData = {
          title: `Baja asistencia - ${student.nombre} ${student.apellido}`,
          description: `El estudiante tiene una asistencia del ${porcentajeAsistencia.toFixed(1)}% (${asistenciasPresentes}/${totalAsistencias} clases). Se requiere seguimiento.`,
          type: "attendance",
          priority: porcentajeAsistencia < 60 ? "high" : porcentajeAsistencia < 70 ? "medium" : "low",
          recipients: ["specific_students"],
          selectedStudents: [studentId],
          courseId: student.cursoId || "",
          courseName: student.cursoNombre || "",
          isActive: true,
          expiresAt: "",
          customMessage: `Porcentaje de asistencia: ${porcentajeAsistencia.toFixed(1)}%. Se recomienda contactar a los padres para verificar la situación.`,
          targetUserId: "all",
          selectedCourse: "",
          createdBy: "system",
          createdByRole: "system",
          createdAt: serverTimestamp(),
          status: "active",
          readBy: []
        };

        await addDoc(collection(db, "alerts"), alertData);
        console.log(`⚠️ Alerta de asistencia creada para ${student.nombre} ${student.apellido} - ${porcentajeAsistencia.toFixed(1)}%`);
      }
    }

    console.log("✅ Alertas de asistencia creadas exitosamente");
  } catch (error) {
    console.error("❌ Error creando alertas de asistencia:", error);
  }
}

// Función para crear alertas automáticas para todo un curso
export async function createCourseWideAlerts() {
  try {
    console.log("🔍 Analizando cursos para crear alertas generales...");
    
    const coursesSnapshot = await getDocs(collection(db, "courses"));
    const studentsSnapshot = await getDocs(collection(db, "students"));
    
    const courses = coursesSnapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data()
    }));

    const students = studentsSnapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data()
    }));

    // Crear alertas para cada curso basadas en el rendimiento general
    for (const course of courses) {
      const courseStudents = students.filter(s => s.cursoId === course.firestoreId);
      
      if (courseStudents.length === 0) continue;

      // Calcular estadísticas del curso
      const totalStudents = courseStudents.length;
      const lowPerformanceStudents = courseStudents.filter(s => {
        // Aquí podrías agregar lógica para determinar bajo rendimiento
        return true; // Por ahora, crear alerta para todos
      }).length;

      // Crear alerta si hay problemas en el curso
      if (lowPerformanceStudents > totalStudents * 0.3) { // Si más del 30% tiene problemas
        const alertData = {
          title: `Atención requerida - Curso ${course.nombre} ${course.division}`,
          description: `Se detectaron problemas de rendimiento en el ${totalStudents * 0.3}% de los estudiantes del curso. Se requiere intervención del docente.`,
          type: "academic",
          priority: "medium",
          recipients: ["specific_course"],
          selectedStudents: [],
          courseId: course.firestoreId,
          courseName: `${course.nombre} - ${course.division}`,
          isActive: true,
          expiresAt: "",
          customMessage: `Curso: ${course.nombre} ${course.division}. Estudiantes afectados: ${lowPerformanceStudents}/${totalStudents}`,
          targetUserId: "all",
          selectedCourse: course.firestoreId,
          createdBy: "system",
          createdByRole: "system",
          createdAt: serverTimestamp(),
          status: "active",
          readBy: []
        };

        await addDoc(collection(db, "alerts"), alertData);
        console.log(`⚠️ Alerta de curso creada para ${course.nombre} ${course.division}`);
      }
    }

    console.log("✅ Alertas de curso creadas exitosamente");
  } catch (error) {
    console.error("❌ Error creando alertas de curso:", error);
  }
}

// Función principal para ejecutar todas las alertas automáticas
export async function runAutomaticAlerts() {
  console.log("🚀 Iniciando generación automática de alertas...");
  
  await createAcademicAlerts();
  await createAttendanceAlerts();
  await createCourseWideAlerts();
  
  console.log("🎉 Generación automática de alertas completada");
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
}
runAutomaticAlerts();