# Sistema de Alertas Automáticas

## 📋 Descripción General

El **Sistema de Alertas Automáticas** es una funcionalidad de IA que analiza automáticamente los datos académicos de los estudiantes para generar alertas inteligentes basadas en patrones de rendimiento, asistencia y tendencias.

## 🎯 Objetivos

- **Detección temprana** de problemas académicos
- **Identificación automática** de estudiantes en riesgo
- **Reconocimiento de mejoras** significativas
- **Priorización inteligente** de alertas según gravedad
- **Personalización por rol** (admin, docente, alumno)

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Motor de Análisis** (`src/utils/alertasAutomaticas.ts`)
   - Lógica de generación de alertas
   - Cálculo de métricas académicas
   - Aplicación de reglas de negocio

2. **Panel de Visualización** (`src/components/AlertasAutomaticasPanel.tsx`)
   - Interfaz de usuario para mostrar alertas
   - Filtros por prioridad y tipo
   - Integración con roles de usuario

3. **Integración con Dashboard** (`src/pages/Dashboard.tsx`)
   - Alertas críticas en vista principal
   - Acceso rápido a información importante

## 📊 Tipos de Alertas

### 1. Rendimiento Crítico
- **Condición**: Promedio < 5.0
- **Prioridad**: Crítica
- **Descripción**: Rendimiento académico crítico que requiere intervención inmediata

### 2. Rendimiento Bajo
- **Condición**: Promedio entre 5.0 y 6.0
- **Prioridad**: Alta
- **Descripción**: Rendimiento académico bajo que necesita atención

### 3. Asistencia Crítica
- **Condición**: Asistencia < 70% o más de 5 ausencias
- **Prioridad**: Crítica
- **Descripción**: Problemas graves de asistencia que afectan el aprendizaje

### 4. Asistencia Baja
- **Condición**: Asistencia entre 70-80% o 3-5 ausencias
- **Prioridad**: Alta
- **Descripción**: Asistencia baja que puede afectar el rendimiento

### 5. Tendencia Negativa
- **Condición**: Disminución de más de 1 punto en el promedio
- **Prioridad**: Alta
- **Descripción**: Tendencia negativa en el rendimiento académico

### 6. Múltiples Materias en Riesgo
- **Condición**: 2 o más materias con promedio < 6.0
- **Prioridad**: Alta
- **Descripción**: Múltiples materias con rendimiento bajo

### 7. Mejora Significativa
- **Condición**: Aumento de más de 1 punto en el promedio
- **Prioridad**: Baja
- **Descripción**: Mejora significativa en el rendimiento

## 🔧 Configuración de Reglas

### Estructura de una Regla

```typescript
const REGLA_EJEMPLO = {
  condicion: (datos, promedioActual, ...otrosParametros) => boolean,
  titulo: "Título de la Alerta",
  descripcion: "Descripción detallada",
  tipo: 'tipo_alerta',
  prioridad: 'critica' | 'alta' | 'media' | 'baja'
};
```

### Parámetros de Condición

- `datos`: Datos completos del estudiante
- `promedioActual`: Promedio del período actual
- `promedioAnterior`: Promedio del período anterior (opcional)
- `ausencias`: Número total de ausencias
- `porcentajeAsistencia`: Porcentaje de asistencia
- `materiasEnRiesgo`: Array de materias en riesgo

## 📈 Métricas Calculadas

### Promedio Actual
```typescript
const promedioActual = calificaciones.reduce((sum, cal) => sum + cal.valor, 0) / calificaciones.length;
```

### Promedio Anterior
- Filtrado por período académico
- Comparación con trimestre anterior
- Manejo de casos sin datos históricos

### Porcentaje de Asistencia
```typescript
const porcentajeAsistencia = (presentes / total) * 100;
```

### Materias en Riesgo
- Identificación de materias con promedio < 6.0
- Agrupación por materia
- Conteo de materias problemáticas

### Tendencia
- Comparación entre períodos
- Clasificación: mejora, descenso, estable, sin_datos
- Umbral de 0.5 puntos para cambios significativos

## 🎨 Interfaz de Usuario

### Panel de Alertas Automáticas

#### Características Visuales
- **Iconos diferenciados** por tipo de alerta
- **Colores por prioridad** (rojo=crítica, naranja=alta, etc.)
- **Badges informativos** con estadísticas
- **Datos de soporte** expandibles

