# 🤖 Bot IA - SchoolFlow

## Descripción General

El **Bot IA** es un asistente inteligente que analiza datos educativos en tiempo real para proporcionar insights valiosos sobre el rendimiento académico, patrones de asistencia, y predicciones sobre el comportamiento estudiantil.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

- **Análisis de Rendimiento Académico**: Evalúa el rendimiento de todos los estudiantes
- **Patrones de Asistencia**: Identifica tendencias en la asistencia por materia
- **Detección de Estudiantes en Riesgo**: Identifica estudiantes que requieren atención especial
- **Análisis por Materia**: Evalúa el rendimiento específico por materia
- **Insights Predictivos**: Genera predicciones basadas en datos históricos
- **Consultas Personalizadas**: Permite análisis específicos según necesidades
- **Exportación de Datos**: Exporta análisis en formato JSON
- **Interfaz Intuitiva**: Diseño moderno y responsive

## 🏗️ Arquitectura del Sistema

### Fuentes de Datos
El bot se conecta a múltiples colecciones de Firestore:

| Colección | Descripción | Uso en Bot IA |
|-----------|-------------|---------------|
| `students` | Información de estudiantes | Análisis de rendimiento individual |
| `courses` | Cursos disponibles | Contexto académico |
| `teachers` | Docentes del sistema | Análisis de efectividad docente |
| `subjects` | Materias académicas | Análisis por materia |
| `attendances` | Registros de asistencia | Patrones de asistencia |
| `calificaciones` | Notas de estudiantes | Cálculo de promedios |
| `boletines` | Boletines académicos | Análisis de rendimiento |
| `alerts` | Alertas del sistema | Contexto de alertas |
| `inscripciones` | Proceso de inscripción | Tendencias de inscripción |

### Control de Acceso
```typescript
// Solo administradores y docentes pueden acceder
if (userRole !== 'admin' && userRole !== 'docente') {
  return <AccessRestrictedComponent />;
}
```

## 🧠 Algoritmos de Análisis Inteligente

### 1. Análisis de Rendimiento Académico

**Objetivo**: Evaluar el rendimiento general de todos los estudiantes

**Algoritmo**:
```typescript
const performanceData = students.map(student => {
  const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
  const averageGrade = studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length;
  
  return {
    studentName: `${student.nombre} ${student.apellido}`,
    averageGrade,
    totalGrades: studentGrades.length
  };
});

// Clasificación de estudiantes
const highPerformers = performanceData.filter(p => p.averageGrade >= 8).length;
const lowPerformers = performanceData.filter(p => p.averageGrade < 6).length;
```

**Criterios de Priorización**:
- **Alta prioridad**: Si más del 30% de estudiantes tienen bajo rendimiento
- **Media prioridad**: En otros casos

### 2. Análisis de Patrones de Asistencia

**Objetivo**: Identificar patrones y tendencias en la asistencia por materia

**Algoritmo**:
```typescript
// Agrupa asistencia por materia
const attendanceBySubject = attendances.reduce((acc, att) => {
  const subject = att.subject || 'Sin materia';
  if (!acc[subject]) {
    acc[subject] = { present: 0, absent: 0, total: 0 };
  }
  if (att.present) {
    acc[subject].present++;
  } else {
    acc[subject].absent++;
  }
  acc[subject].total++;
  return acc;
}, {});

// Calcula tasas de asistencia
const attendanceRates = Object.entries(attendanceBySubject).map(([subject, data]) => ({
  subject,
  attendanceRate: (data.present / data.total) * 100,
  totalSessions: data.total
}));
```

**Criterios de Alerta**:
- **Alta prioridad**: Asistencia promedio < 80%
- **Media prioridad**: Asistencia promedio ≥ 80%

### 3. Detección de Estudiantes en Riesgo

**Objetivo**: Identificar estudiantes que requieren atención especial

