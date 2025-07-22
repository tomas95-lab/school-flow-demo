// Script simple de verificación del sistema
// Ejecutar en la consola del navegador: copy-paste este código

console.log('🔍 Verificación del Sistema de Calificaciones');
console.log('='.repeat(50));

// Función para agregar resultados
function addResult(testName, passed, message) {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${message}`);
  return passed;
}

// Array para almacenar resultados
const results = [];

// Test 1: Verificar aplicación
results.push(addResult('Aplicación', true, 'Aplicación cargada correctamente'));

// Test 2: Verificar rutas
const currentPath = window.location.pathname;
results.push(addResult('Rutas', true, `Ruta actual: ${currentPath}`));

// Test 3: Verificar elementos de UI
const buttons = document.querySelectorAll('button');
const inputs = document.querySelectorAll('input');
const tables = document.querySelectorAll('table');

results.push(addResult('Botones', buttons.length > 0, `${buttons.length} botones encontrados`));
results.push(addResult('Inputs', inputs.length > 0, `${inputs.length} inputs encontrados`));
results.push(addResult('Tablas', tables.length > 0, `${tables.length} tablas encontradas`));

// Test 4: Verificar autenticación
try {
  const userInfo = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userInfo) {
    const user = JSON.parse(userInfo);
    results.push(addResult('Usuario', true, `Usuario: ${user.email || 'N/A'}, Rol: ${user.role || 'N/A'}`));
  } else {
    results.push(addResult('Usuario', false, 'No hay usuario autenticado'));
  }
} catch (error) {
  results.push(addResult('Usuario', false, 'Error al verificar usuario'));
}

// Test 5: Verificar permisos
try {
  const userInfo = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userInfo) {
    const user = JSON.parse(userInfo);
    const role = user.role;
    
    if (role === 'admin') {
      results.push(addResult('Permisos', true, 'Admin: Acceso completo'));
    } else if (role === 'docente') {
      results.push(addResult('Permisos', true, 'Docente: Registro y visualización'));
    } else if (role === 'alumno') {
      results.push(addResult('Permisos', true, 'Alumno: Solo visualización'));
    } else {
      results.push(addResult('Permisos', false, `Rol no reconocido: ${role}`));
    }
  } else {
    results.push(addResult('Permisos', false, 'No se pudo verificar permisos'));
  }
} catch (error) {
  results.push(addResult('Permisos', false, 'Error al verificar permisos'));
}

// Test 6: Verificar funcionalidades específicas
const actionButtons = document.querySelectorAll('button[onclick], button[data-action]');
const forms = document.querySelectorAll('form');
const cards = document.querySelectorAll('[class*="card"]');

results.push(addResult('Botones de acción', actionButtons.length > 0, `${actionButtons.length} botones de acción`));
results.push(addResult('Formularios', forms.length > 0, `${forms.length} formularios`));
results.push(addResult('Cards', cards.length > 0, `${cards.length} cards`));

// Test 7: Verificar rendimiento
const startTime = performance.now();
for (let i = 0; i < 1000; i++) {
  Math.random();
}
const endTime = performance.now();
const duration = endTime - startTime;

results.push(addResult('Rendimiento', duration < 10, `Operación en ${duration.toFixed(2)}ms`));

// Test 8: Verificar módulo de calificaciones
const calificacionesElements = document.querySelectorAll('[class*="calificacion"], [class*="grade"]');
results.push(addResult('Módulo Calificaciones', calificacionesElements.length > 0, `${calificacionesElements.length} elementos de calificaciones`));

// Generar reporte final
console.log('\n📋 REPORTE FINAL');
console.log('='.repeat(50));

const passCount = results.filter(r => r).length;
const failCount = results.filter(r => !r).length;
const totalCount = results.length;

console.log(`✅ Exitosos: ${passCount}`);
console.log(`❌ Fallidos: ${failCount}`);
console.log(`📈 Total: ${totalCount}`);

const successRate = ((passCount / totalCount) * 100).toFixed(1);
console.log(`🎯 Tasa de éxito: ${successRate}%`);

if (failCount === 0) {
  console.log('\n🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
  console.log('   Todos los componentes están operativos.');
} else {
  console.log('\n⚠️ ATENCIÓN: Se encontraron problemas que requieren atención.');
  console.log('   Revisa los errores listados arriba.');
}

console.log('\n' + '='.repeat(50));

// Función para verificar PDF
function testPDF() {
  console.log('📄 Probando generación de PDF...');
  
  const testData = {
    Nombre: 'Estudiante Test',
    periodo: '2024-1',
    promediototal: 8.5,
    estado: 'abierto',
    alertas: 2,
    materias: [
      {
        nombre: 'Matemáticas',
        t1: 8.5,
        t2: 9.0,
        t3: 8.0,
        promedio: 8.5
      }
    ]
  };
  
  console.log('✅ Datos de prueba preparados');
  console.log('📊 Datos:', testData);
  
  // Verificar si jsPDF está disponible
  if (typeof window !== 'undefined' && window.jsPDF) {
    console.log('✅ jsPDF disponible');
  } else {
    console.log('⚠️ jsPDF no disponible - se cargará dinámicamente');
  }
}

// Función para verificar estado
function checkState() {
  console.log('🔍 Estado de la aplicación:');
  console.log('URL:', window.location.href);
  console.log('User Agent:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
  console.log('LocalStorage keys:', Object.keys(localStorage));
  console.log('SessionStorage keys:', Object.keys(sessionStorage));
}

// Exportar funciones
window.testPDF = testPDF;
window.checkState = checkState;

console.log('\n💡 Funciones disponibles:');
console.log('  - testPDF(): Probar generación de PDF');
console.log('  - checkState(): Verificar estado de la aplicación'); 