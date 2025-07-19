# Scripts de SchoolFlow

Este directorio contiene scripts útiles para la gestión y mantenimiento del sistema SchoolFlow.

## Scripts Disponibles

### `tables.js` - Exportación de Datos
Exporta todas las colecciones principales de Firestore a archivos JSON.

**Uso:**
```bash
npm run export-data
```

**Funcionalidades:**
- Exporta las colecciones: `courses`, `subjects`, `teachers`, `students`
- Crea un directorio `exports/` automáticamente
- Genera archivos con timestamp para evitar sobrescrituras
- Muestra progreso y resumen de la exportación
- Manejo de errores robusto

**Salida:**
- Archivo: `exports/tables_data_YYYY-MM-DDTHH-MM-SS-sssZ.json`
- Formato: JSON estructurado con todos los documentos

### `seed.js` - Creación de Datos de Prueba
Crea datos de prueba en Firestore para desarrollo.

### `createAdmin.ts` - Creación de Usuario Administrador
Crea un usuario administrador en el sistema.

### Scripts de Alertas
- `createAutomaticAlerts.js` - Genera alertas automáticas basadas en datos
- `createRealAlerts.js` - Crea alertas reales del sistema
- `runAlertsSeed.js` - Ejecuta la semilla de alertas
- `runRealAlertsSeed.js` - Ejecuta la semilla de alertas reales

## Configuración Requerida

Asegúrate de que el archivo `src/firebaseConfig.js` esté configurado correctamente con tus credenciales de Firebase.

## Notas Importantes

- Los scripts usan ES modules (import/export)
- Requieren Node.js 16+ para compatibilidad con ES modules
- Los archivos exportados se guardan en el directorio `exports/` en la raíz del proyecto
- Todos los scripts incluyen manejo de errores y logging detallado 