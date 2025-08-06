#!/usr/bin/env node

/**
 * 🧹 Script de Limpieza de Firebase Collections
 * 
 * Este script elimina todos los documentos de las colecciones especificadas,
 * EXCEPTO la colección 'users' que se mantiene intacta.
 * 
 * USO:
 * npm run clean-collections
 * 
 * CUIDADO: Esta operación es IRREVERSIBLE
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno desde .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

config({ path: join(projectRoot, '.env.local') });

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your_api_key_here",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "your_app_id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ⚠️ COLECCIONES A LIMPIAR (TODAS EXCEPTO 'users')
const COLLECTIONS_TO_CLEAN = [
  'attendances',      // Asistencias
  'students',         // Estudiantes  
  'courses',          // Cursos
  'subjects',         // Materias
  'teachers',         // Profesores
  'alerts',           // Alertas
  'inscripciones',    // Inscripciones
  'calificaciones',   // Calificaciones
  'boletines',        // Boletines
  'messages',         // Mensajes
  'reportes',         // Reportes
  'configuraciones',  // Configuraciones
  'notifications',    // Notificaciones
  'evaluations',      // Evaluaciones
  'schedules',        // Horarios
  'academic_periods', // Períodos académicos
  'grades',           // Grados/Niveles
  'evaluation_types', // Tipos de evaluación
];

// 🛡️ COLECCIONES PROTEGIDAS (NO SE LIMPIAN)
const PROTECTED_COLLECTIONS = [
  'users'  // Mantener usuarios intactos
];

/**
 * Función para limpiar una colección específica
 */
async function cleanCollection(collectionName) {
  try {
    console.log(`🧹 Limpiando colección: ${collectionName}`);
    
    // Obtener todos los documentos de la colección
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      console.log(`   ⚪ Colección '${collectionName}' ya está vacía`);
      return { success: true, deleted: 0 };
    }

    console.log(`   📊 Encontrados ${snapshot.docs.length} documentos para eliminar`);
    
    // Eliminar documentos en lotes de 10 para evitar sobrecarga
    const batchSize = 10;
    let deletedCount = 0;
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = snapshot.docs.slice(i, i + batchSize);
      
      const deletePromises = batch.map(async (document) => {
        try {
          await deleteDoc(doc(db, collectionName, document.id));
          return true;
        } catch (error) {
          console.error(`   ❌ Error eliminando documento ${document.id}:`, error.message);
          return false;
        }
      });
      
      const results = await Promise.all(deletePromises);
      const batchDeletedCount = results.filter(result => result).length;
      deletedCount += batchDeletedCount;
      
      console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batchDeletedCount}/${batch.length} documentos eliminados`);
      
      // Pequeña pausa entre lotes para no sobrecargar Firebase
      if (i + batchSize < snapshot.docs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`   🎉 Colección '${collectionName}' limpiada: ${deletedCount}/${snapshot.docs.length} documentos eliminados`);
    return { success: true, deleted: deletedCount, total: snapshot.docs.length };
    
  } catch (error) {
    console.error(`   ❌ Error limpiando colección '${collectionName}':`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Función para verificar si una colección existe
 */
async function collectionExists(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.log(`   ⚠️  Sin permisos para acceder a '${collectionName}'`);
      return false;
    }
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 SchoolFlow MVP - Limpieza de Colecciones Firebase');
  console.log('=' .repeat(60));
  console.log('');
  
  // Verificar configuración de Firebase
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your_project_id') {
    console.error('❌ Error: Configuración de Firebase no encontrada');
    console.error('   Asegúrate de tener las variables de entorno configuradas');
    console.error('   o edita la configuración en este script');
    process.exit(1);
  }
  
  console.log(`🎯 Proyecto Firebase: ${firebaseConfig.projectId}`);
  console.log('');
  
  // Mostrar colecciones que se van a limpiar
  console.log('📋 Colecciones a limpiar:');
  COLLECTIONS_TO_CLEAN.forEach(col => {
    console.log(`   • ${col}`);
  });
  console.log('');
  
  // Mostrar colecciones protegidas
  console.log('🛡️  Colecciones protegidas (NO se limpian):');
  PROTECTED_COLLECTIONS.forEach(col => {
    console.log(`   • ${col}`);
  });
  console.log('');
  
  // Confirmación de seguridad
  console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos de las colecciones listadas');
  console.log('⚠️  Esta acción es IRREVERSIBLE');
  console.log('');
  
  // En un entorno de producción, podrías añadir una confirmación interactiva aquí
  // Para el script automatizado, procedemos directamente
  
  const results = {
    successful: [],
    failed: [],
    totalDeleted: 0
  };
  
  // Limpiar cada colección
  for (const collectionName of COLLECTIONS_TO_CLEAN) {
    // Verificar si la colección existe
    const exists = await collectionExists(collectionName);
    if (!exists) {
      console.log(`⚪ Colección '${collectionName}' no existe o sin permisos`);
      continue;
    }
    
    const result = await cleanCollection(collectionName);
    
    if (result.success) {
      results.successful.push({
        collection: collectionName,
        deleted: result.deleted,
        total: result.total || result.deleted
      });
      results.totalDeleted += result.deleted;
    } else {
      results.failed.push({
        collection: collectionName,
        error: result.error
      });
    }
    
    console.log(''); // Línea en blanco entre colecciones
  }
  
  // Mostrar resumen final
  console.log('🎉 LIMPIEZA COMPLETADA');
  console.log('=' .repeat(60));
  console.log('');
  
  if (results.successful.length > 0) {
    console.log('✅ Colecciones limpiadas exitosamente:');
    results.successful.forEach(result => {
      console.log(`   • ${result.collection}: ${result.deleted}/${result.total} documentos eliminados`);
    });
    console.log('');
  }
  
  if (results.failed.length > 0) {
    console.log('❌ Colecciones con errores:');
    results.failed.forEach(result => {
      console.log(`   • ${result.collection}: ${result.error}`);
    });
    console.log('');
  }
  
  console.log(`📊 TOTAL: ${results.totalDeleted} documentos eliminados`);
  console.log(`🛡️  Colección 'users' mantenida intacta`);
  console.log('');
  console.log('🎯 Sistema listo para crear nuevos datos de demostración');
  
  process.exit(0);
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
});