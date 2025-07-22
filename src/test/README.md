# Sistema de Pruebas - Módulo de Calificaciones

Este directorio contiene scripts y herramientas para verificar que el módulo de calificaciones funcione correctamente.

## 📋 Archivos de Prueba

### 1. `simpleCheck.js` - Verificación Rápida
**Uso:** Copia y pega el contenido en la consola del navegador (F12)

```javascript
// Ejecutar en la consola del navegador
// Copia todo el contenido de src/test/simpleCheck.js
```

**Qué verifica:**
- ✅ Aplicación cargada
- ✅ Rutas funcionando
- ✅ Elementos de UI presentes
- ✅ Autenticación de usuario
- ✅ Permisos por rol
- ✅ Funcionalidades específicas
- ✅ Rendimiento básico
- ✅ Módulo de calificaciones

### 2. `systemCheck.ts` - Verificación Completa
**Uso:** Importar y ejecutar desde el código

```typescript
import { runSystemCheck, quickCheck } from './test/systemCheck';

// Verificación completa
await runSystemCheck();

// Verificación rápida
await quickCheck();
```

**Qué verifica:**
- 🔍 Importaciones y dependencias
- 📄 Generación de PDF
- 🔐 Sistema de permisos
- 📊 Estructuras de datos
- 🎨 Componentes de UI
- ⚠️ Manejo de errores
- ⚡ Optimizaciones de rendimiento
- 🔒 Medidas de seguridad

### 3. `calificaciones.test.tsx` - Pruebas Unitarias
**Uso:** Ejecutar con Jest (requiere configuración adicional)

```bash
npm test -- calificaciones.test.tsx
```

## 🚀 Cómo Ejecutar las Pruebas

### Opción 1: Verificación en Navegador (Recomendada)

1. Abre la aplicación en el navegador
2. Navega al módulo de calificaciones
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Console"
5. Copia y pega el contenido de `simpleCheck.js`
6. Presiona Enter

### Opción 2: Verificación Programática

```typescript
// En cualquier componente o archivo
import { runSystemCheck } from './test/systemCheck';

// Ejecutar verificación completa
useEffect(() => {
  runSystemCheck();
}, []);
```

### Opción 3: Verificación Manual

1. **Verificar permisos por rol:**
   - Admin: Debe ver todas las funcionalidades
   - Docente: Debe ver solo sus cursos
   - Alumno: Debe ver solo sus calificaciones

2. **Verificar funcionalidades:**
   - Registro de calificaciones (solo docentes)
   - Visualización de calificaciones
   - Calendario de calificaciones
   - Generación de PDF
   - Filtros y búsquedas

3. **Verificar errores:**
   - Acceso denegado para roles incorrectos
   - Manejo de datos vacíos
   - Errores de red
   - Errores de PDF

## 📊 Interpretación de Resultados

### ✅ Exitoso
- Componente funcionando correctamente
- No requiere acción

### ❌ Fallido
- Problema detectado
- Requiere corrección

### ⚠️ Advertencia
- Posible problema
- Requiere revisión

## 🎯 Criterios de Éxito

El sistema se considera funcionando correctamente cuando:

1. **Tasa de éxito ≥ 90%**
2. **Sin errores críticos**
3. **Todos los roles funcionan**
4. **PDF se genera correctamente**
5. **Permisos respetados**

## 🔧 Solución de Problemas

### Error: "jsPDF no disponible"
```bash
npm install jspdf jspdf-autotable
```

### Error: "Rendered more hooks"
- Verificar que los hooks estén en el orden correcto
- No usar hooks condicionalmente

### Error: "Permisos insuficientes"
- Verificar configuración de roles
- Revisar lógica de permisos en componentes

### Error: "Datos no encontrados"
- Verificar conexión a Firestore
- Revisar estructura de datos

## 📝 Reportes

Los resultados se guardan automáticamente en:
- `localStorage.systemCheckResults`
- Consola del navegador

### Ejemplo de Reporte

```
📋 REPORTE FINAL
==================================================
✅ Exitosos: 15
❌ Fallidos: 0
📈 Total: 15
🎯 Tasa de éxito: 100.0%

🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!
   Todos los componentes están operativos.
==================================================
```

## 🚨 Alertas Importantes

1. **Siempre ejecutar las pruebas después de cambios importantes**
2. **Verificar en diferentes roles de usuario**
3. **Probar en diferentes navegadores**
4. **Verificar en dispositivos móviles**

## 📞 Soporte

Si encuentras problemas:

1. Ejecuta `simpleCheck.js` en la consola
2. Revisa los errores en la consola
3. Verifica la configuración de Vite
4. Revisa las dependencias instaladas

---

**Nota:** Estas pruebas son para verificación manual y desarrollo. Para pruebas automatizadas en CI/CD, se recomienda configurar Jest con React Testing Library. 