#### Funcionalidades
- **Filtro por prioridad** (solo críticas, todas)
- **Marcado como leída** / no leída
- **Activación/desactivación** de alertas
- **Ordenamiento** por prioridad

### Integración por Rol

#### Administrador
- Alertas de todos los estudiantes
- Vista general del sistema
- Estadísticas agregadas

#### Docente
- Alertas de sus estudiantes
- Enfoque en su curso
- Acceso directo a información relevante

#### Alumno
- Sus propias alertas
- Información personalizada
- Motivación para mejoras

## 🚀 Uso del Sistema

### Generación Automática

```typescript
import { generarAlertasAutomaticas } from '@/utils/alertasAutomaticas';

const alertas = generarAlertasAutomaticas(datosAlumno, studentName);
```

### Filtrado de Alertas

```typescript
import { filtrarAlertasCriticas, filtrarAlertasPorTipo } from '@/utils/alertasAutomaticas';

const alertasCriticas = filtrarAlertasCriticas(alertas);
const alertasRendimiento = filtrarAlertasPorTipo(alertas, 'rendimiento_critico');
```

### Estadísticas

```typescript
import { obtenerEstadisticasAlertas } from '@/utils/alertasAutomaticas';

const stats = obtenerEstadisticasAlertas(alertas);
// { total, criticas, altas, noLeidas, activas, porTipo }
```

## 🧪 Pruebas

### Script de Pruebas

Ejecutar el script de pruebas:

```bash
node src/scripts/testAlertasAutomaticas.js
```

### Escenarios de Prueba

1. **Rendimiento Crítico**: Promedio < 5.0
2. **Asistencia Crítica**: < 70% asistencia
3. **Tendencia Negativa**: Disminución significativa
4. **Múltiples Materias en Riesgo**: 2+ materias < 6.0
5. **Mejora Significativa**: Aumento significativo

### Resultados Esperados

- Detección correcta de patrones
- Generación de alertas apropiadas
- Priorización correcta
- Datos de soporte precisos

## 🔄 Flujo de Datos

### 1. Recopilación de Datos
```
Firebase → Calificaciones + Asistencias → DatosAlumno
```

### 2. Análisis
```
DatosAlumno → Cálculo de Métricas → Aplicación de Reglas
```

### 3. Generación
```
Reglas Cumplidas → AlertasAutomatica[] → Ordenamiento por Prioridad
```

### 4. Visualización
```
AlertasAutomatica[] → AlertasAutomaticasPanel → UI
```

## 📋 Configuración Avanzada

### Personalización de Reglas

Para agregar nuevas reglas:

1. Definir la condición en `REGLAS_ALERTAS`
2. Implementar la lógica de detección
3. Configurar prioridad y tipo
4. Agregar icono correspondiente en el componente

### Ajuste de Umbrales

Modificar los valores en las condiciones:

```typescript
// Ejemplo: Cambiar umbral de rendimiento crítico
RENDIMIENTO_CRITICO: {
  condicion: (datos, promedioActual) => promedioActual < 4.5, // Cambiar de 5.0 a 4.5
  // ...
}
```

## 🔮 Futuras Mejoras

### Análisis Predictivo
- Predicción de calificaciones futuras
- Identificación temprana de riesgos
- Recomendaciones personalizadas

### Machine Learning
- Aprendizaje de patrones específicos
- Optimización automática de reglas
- Detección de anomalías

### Notificaciones
- Alertas en tiempo real
- Integración con email/SMS
- Recordatorios automáticos

### Dashboard Avanzado
- Gráficos de tendencias
- Comparativas entre períodos
- Análisis de cohortes

## 🛠️ Mantenimiento

### Monitoreo
- Revisar logs de generación
- Verificar precisión de alertas
- Analizar falsos positivos

### Optimización
- Ajustar umbrales según resultados
- Refinar reglas de negocio
- Mejorar rendimiento

### Actualización
- Mantener sincronización con datos
- Actualizar reglas según necesidades
- Expandir tipos de alertas

## 📞 Soporte

Para dudas o problemas con el sistema de alertas automáticas:

1. Revisar esta documentación
2. Ejecutar script de pruebas
3. Verificar logs de consola
4. Contactar al equipo de desarrollo

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025  
**Autor**: Sistema SchoolFlow 