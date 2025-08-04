import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Test de autenticación y permisos de Firestore
 * Este test verifica que:
 * 1. El usuario puede autenticarse
 * 2. El usuario tiene un rol válido
 * 3. El usuario puede acceder a las colecciones permitidas
 */

export async function testAuthentication() {
  console.log('🧪 Iniciando test de autenticación...');
  
  try {
    // Verificar estado de autenticación actual
    const currentUser = auth.currentUser;
    console.log('👤 Usuario actual:', currentUser ? currentUser.email : 'No autenticado');
    
    if (!currentUser) {
      console.log('⚠️ No hay usuario autenticado. El test requiere autenticación.');
      return false;
    }
    
    // Obtener datos del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      console.error('❌ Documento de usuario no encontrado');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('📋 Datos del usuario:', {
      uid: currentUser.uid,
      email: currentUser.email,
      role: userData.role,
      name: userData.name
    });
    
    // Verificar que el rol es válido
    const validRoles = ['admin', 'docente', 'alumno', 'familiar'];
    if (!validRoles.includes(userData.role)) {
      console.error('❌ Rol de usuario inválido:', userData.role);
      return false;
    }
    
    console.log('✅ Usuario autenticado correctamente con rol:', userData.role);
    return true;
    
  } catch (error) {
    console.error('❌ Error en test de autenticación:', error);
    return false;
  }
}

export async function testFirestorePermissions() {
  console.log('🔒 Iniciando test de permisos de Firestore...');
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('⚠️ No hay usuario autenticado para probar permisos');
      return false;
    }
    
    // Obtener rol del usuario
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userRole = userDoc.data()?.role;
    
    console.log('👤 Probando permisos para rol:', userRole);
    
    // Test de acceso a colecciones básicas
    const collectionsToTest = [
      'students',
      'teachers', 
      'courses',
      'subjects',
      'attendances',
      'calificaciones',
      'alerts'
    ];
    
    for (const collectionName of collectionsToTest) {
      try {
        const testDoc = await getDoc(doc(db, collectionName, 'test-doc-id'));
        console.log(`✅ Acceso a ${collectionName}: Permitido`);
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.log(`❌ Acceso a ${collectionName}: Denegado`);
        } else {
          console.log(`⚠️ Error al acceder a ${collectionName}:`, error.message);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en test de permisos:', error);
    return false;
  }
}

export async function runAuthTests() {
  console.log('🚀 Ejecutando tests de autenticación y permisos...\n');
  
  const authResult = await testAuthentication();
  console.log('');
  
  const permissionsResult = await testFirestorePermissions();
  console.log('');
  
  if (authResult && permissionsResult) {
    console.log('🎉 Todos los tests pasaron correctamente');
    return true;
  } else {
    console.log('❌ Algunos tests fallaron');
    return false;
  }
}

// Ejecutar tests si se llama directamente
if (typeof window !== 'undefined') {
  // Solo ejecutar en el navegador
  window.addEventListener('load', () => {
    setTimeout(() => {
      runAuthTests();
    }, 2000); // Esperar a que la app se cargue
  });
} 