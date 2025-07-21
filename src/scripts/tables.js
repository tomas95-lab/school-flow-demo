import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import fs from 'fs';

async function exportData() {
  const collections = ['attendances', 'students', 'courses', 'subjects', 'teachers', 'alerts'];
  let allData = {};

  try {
    for (let col of collections) {
      console.log(`📊 Exportando colección: ${col}`);
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
        console.log('---');
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
