import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import fs from 'fs';

async function exportData() {
  const collections = ['courses', 'subjects', 'teachers', 'students', 'attendances'];
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
    
    // Mostrar resumen
    console.log('\n📋 Resumen de exportación:');
    Object.keys(allData).forEach(col => {
      console.log(`  - ${col}: ${allData[col].length} documentos`);
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
