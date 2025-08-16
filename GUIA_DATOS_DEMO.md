# 📊 Guía de Datos Mínima para Demos

## 🎯 Objetivo
Explicar qué colecciones de Firestore se tocan en cada flujo principal para facilitar soporte técnico durante demos.

---

## 🔐 Flujo: Alta de Alumno

### Colecciones Involucradas
- **`users`** → Crear usuario con rol `alumno`
- **`students`** → Crear perfil del estudiante
- **`courses`** → Asignar a curso existente
- **`subjects`** → Relacionar con materias del curso

### Datos Mínimos Requeridos
```json
// users/{uid}
{
  "role": "alumno",
  "studentId": "student_123",
  "name": "Juan Pérez",
  "email": "juan@example.com"
}

// students/{studentId}
{
  "nombre": "Juan",
  "apellido": "Pérez", 
  "cursoId": "curso_456",
  "email": "juan@example.com"
}
```

### Verificación en Demo
- [ ] Usuario aparece en `/app/usuarios`
- [ ] Estudiante visible en `/app/gestion-cursos-materias`
- [ ] Aparece en listado de `/app/calificaciones`

---

## 📝 Flujo: Carga de Nota

### Colecciones Involucradas
- **`calificaciones`** → Crear nueva nota
- **`students`** → Verificar alumno existe
- **`subjects`** → Validar materia
- **`courses`** → Contexto del curso

### Datos Mínimos Requeridos
```json
// calificaciones/{noteId}
{
  "studentId": "student_123",
  "subjectId": "math_101",
  "valor": 8.5,
  "fecha": "2024-01-15",
  "Actividad": "Examen Parcial",
  "Comentario": "Buen trabajo"
}
```

### Verificación en Demo
- [ ] Nota aparece en tabla de `/app/calificaciones`
- [ ] Promedio se recalcula automáticamente
- [ ] Visible en boletín del alumno

---

## ✅ Flujo: Registro de Asistencia

### Colecciones Involucradas
- **`attendances`** → Crear registro de asistencia
- **`students`** → Identificar alumno
- **`courses`** → Contexto del curso
- **`subjects`** → Materia específica

### Datos Mínimos Requeridos
```json
// attendances/{attendanceId}
{
  "studentId": "student_123",
  "courseId": "curso_456",
  "subject": "Matemáticas",
  "date": "2024-01-15",
  "present": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Verificación en Demo
- [ ] Asistencia visible en calendario de `/app/asistencias`
- [ ] Estadísticas se actualizan en dashboard
- [ ] Aparece en reportes de asistencia

---

## 📊 Flujo: Generación de Boletín

### Colecciones Involucradas
- **`boletines`** → Crear boletín del período
- **`calificaciones`** → Agregar notas del alumno
- **`students`** → Datos del estudiante
- **`courses`** → Información del curso
- **`subjects`** → Materias cursadas

### Datos Mínimos Requeridos
```json
// boletines/{boletinId}
{
  "alumnoId": "student_123",
  "periodo": "2024-1",
  "materias": [
    {
      "nombre": "Matemáticas",
      "promedio": 8.2,
      "notas": [8.5, 8.0, 8.1]
    }
  ],
  "promedioTotal": 8.2,
  "observacionAutomatica": "Rendimiento satisfactorio"
}
```

### Verificación en Demo
- [ ] Boletín se genera en `/app/boletines`
- [ ] PDF se descarga correctamente
- [ ] Observaciones automáticas aparecen

---

## 🚨 Flujo: Generación de Alertas

### Colecciones Involucradas
- **`alerts`** → Crear alerta automática
- **`calificaciones`** → Analizar rendimiento
- **`attendances`** → Evaluar asistencia
- **`students`** → Contexto del alumno

### Datos Mínimos Requeridos
```json
// alerts/{alertId}
{
  "studentId": "student_123",
  "tipo": "rendimiento_bajo",
  "severidad": "alta",
  "descripcion": "Promedio bajo en Matemáticas",
  "fecha": "2024-01-15",
  "estado": "activa"
}
```

### Verificación en Demo
- [ ] Alertas aparecen en `/app/alertas`
- [ ] Filtros por severidad funcionan
- [ ] Notificaciones toast visibles

---

## 🔄 Flujo: Dashboard y KPIs

### Colecciones Involucradas
- **`students`** → Total de alumnos
- **`courses`** → Total de cursos
- **`calificaciones`** → Promedios generales
- **`attendances`** → Estadísticas de asistencia
- **`users`** → Usuarios activos

### Datos Mínimos Requeridos
```json
// Dashboard agrega datos de múltiples colecciones
{
  "totalAlumnos": 150,
  "totalCursos": 12,
  "promedioGeneral": 7.8,
  "asistenciaPromedio": 92.5,
  "usuariosActivos": 45
}
```

### Verificación en Demo
- [ ] KPIs cargan en `/app/dashboard`
- [ ] Gráficos muestran datos reales
- [ ] Métricas se actualizan en tiempo real

---

## 🛠️ Troubleshooting de Datos

### Problema: "No se ven datos"
1. Verificar `pnpm run list-collections`
2. Ejecutar `pnpm run seed:demo`
3. Revisar reglas de Firestore

### Problema: "Permisos denegados"
1. Verificar rol del usuario en `users/{uid}`
2. Revisar `src/config/roles.ts`
3. Validar reglas en `firestore.rules`

### Problema: "Relaciones rotas"
1. Verificar `cursoId` en `students`
2. Validar `teacherId` en `subjects`
3. Ejecutar `pnpm run reconcile:teacher-courses`

---

## 📋 Checklist de Datos para Demo

### Antes de la Demo
- [ ] `users` tiene al menos 3 usuarios (admin, docente, alumno)
- [ ] `courses` tiene al menos 2 cursos
- [ ] `subjects` tiene al menos 3 materias
- [ ] `students` tiene al menos 5 alumnos
- [ ] `calificaciones` tiene al menos 10 notas
- [ ] `attendances` tiene al menos 20 registros

### Durante la Demo
- [ ] Crear 1 nota nueva (verificar persistencia)
- [ ] Marcar 1 asistencia (verificar calendario)
- [ ] Generar 1 boletín (verificar PDF)
- [ ] Crear 1 alerta (verificar notificación)

---

## 🔗 Comandos Útiles

```bash
# Ver todas las colecciones
pnpm run list-collections

# Limpiar y recargar datos
pnpm run clean-collections
pnpm run seed:demo

# Exportar datos para análisis
pnpm run export:core

# Reconciliar relaciones
pnpm run reconcile:teacher-courses
```

---

*Última actualización: [FECHA] | Para soporte técnico en demos* 