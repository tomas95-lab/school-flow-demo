#!/usr/bin/env node

/**
 * 📋 Script para Listar Colecciones de Firebase
 * 
 * Este script lista todas las colecciones existentes en Firebase
 * y muestra el número de documentos en cada una.
 * 
 * USO:
 * npm run list-collections
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs
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

// Posibles colecciones del sistema
const POSSIBLE_COLLECTIONS = [
  'users',            // Usuarios (PROTEGIDA)
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

/**
 * Función para verificar y contar documentos en una colección
 */
async function checkCollection(collectionName) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    
    return {
      name: collectionName,
      exists: true,
      count: snapshot.docs.length,
      isEmpty: snapshot.empty
    };
  } catch (error) {
    if (error.code === 'permission-denied') {
      return {
        name: collectionName,
        exists: false,
        error: 'Sin permisos',
        count: 0
      };
    } else {
      return {
        name: collectionName,
        exists: false,
        error: error.message,
        count: 0
      };
    }
  }
}

/**
 * Función para mostrar algunos documentos de ejemplo
 */
async function showSampleDocs(collectionName, maxSamples = 2) {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.slice(0, maxSamples).map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('📋 SchoolFlow MVP - Listado de Colecciones Firebase');
  console.log('=' .repeat(60));
  console.log('');
  
  // Verificar configuración de Firebase
  if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your_project_id') {
    console.error('❌ Error: Configuración de Firebase no encontrada');
    console.error('   Asegúrate de tener las variables de entorno configuradas');
    process.exit(1);
  }
  
  console.log(`🎯 Proyecto Firebase: ${firebaseConfig.projectId}`);
  console.log('');
  
  const results = {
    existing: [],
    nonExisting: [],
    totalDocs: 0
  };
  
  // Verificar cada colección
  for (const collectionName of POSSIBLE_COLLECTIONS) {
    process.stdout.write(`🔍 Verificando ${collectionName}... `);
    
    const result = await checkCollection(collectionName);
    
    if (result.exists) {
      results.existing.push(result);
      results.totalDocs += result.count;
      
      const status = result.isEmpty ? '(vacía)' : `(${result.count} docs)`;
      console.log(`✅ ${status}`);
    } else {
      results.nonExisting.push(result);
      const reason = result.error || 'No existe';
      console.log(`❌ ${reason}`);
    }
  }
  
  console.log('');
  console.log('📊 RESUMEN DE COLECCIONES');
  console.log('=' .repeat(60));
  console.log('');
  
  if (results.existing.length > 0) {
    console.log('✅ Colecciones existentes:');
    console.log('');
    
    // Separar colección protegida
    const usersCollection = results.existing.find(col => col.name === 'users');
    const otherCollections = results.existing.filter(col => col.name !== 'users');
    
    if (usersCollection) {
      console.log(`🛡️  ${usersCollection.name.padEnd(20)} | ${usersCollection.count.toString().padStart(6)} documentos | PROTEGIDA`);
      console.log('-'.repeat(60));
    }
    
    otherCollections.forEach(result => {
      const status = result.isEmpty ? 'VACÍA' : 'CON DATOS';
      console.log(`📁 ${result.name.padEnd(20)} | ${result.count.toString().padStart(6)} documentos | ${status}`);
    });
    
    console.log('');
    
    // Mostrar ejemplos de algunas colecciones con datos
    const collectionsWithData = results.existing.filter(col => col.count > 0);
    if (collectionsWithData.length > 0) {
      console.log('📋 Ejemplos de documentos (primeras 3 colecciones con datos):');
      console.log('');
      
      for (let i = 0; i < Math.min(3, collectionsWithData.length); i++) {
        const col = collectionsWithData[i];
        console.log(`📄 Colección: ${col.name}`);
        
        const samples = await showSampleDocs(col.name, 1);
        if (samples.length > 0) {
          console.log(`   ID: ${samples[0].id}`);
          console.log(`   Estructura:`, JSON.stringify(samples[0].data, null, 6).split('\n').slice(0, 10).join('\n'));
          if (Object.keys(samples[0].data).length > 5) {
            console.log('   ...(truncado)');
          }
        }
        console.log('');
      }
    }
  }
  
  if (results.nonExisting.length > 0) {
    console.log('❌ Colecciones no encontradas o sin acceso:');
    results.nonExisting.forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`);
    });
    console.log('');
  }
  
  console.log('📈 ESTADÍSTICAS FINALES');
  console.log('=' .repeat(60));
  console.log(`📁 Colecciones existentes: ${results.existing.length}`);
  console.log(`📄 Total de documentos: ${results.totalDocs}`);
  console.log(`🛡️  Colecciones protegidas: 1 (users)`);
  console.log(`🧹 Colecciones que se pueden limpiar: ${results.existing.length - 1}`);
  console.log('');
  
  if (results.existing.length > 1) { // Más que solo 'users'
    console.log('💡 Para limpiar todas las colecciones (excepto users), ejecuta:');
    console.log('   npm run clean-collections');
  } else {
    console.log('✨ Solo existe la colección users, no hay nada que limpiar');
  }
  
  process.exit(0);
}

// Manejo de errores
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
});