#!/usr/bin/env node

// Script de prueba del sistema para ejecutar desde Node.js
// Uso: node scripts/testSystem.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificación del Sistema de Calificaciones');
console.log('='.repeat(50));

const results = {
  pass: 0,
  fail: 0,
  warnings: 0,
  tests: []
};

function addTest(name, passed, message, details = null) {
  const test = { name, passed, message, details };
  results.tests.push(test);
  if (passed) results.pass++;
  else results.fail++;
  
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   📝 ${details}`);
}

// Test 1: Verificar estructura del proyecto
console.log('\n📁 Verificando estructura del proyecto...');

const requiredDirs = [
  'src',
  'src/pages',
  'src/components',
  'src/utils',
  'src/test',
  'public'
];

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/pages/Calificaciones.tsx',
  'src/utils/boletines.ts'
];

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  addTest(`Directorio ${dir}`, exists, exists ? 'Directorio encontrado' : 'Directorio no encontrado');
});

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  addTest(`Archivo ${file}`, exists, exists ? 'Archivo encontrado' : 'Archivo no encontrado');
});

// Test 2: Verificar package.json
console.log('\n📦 Verificando dependencias...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'react',
    'react-dom',
    'vite',
    '@vitejs/plugin-react-swc',
    'typescript'
  ];
  
  const requiredDevDeps = [
    '@types/react',
    '@types/react-dom'
  ];
  
  const optionalDeps = [
    'jspdf',
    'jspdf-autotable',
    'firebase'
  ];
  
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    addTest(`Dependencia ${dep}`, hasDep, hasDep ? 'Instalada' : 'No instalada');
  });
  
  requiredDevDeps.forEach(dep => {
    const hasDep = packageJson.devDependencies && packageJson.devDependencies[dep];
    addTest(`Dev Dependencia ${dep}`, hasDep, hasDep ? 'Instalada' : 'No instalada');
  });
  
  optionalDeps.forEach(dep => {
    const hasDep = (packageJson.dependencies && packageJson.dependencies[dep]) || 
                   (packageJson.devDependencies && packageJson.devDependencies[dep]);
    if (hasDep) {
      addTest(`Dependencia opcional ${dep}`, true, 'Instalada');
    } else {
      results.warnings++;
      addTest(`Dependencia opcional ${dep}`, false, 'No instalada (opcional)');
    }
  });
  
} catch (error) {
  addTest('package.json', false, 'Error al leer package.json', error.message);
}

// Test 3: Verificar configuración de TypeScript
console.log('\n⚙️ Verificando configuración de TypeScript...');

try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  addTest('tsconfig.json', true, 'Configuración válida');
  
  if (tsConfig.compilerOptions) {
    addTest('Compiler Options', true, 'Opciones de compilación configuradas');
  } else {
    addTest('Compiler Options', false, 'Opciones de compilación no encontradas');
  }
} catch (error) {
  addTest('tsconfig.json', false, 'Error en configuración de TypeScript', error.message);
}

// Test 4: Verificar configuración de Vite
console.log('\n⚡ Verificando configuración de Vite...');

try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  addTest('vite.config.ts', true, 'Archivo de configuración encontrado');
  
  if (viteConfig.includes('optimizeDeps')) {
    addTest('Optimización de dependencias', true, 'Configurada');
  } else {
    addTest('Optimización de dependencias', false, 'No configurada');
  }
  
  if (viteConfig.includes('jspdf')) {
    addTest('Configuración jsPDF', true, 'Incluida en optimización');
  } else {
    addTest('Configuración jsPDF', false, 'No incluida en optimización');
  }
} catch (error) {
  addTest('vite.config.ts', false, 'Error al leer configuración de Vite', error.message);
}

// Test 5: Verificar archivos de componentes
console.log('\n🎨 Verificando componentes...');

const componentFiles = [
  'src/pages/Calificaciones.tsx',
  'src/pages/DetallesCalificaciones.tsx',
  'src/components/AlumnoCalificacionesOverview.tsx',
  'src/components/TeacherCalificacionesOverView.tsx',
  'src/components/AdminCalificacionesOverview.tsx',
  'src/components/GradesCalendar.tsx'
];

componentFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const exists = content.length > 0;
    addTest(`Componente ${path.basename(file)}`, exists, exists ? 'Archivo válido' : 'Archivo vacío');
    
    // Verificar imports básicos
    if (content.includes('import') && content.includes('export')) {
      addTest(`Imports ${path.basename(file)}`, true, 'Imports y exports válidos');
    } else {
      addTest(`Imports ${path.basename(file)}`, false, 'Imports o exports faltantes');
    }
  } catch (error) {
    addTest(`Componente ${path.basename(file)}`, false, 'Error al leer archivo', error.message);
  }
});

// Test 6: Verificar utilidades
console.log('\n🛠️ Verificando utilidades...');

try {
  const boletinesContent = fs.readFileSync('src/utils/boletines.ts', 'utf8');
  addTest('Utilidad boletines.ts', true, 'Archivo encontrado');
  
  if (boletinesContent.includes('generarPDFBoletin')) {
    addTest('Función generarPDFBoletin', true, 'Función encontrada');
  } else {
    addTest('Función generarPDFBoletin', false, 'Función no encontrada');
  }
  
  if (boletinesContent.includes('jspdf')) {
    addTest('Import jsPDF', true, 'Import encontrado');
  } else {
    addTest('Import jsPDF', false, 'Import no encontrado');
  }
} catch (error) {
  addTest('Utilidad boletines.ts', false, 'Error al leer archivo', error.message);
}

// Test 7: Verificar archivos de prueba
console.log('\n🧪 Verificando archivos de prueba...');

const testFiles = [
  'src/test/systemCheck.ts',
  'src/test/simpleCheck.js',
  'src/test/README.md'
];

testFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const exists = content.length > 0;
    addTest(`Archivo de prueba ${path.basename(file)}`, exists, exists ? 'Archivo válido' : 'Archivo vacío');
  } catch (error) {
    addTest(`Archivo de prueba ${path.basename(file)}`, false, 'Error al leer archivo', error.message);
  }
});

// Test 8: Verificar scripts de package.json
console.log('\n📜 Verificando scripts...');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['dev', 'build', 'preview'];
  requiredScripts.forEach(script => {
    const hasScript = scripts[script];
    addTest(`Script ${script}`, hasScript, hasScript ? 'Disponible' : 'No disponible');
  });
  
  if (scripts.test) {
    addTest('Script test', true, 'Disponible');
  } else {
    addTest('Script test', false, 'No disponible (opcional)');
  }
} catch (error) {
  addTest('Scripts', false, 'Error al verificar scripts', error.message);
}

// Generar reporte final
console.log('\n📋 REPORTE FINAL');
console.log('='.repeat(50));

const totalTests = results.tests.length;
const successRate = ((results.pass / totalTests) * 100).toFixed(1);

console.log(`✅ Exitosos: ${results.pass}`);
console.log(`❌ Fallidos: ${results.fail}`);
console.log(`⚠️ Advertencias: ${results.warnings}`);
console.log(`📈 Total: ${totalTests}`);
console.log(`🎯 Tasa de éxito: ${successRate}%`);

if (results.fail === 0) {
  console.log('\n🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
  console.log('   Todos los archivos y configuraciones están en orden.');
} else {
  console.log('\n⚠️ ATENCIÓN: Se encontraron problemas que requieren atención.');
  console.log('   Revisa los errores listados arriba.');
}

console.log('\n' + '='.repeat(50));

// Guardar resultados en archivo
const reportData = {
  timestamp: new Date().toISOString(),
  results: results,
  summary: {
    pass: results.pass,
    fail: results.fail,
    warnings: results.warnings,
    total: totalTests,
    successRate: successRate
  }
};

try {
  fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
  console.log('📄 Reporte guardado en: test-results.json');
} catch (error) {
  console.log('⚠️ No se pudo guardar el reporte:', error.message);
}

// Sugerencias
console.log('\n💡 SUGERENCIAS:');
if (results.fail > 0) {
  console.log('   - Revisa los errores listados arriba');
  console.log('   - Ejecuta npm install si faltan dependencias');
  console.log('   - Verifica la configuración de TypeScript y Vite');
} else {
  console.log('   - El sistema está listo para desarrollo');
  console.log('   - Ejecuta npm run dev para iniciar el servidor');
  console.log('   - Prueba las funcionalidades en el navegador');
}

console.log('\n🚀 Para probar en el navegador:');
console.log('   1. Ejecuta: npm run dev');
console.log('   2. Abre la aplicación en el navegador');
console.log('   3. Ve a la consola (F12)');
console.log('   4. Copia y pega el contenido de src/test/simpleCheck.js'); 