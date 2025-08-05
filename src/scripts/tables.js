import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import fs from 'fs';

async function exportData() {
  // Obtener todas las colecciones disponibles
  const collections = [
    'attendances', 
    'students', 
    'courses', 
    'subjects', 
    'teachers', 
    'alerts',
    'inscripciones',
    'calificaciones',
    'boletines',
    'messages',
    'reportes',
    'configuraciones'
  ];
  let allData = {};

  try {
    for (let col of collections) {
      console.log(`📊 Exportando colección: ${col}`);
      try {
        const snapshot = await getDocs(collection(db, col));
        allData[col] = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        console.log(`✅ ${col}: ${snapshot.docs.length} documentos exportados`);
        
        // Mostrar algunos ejemplos de la estructura
        if (snapshot.docs.length > 0) {
          console.log(`📋 Ejemplo de estructura para ${col}:`);
          console.log(JSON.stringify(snapshot.docs[0].data(), null, 2));
          
          // Mostrar todos los documentos si hay pocos
          if (snapshot.docs.length <= 5) {
            console.log(`📋 Todos los documentos de ${col}:`);
            snapshot.docs.forEach((doc, index) => {
              console.log(`Documento ${index + 1}:`);
              console.log(JSON.stringify(doc.data(), null, 2));
            });
          }
        } else {
          console.log(`⚠️  ${col}: No hay documentos en esta colección`);
        }
        console.log('---');
      } catch (error) {
        console.log(`❌ Error al acceder a ${col}: ${error.message}`);
        allData[col] = [];
      }
    }

    // Crear directorio si no existe
    const outputDir = './exports';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tables_data_${timestamp}.json`;
    const filepath = `${outputDir}/${filename}`;

    fs.writeFileSync(filepath, JSON.stringify(allData, null, 2), 'utf8');
    console.log(`\n🎉 Datos exportados exitosamente a: ${filepath}`);
    
    // Mostrar resumen detallado
    console.log('\n📋 Resumen de exportación:');
    Object.keys(allData).forEach(col => {
      console.log(`  - ${col}: ${allData[col].length} documentos`);
      
      // Análisis específico para subjects
      if (col === 'subjects') {
        const subjects = allData[col];
        const courseIds = [...new Set(subjects.map(s => s.cursoId).filter(Boolean))];
        console.log(`    📚 Materias únicas: ${subjects.length}`);
        console.log(`    🏫 Cursos referenciados: ${courseIds.length} (${courseIds.join(', ')})`);
        
        // Mostrar materias que podrían tener múltiples cursos
        const subjectNames = subjects.map(s => s.nombre);
        const duplicateSubjects = subjectNames.filter((name, index) => subjectNames.indexOf(name) !== index);
        if (duplicateSubjects.length > 0) {
          console.log(`    ⚠️  Materias duplicadas: ${[...new Set(duplicateSubjects)].join(', ')}`);
        }
      }
      
      // Análisis específico para attendances
      if (col === 'attendances') {
        const attendances = allData[col];
        const subjects = [...new Set(attendances.map(a => a.subject).filter(Boolean))];
        const courses = [...new Set(attendances.map(a => a.courseId).filter(Boolean))];
        console.log(`    📝 Registros de asistencia: ${attendances.length}`);
        console.log(`    📚 Materias en asistencias: ${subjects.length} (${subjects.join(', ')})`);
        console.log(`    🏫 Cursos en asistencias: ${courses.length} (${courses.join(', ')})`);
      }
      
      // Análisis específico para inscripciones
      if (col === 'inscripciones') {
        const inscripciones = allData[col];
        const statuses = [...new Set(inscripciones.map(i => i.status).filter(Boolean))];
        const courses = [...new Set(inscripciones.map(i => i.courseId).filter(Boolean))];
        console.log(`    📝 Registros de inscripción: ${inscripciones.length}`);
        console.log(`    📊 Estados: ${statuses.length} (${statuses.join(', ')})`);
        console.log(`    🏫 Cursos: ${courses.length} (${courses.join(', ')})`);
      }
      
      // Análisis específico para calificaciones
      if (col === 'calificaciones') {
        const calificaciones = allData[col];
        const subjects = [...new Set(calificaciones.map(c => c.subjectId).filter(Boolean))];
        const students = [...new Set(calificaciones.map(c => c.studentId).filter(Boolean))];
        console.log(`    📝 Registros de calificación: ${calificaciones.length}`);
        console.log(`    📚 Materias: ${subjects.length} (${subjects.join(', ')})`);
        console.log(`    👥 Estudiantes: ${students.length} (${students.join(', ')})`);
      }
      
      // Análisis específico para messages
      if (col === 'messages') {
        const messages = allData[col];
        const types = [...new Set(messages.map(m => m.messageType).filter(Boolean))];
        const courses = [...new Set(messages.map(m => m.courseId).filter(Boolean))];
        console.log(`    📝 Mensajes: ${messages.length}`);
        console.log(`    📊 Tipos: ${types.length} (${types.join(', ')})`);
        console.log(`    🏫 Cursos: ${courses.length} (${courses.join(', ')})`);
      }
    });

  } catch (error) {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
  }
}

// Ejecutar la función
exportData()
  .then(() => {
    console.log('\n✨ Exportación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