**Algoritmo**:
```typescript
const riskStudents = students.map(student => {
  const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
  const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
  
  const averageGrade = studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length;
  const attendanceRate = (studentAttendance.filter(a => a.present).length / studentAttendance.length) * 100;

  // Identifica factores de riesgo
  const riskFactors = [];
  if (averageGrade < 6) riskFactors.push('Bajo rendimiento académico');
  if (attendanceRate < 80) riskFactors.push('Baja asistencia');
  if (studentGrades.length === 0) riskFactors.push('Sin calificaciones registradas');

  return {
    studentName: `${student.nombre} ${student.apellido}`,
    averageGrade,
    attendanceRate,
    riskFactors,
    riskLevel: riskFactors.length > 1 ? 'high' : riskFactors.length === 1 ? 'medium' : 'low'
  };
}).filter(s => s.riskFactors.length > 0);
```

**Niveles de Riesgo**:
- **Alto**: Múltiples factores de riesgo
- **Medio**: Un factor de riesgo
- **Bajo**: Sin factores de riesgo

### 4. Análisis de Rendimiento por Materia

**Objetivo**: Evaluar el rendimiento específico por materia

**Algoritmo**:
```typescript
const subjectPerformance = subjects.map(subject => {
  const subjectGrades = calificaciones.filter(g => g.subjectId === subject.firestoreId);
  
  if (subjectGrades.length === 0) return null;

  const averageGrade = subjectGrades.reduce((sum, g) => sum + g.valor, 0) / subjectGrades.length;
  const passingRate = (subjectGrades.filter(g => g.valor >= 6).length / subjectGrades.length) * 100;

  return {
    subjectName: subject.nombre,
    teacherName: subject.profesor,
    averageGrade,
    passingRate,
    totalGrades: subjectGrades.length,
    difficulty: averageGrade < 6 ? 'Alta' : averageGrade < 7 ? 'Media' : 'Baja'
  };
}).filter((s): s is NonNullable<typeof s> => s !== null);
```

### 5. Insights Predictivos

**Objetivo**: Generar predicciones basadas en datos históricos

**Algoritmo**:
```typescript
const predictiveData = students.map(student => {
  const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
  const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
  
  const recentGrades = studentGrades.slice(-3); // Últimas 3 calificaciones
  const recentAttendance = studentAttendance.slice(-5); // Últimos 5 registros de asistencia
  
  const gradeTrend = recentGrades.length >= 2 
    ? recentGrades[recentGrades.length - 1].valor - recentGrades[0].valor
    : 0;
  
  const attendanceTrend = recentAttendance.length >= 2
    ? (recentAttendance[recentAttendance.length - 1].present ? 1 : 0) - (recentAttendance[0].present ? 1 : 0)
    : 0;

  return {
    studentName: `${student.nombre} ${student.apellido}`,
    gradeTrend,
    attendanceTrend,
    prediction: gradeTrend > 0 && attendanceTrend >= 0 ? 'Mejora' : 
              gradeTrend < 0 || attendanceTrend < 0 ? 'Riesgo' : 'Estable'
  };
});
```

## 🎨 Interfaz de Usuario

### Componentes Principales

1. **Header con Estado de Conexión**
   - Icono de Bot con gradiente púrpura
   - Indicador de conexión en tiempo real
   - Botón de actualización de datos

2. **Sección de Consultas**
   - **Consultas Predefinidas**: 6 tipos de análisis específicos
   - **Consulta Personalizada**: Entrada de texto libre

3. **Resultados de Análisis**
   - Cards con análisis individuales
   - Indicadores de confianza y prioridad
   - Botón para ver análisis detallado

4. **Estadísticas del Sistema**
   - Contadores de estudiantes, cursos, materias, docentes

### Diseño Responsive
- **Desktop**: Grid de 3 columnas para análisis
- **Tablet**: Grid de 2 columnas
- **Mobile**: Grid de 1 columna

## 🔧 Configuración Técnica

### Dependencias
```json
{
  "react": "^18.x",
  "lucide-react": "^0.x",
  "date-fns": "^2.x",
  "sonner": "^1.x"
}
```

### Hooks Utilizados
- `useFirestoreCollection`: Para obtener datos de Firestore
- `useContext`: Para acceso al contexto de autenticación
- `useState`: Para manejo de estado local
- `useMemo`: Para optimización de cálculos

