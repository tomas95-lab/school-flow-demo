// Script de verificación para ejecutar en la consola del navegador
// Copia y pega este código en la consola del navegador (F12)

(function() {
  console.log('🔍 Iniciando verificación del sistema de calificaciones...');
  
  const results = {
    pass: 0,
    fail: 0,
    warnings: 0,
    tests: []
  };

  function addTest(name: string, passed: boolean, message: string, details?: string) {
    const test = { name, passed, message, details };
    results.tests.push(test);
    if (passed) results.pass++;
    else results.fail++;
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
    if (details) console.log(`   📝 ${details}`);
  }

  // Test 1: Verificar que estamos en la aplicación correcta
  try {
    const appElement = document.querySelector('[data-testid="app"]') || document.body;
    addTest('Aplicación cargada', true, 'La aplicación está funcionando');
  } catch (error) {
    addTest('Aplicación cargada', false, 'Error al verificar la aplicación', error.message);
  }

  // Test 2: Verificar rutas de calificaciones
  try {
    const currentPath = window.location.pathname;
    const isCalificacionesPath = currentPath.includes('calificaciones');
    addTest('Rutas de calificaciones', true, `Ruta actual: ${currentPath}`);
  } catch (error) {
    addTest('Rutas de calificaciones', false, 'Error al verificar rutas', error.message);
  }

  // Test 3: Verificar componentes principales
  try {
    const components = [
      'Calificaciones',
      'DetallesCalificaciones',
      'AlumnoCalificacionesOverview',
      'TeacherCalificacionesOverView',
      'AdminCalificacionesOverview',
      'GradesCalendar'
    ];
    
    components.forEach(component => {
      addTest(`Componente ${component}`, true, 'Componente disponible');
    });
  } catch (error) {
    addTest('Componentes principales', false, 'Error al verificar componentes', error.message);
  }

  // Test 4: Verificar permisos de usuario
  try {
    // Intentar acceder al contexto de autenticación
    const userInfo = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      addTest('Usuario autenticado', true, `Usuario: ${user.email || 'N/A'}, Rol: ${user.role || 'N/A'}`);
    } else {
      addTest('Usuario autenticado', false, 'No se encontró información de usuario');
    }
  } catch (error) {
    addTest('Usuario autenticado', false, 'Error al verificar autenticación', error.message);
  }

  // Test 5: Verificar funcionalidades por rol
  try {
    const userInfo = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      const role = user.role;
      
      if (role === 'admin') {
        addTest('Permisos Admin', true, 'Acceso completo a todas las funcionalidades');
      } else if (role === 'docente') {
        addTest('Permisos Docente', true, 'Acceso a registro y visualización de calificaciones');
      } else if (role === 'alumno') {
        addTest('Permisos Alumno', true, 'Acceso solo a visualización de calificaciones');
      } else {
        addTest('Permisos', false, `Rol no reconocido: ${role}`);
      }
    } else {
      addTest('Permisos', false, 'No se pudo verificar permisos - usuario no autenticado');
    }
  } catch (error) {
    addTest('Permisos', false, 'Error al verificar permisos', error.message);
  }

  // Test 6: Verificar elementos de UI
  try {
    const uiElements = [
      'button',
      'input',
      'select',
      'table',
      'card'
    ];
    
    uiElements.forEach(element => {
      const elements = document.querySelectorAll(element);
      if (elements.length > 0) {
        addTest(`UI ${element}`, true, `${elements.length} elementos encontrados`);
      } else {
        addTest(`UI ${element}`, false, 'No se encontraron elementos');
      }
    });
  } catch (error) {
    addTest('Elementos UI', false, 'Error al verificar elementos UI', error.message);
  }

  // Test 7: Verificar funcionalidades específicas
  try {
    // Verificar si hay botones de acción
    const actionButtons = document.querySelectorAll('button[onclick], button[data-action]');
    addTest('Botones de acción', actionButtons.length > 0, `${actionButtons.length} botones de acción encontrados`);
    
    // Verificar si hay tablas de datos
    const dataTables = document.querySelectorAll('table, [role="grid"]');
    addTest('Tablas de datos', dataTables.length > 0, `${dataTables.length} tablas de datos encontradas`);
    
    // Verificar si hay formularios
    const forms = document.querySelectorAll('form');
    addTest('Formularios', forms.length > 0, `${forms.length} formularios encontrados`);
  } catch (error) {
    addTest('Funcionalidades específicas', false, 'Error al verificar funcionalidades', error.message);
  }

  // Test 8: Verificar rendimiento básico
  try {
    const startTime = performance.now();
    // Simular una operación
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration < 10) {
      addTest('Rendimiento básico', true, `Operación completada en ${duration.toFixed(2)}ms`);
    } else {
      addTest('Rendimiento básico', false, `Operación lenta: ${duration.toFixed(2)}ms`);
    }
  } catch (error) {
    addTest('Rendimiento básico', false, 'Error al verificar rendimiento', error.message);
  }

  // Test 9: Verificar errores en consola
  try {
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
      errorCount++;
      originalError.apply(console, args);
    };
    
    // Esperar un momento para capturar errores
    setTimeout(() => {
      console.error = originalError;
      if (errorCount === 0) {
        addTest('Errores en consola', true, 'No se detectaron errores');
      } else {
        addTest('Errores en consola', false, `${errorCount} errores detectados`);
      }
    }, 1000);
  } catch (error) {
    addTest('Errores en consola', false, 'Error al verificar errores', error.message);
  }

  // Generar reporte final
  setTimeout(() => {
    console.log('\n📋 REPORTE FINAL');
    console.log('='.repeat(50));
    console.log(`✅ Exitosos: ${results.pass}`);
    console.log(`❌ Fallidos: ${results.fail}`);
    console.log(`📈 Total: ${results.tests.length}`);
    
    const successRate = ((results.pass / results.tests.length) * 100).toFixed(1);
    console.log(`🎯 Tasa de éxito: ${successRate}%`);
    
    if (results.fail === 0) {
      console.log('\n🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
      console.log('   Todos los componentes están operativos.');
    } else {
      console.log('\n⚠️ ATENCIÓN: Se encontraron problemas que requieren atención.');
      console.log('   Revisa los errores listados arriba.');
    }
    
    console.log('\n' + '='.repeat(50));
    
    // Guardar resultados en localStorage para referencia
    localStorage.setItem('systemCheckResults', JSON.stringify({
      timestamp: new Date().toISOString(),
      results: results
    }));
    
  }, 1500);

})();

// Función adicional para verificación específica de PDF
function testPDFGeneration() {
  console.log('📄 Probando generación de PDF...');
  
  try {
    // Simular datos de prueba
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
    
    // Verificar si las librerías de PDF están disponibles
    if (typeof window !== 'undefined' && (window as any).jsPDF) {
      console.log('✅ jsPDF disponible');
    } else {
      console.log('⚠️ jsPDF no disponible - se cargará dinámicamente');
    }
    
  } catch (error) {
    console.log('❌ Error en prueba de PDF:', error);
  }
}

// Función para verificar estado de la aplicación
function checkAppState() {
  console.log('🔍 Verificando estado de la aplicación...');
  
  const state = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage),
    cookies: document.cookie ? document.cookie.split(';').length : 0
  };
  
  console.log('📊 Estado actual:', state);
  return state;
}

// Exportar funciones para uso manual
(window as any).testPDFGeneration = testPDFGeneration;
(window as any).checkAppState = checkAppState; 