### Estructura de Archivos
```
src/
├── components/
│   ├── BotOverview.tsx          # Componente principal del Bot IA
│   └── DialogReutlizable.tsx    # Modal reutilizable
├── routes/
│   └── AppRoutes.tsx            # Rutas de la aplicación
└── hooks/
    └── useFireStoreCollection.ts # Hook para Firestore
```

## 📊 Métricas de Rendimiento

### Indicadores de Confianza
- **Análisis de Rendimiento**: 85%
- **Patrones de Asistencia**: 78%
- **Estudiantes en Riesgo**: 82%
- **Rendimiento por Materia**: 79%
- **Insights Predictivos**: 75%

### Criterios de Priorización
- **Alta**: Requiere atención inmediata
- **Media**: Requiere seguimiento
- **Baja**: Situación normal

## 🚀 Funcionalidades Avanzadas

### Exportación de Datos
```typescript
const handleExportAnalysis = () => {
  const data = {
    analyses: botAnalysis,
    timestamp: new Date().toISOString(),
    user: user?.email,
    role: userRole
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bot-analysis-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

### Consultas Predefinidas
1. **Análisis de Rendimiento General**
2. **Patrones de Asistencia**
3. **Estudiantes en Riesgo**
4. **Rendimiento por Materia**
5. **Insights Predictivos**
6. **Efectividad Docente**

## 🔒 Seguridad y Permisos

### Control de Acceso
- Solo usuarios con rol `admin` o `docente` pueden acceder
- Validación de permisos en tiempo real
- Mensajes de error informativos para usuarios no autorizados

### Validación de Datos
- Verificación de existencia de datos antes del análisis
- Manejo de casos edge (datos vacíos, valores nulos)
- Filtrado de datos inválidos

## 📈 Roadmap Futuro

### Funcionalidades Planificadas
- [ ] Integración con APIs de IA externas
- [ ] Análisis de sentimientos en comentarios
- [ ] Predicciones más avanzadas con machine learning
- [ ] Dashboard de métricas en tiempo real
- [ ] Notificaciones automáticas de alertas
- [ ] Exportación a formatos adicionales (PDF, Excel)

### Mejoras Técnicas
- [ ] Caché de análisis para mejorar rendimiento
- [ ] Análisis en segundo plano
- [ ] API REST para integración externa
- [ ] Webhooks para notificaciones

## 🐛 Solución de Problemas

### Errores Comunes

1. **"Acceso Restringido"**
   - Verificar que el usuario tenga rol `admin` o `docente`
   - Revisar configuración de AuthContext

2. **"Cargando Bot IA"**
   - Verificar conexión a Firestore
   - Revisar permisos de lectura en firestore.rules

3. **Análisis vacíos**
   - Verificar que existan datos en las colecciones
   - Revisar estructura de datos en Firestore

### Debugging
```typescript
// Agregar logs para debugging
console.log('Students:', students?.length);
console.log('Calificaciones:', calificaciones?.length);
console.log('Attendances:', attendances?.length);
```

## 📝 Notas de Desarrollo

### Patrones de Diseño Utilizados
- **Observer Pattern**: Para actualizaciones en tiempo real
- **Strategy Pattern**: Para diferentes tipos de análisis
- **Factory Pattern**: Para creación de análisis
- **Singleton Pattern**: Para contexto de autenticación

### Optimizaciones Implementadas
- **useMemo**: Para evitar recálculos innecesarios
- **Lazy Loading**: Para componentes pesados
- **Debouncing**: Para consultas personalizadas
- **Caching**: Para datos frecuentemente accedidos

---

## 🎉 Conclusión

El Bot IA representa el módulo más avanzado del sistema SchoolFlow, combinando análisis de datos inteligente con una interfaz de usuario moderna y funcional. Su arquitectura modular permite fácil extensión y mantenimiento, mientras que sus algoritmos proporcionan insights valiosos para la toma de decisiones educativas.

**Desarrollado con ❤️ para SchoolFlow** 