# ⚙️ Guía de Configuración Inicial - SchoolFlow MVP

## 🎯 Objetivo

Esta guía te ayudará a configurar SchoolFlow MVP desde cero, creando los datos iniciales necesarios para que el sistema esté operativo.

## 📋 Lista de Verificación Previa

Antes de comenzar, asegúrate de que:
- [ ] La aplicación esté instalada y funcionando
- [ ] Firebase esté configurado correctamente
- [ ] Puedas acceder al sistema con credenciales de administrador
- [ ] Las reglas de Firestore estén desplegadas

## 🚀 Proceso de Configuración

### Paso 1: Configuración de Administrador Principal

#### 1.1 Crear Cuenta de Administrador
1. Ve a la URL de SchoolFlow
2. Si es el primer acceso, registra la primera cuenta como administrador
3. O crea manualmente en Firebase Console:
   ```javascript
   // En Firestore, colección 'users'
   {
     email: "admin@tuescuela.edu",
     role: "admin",
     firstName: "Administrador",
     lastName: "Principal",
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   }
   ```

#### 1.2 Configurar Perfil de Administrador
1. Inicia sesión con la cuenta de administrador
2. Ve a **Perfil** → **Configuración**
3. Completa información personal
4. Configura foto de perfil institucional
5. Establece preferencias de notificación

### Paso 2: Configuración Institucional

#### 2.1 Información de la Institución
Crea un documento en Firebase para la configuración general:

```javascript
// Colección: 'settings' → Documento: 'institution'
{
  name: "Escuela ABC",
  logo: "url_del_logo",
  address: "Dirección completa",
  phone: "+1 234 567 8900",
  email: "info@escuelaabc.edu",
  website: "www.escuelaabc.edu",
  academicYear: "2025",
  currentSemester: "I",
  gradeScale: {
    min: 0,
    max: 100,
    passing: 60
  },
  attendanceThreshold: 80
}
```

#### 2.2 Configurar Períodos Académicos
```javascript
// Colección: 'academic_periods'
{
  name: "2025 - Semestre I",
  startDate: "2025-01-15",
  endDate: "2025-06-30",
  isActive: true,
  type: "semester"
}
```

### Paso 3: Crear Estructura de Cursos

#### 3.1 Definir Grados/Niveles
```javascript
// Colección: 'grades'
{
  name: "1ro Primaria",
  level: "primary",
  code: "1P",
  order: 1,
  isActive: true
},
{
  name: "2do Primaria",
  level: "primary", 
  code: "2P",
  order: 2,
  isActive: true
}
// ... continuar con todos los grados
```

#### 3.2 Crear Materias Base
```javascript
// Colección: 'subjects'
{
  name: "Matemáticas",
  code: "MAT",
  description: "Matemáticas básicas",
  isCore: true,
  isActive: true
},
{
  name: "Español",
  code: "ESP",
  description: "Lengua y Literatura",
  isCore: true,
  isActive: true
},
{
  name: "Ciencias Naturales",
  code: "CN",
  description: "Ciencias básicas",
  isCore: true,
  isActive: true
}
// ... agregar todas las materias necesarias
```

### Paso 4: Crear Usuarios del Sistema

#### 4.1 Crear Profesores
1. Ve a **Usuarios** → **Agregar Usuario**
2. Completa información para cada profesor:
   ```javascript
   {
     email: "profesor1@escuela.edu",
     role: "teacher",
     firstName: "María",
     lastName: "González",
     phone: "+1 234 567 8901",
     subjects: ["MAT", "CN"], // Materias que enseña
     isActive: true
   }
   ```

#### 4.2 Importar Estudiantes Masivamente
1. Descarga la plantilla CSV desde **Usuarios** → **Importar Estudiantes**
2. Completa la plantilla:
   ```csv
   firstName,lastName,email,grade,phone,parentEmail,parentPhone
   Juan,Pérez,juan.perez@estudiante.edu,1P,+1234567890,padre.perez@email.com,+1234567891
   María,Silva,maria.silva@estudiante.edu,1P,+1234567892,madre.silva@email.com,+1234567893
   ```
3. Sube el archivo y confirma la importación

### Paso 5: Configurar Cursos y Asignaciones

#### 5.1 Crear Cursos
1. Ve a **Cursos & Materias** → **Agregar Curso**
2. Para cada grado, crea un curso:
   ```javascript
   {
     name: "1ro Primaria - Sección A",
     grade: "1P",
     section: "A",
     academicPeriod: "2025-I",
     maxStudents: 30,
     isActive: true
   }
   ```

#### 5.2 Asignar Materias a Cursos
1. Selecciona un curso creado
2. Haz clic en **"Agregar Materia"**
3. Asigna todas las materias del grado:
   ```javascript
   {
     courseId: "curso_id",
     subjectId: "MAT",
     teacherId: "profesor_id",
     weeklyHours: 5,
     isActive: true
   }
   ```

#### 5.3 Matricular Estudiantes
1. En cada curso, haz clic en **"Matricular Estudiantes"**
2. Selecciona estudiantes del grado correspondiente
3. Confirma las matriculaciones

### Paso 6: Configuración de Evaluaciones

#### 6.1 Tipos de Evaluación
```javascript
// Colección: 'evaluation_types'
{
  name: "Parcial",
  code: "PAR",
  weight: 30, // Porcentaje en la nota final
  isActive: true
},
{
  name: "Final",
  code: "FIN", 
  weight: 40,
  isActive: true
},
{
  name: "Tareas",
  code: "TAR",
  weight: 20,
  isActive: true
},
{
  name: "Participación",
  code: "PART",
  weight: 10,
  isActive: true
}
```

#### 6.2 Configurar Calendario de Evaluaciones
1. Define fechas importantes del período académico
2. Programa evaluaciones por materia y curso
3. Notifica a profesores sobre fechas límite

### Paso 7: Configuración de Horarios

#### 7.1 Definir Horarios de Clase
```javascript
// Colección: 'schedules'
{
  courseId: "curso_id",
  subjectId: "MAT",
  teacherId: "profesor_id",
  dayOfWeek: 1, // Lunes = 1
  startTime: "08:00",
  endTime: "09:00",
  classroom: "Aula 101"
}
```

#### 7.2 Configurar Horarios Institucionales
```javascript
// Documento: 'settings/schedule'
{
  schoolStartTime: "07:30",
  schoolEndTime: "15:30",
  classLength: 60, // minutos
  breakTime: 15,
  lunchTime: 45,
  periods: [
    { name: "1ra Hora", start: "08:00", end: "09:00" },
    { name: "2da Hora", start: "09:00", end: "10:00" },
    { name: "Recreo", start: "10:00", end: "10:15" },
    // ... continuar
  ]
}
```

### Paso 8: Configurar Sistema de Notificaciones

#### 8.1 Plantillas de Email
```javascript
// Colección: 'email_templates'
{
  type: "welcome_student",
  subject: "Bienvenido a SchoolFlow",
  body: "Hola {{firstName}}, bienvenido al sistema...",
  isActive: true
},
{
  type: "grade_notification", 
  subject: "Nueva calificación registrada",
  body: "Se ha registrado una nueva calificación en {{subject}}...",
  isActive: true
}
```

#### 8.2 Configurar Alertas Automáticas
```javascript
// Documento: 'settings/alerts'
{
  lowAttendance: {
    enabled: true,
    threshold: 80, // Porcentaje
    checkFrequency: "daily"
  },
  lowGrades: {
    enabled: true,
    threshold: 60,
    checkFrequency: "weekly"
  },
  consecutiveAbsences: {
    enabled: true,
    threshold: 3, // días consecutivos
    checkFrequency: "daily"
  }
}
```

### Paso 9: Datos de Prueba (Opcional)

#### 9.1 Crear Calificaciones de Muestra
Para probar el sistema, crea algunas calificaciones:
```javascript
// Colección: 'grades'
{
  studentId: "estudiante_id",
  subjectId: "MAT",
  courseId: "curso_id",
  teacherId: "profesor_id",
  evaluationType: "PAR",
  grade: 85,
  maxGrade: 100,
  date: "2025-02-15",
  comments: "Excelente trabajo"
}
```

#### 9.2 Registrar Asistencias de Muestra
```javascript
// Colección: 'attendance'
{
  studentId: "estudiante_id",
  courseId: "curso_id",
  date: "2025-02-15",
  status: "present", // present, absent, late, justified
  notes: ""
}
```

### Paso 10: Verificación Final

#### 10.1 Lista de Verificación
- [ ] Administrador puede acceder y navegar por todos los módulos
- [ ] Profesores pueden ver sus cursos asignados
- [ ] Estudiantes pueden ver sus calificaciones y asistencias
- [ ] Se pueden crear nuevas calificaciones
- [ ] Se pueden registrar asistencias
- [ ] Las alertas funcionan correctamente
- [ ] Los reportes se generan sin errores
- [ ] Los boletines se pueden generar

#### 10.2 Pruebas de Funcionalidad
1. **Como Administrador**:
   - Crear un nuevo usuario
   - Asignar un profesor a una materia
   - Generar un reporte general

2. **Como Profesor**:
   - Registrar una calificación
   - Tomar asistencia
   - Enviar un mensaje a estudiantes

3. **Como Estudiante**:
   - Ver calificaciones
   - Consultar asistencia
   - Descargar boletín

## 🎓 Configuración de Producción

### Variables de Entorno de Producción
```env
# .env.production
VITE_FIREBASE_API_KEY=tu_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto_prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_prod
VITE_NODE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ERROR_REPORTING=true
```

### Reglas de Firestore para Producción
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas más estrictas para producción
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role in ["admin", "teacher"]);
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role == "admin");
    }
    
    // ... más reglas específicas
  }
}
```

## 📊 Monitoreo Post-Configuración

### Métricas a Monitorear
- **Usuarios activos diarios**
- **Errores de autenticación**
- **Tiempo de respuesta de consultas**
- **Uso de almacenamiento en Firestore**
- **Alertas generadas**

### Herramientas de Monitoreo
- Firebase Analytics
- Firebase Performance Monitoring
- Firebase Crashlytics
- Vercel Analytics (si usas Vercel)

## 🆘 Soporte Post-Configuración

### Documentación de Referencia
- [Manual de Usuario](./USER_MANUAL.md)
- [Guía de Instalación](./INSTALLATION.md)
- [Guía de Despliegue](./DEPLOYMENT.md)

### Contacto para Soporte
- **Email técnico**: tech@schoolflow.edu
- **Documentación**: docs.schoolflow.edu
- **Issues en GitHub**: github.com/schoolflow/issues

---

## ✅ Checklist Completo de Configuración

### Configuración Básica
- [ ] Administrador principal creado
- [ ] Información institucional configurada
- [ ] Períodos académicos definidos
- [ ] Estructura de grados creada
- [ ] Materias base configuradas

### Usuarios y Roles
- [ ] Profesores creados y asignados
- [ ] Estudiantes importados masivamente
- [ ] Roles y permisos verificados
- [ ] Perfiles completados

### Cursos y Académico
- [ ] Cursos creados por grado
- [ ] Materias asignadas a cursos
- [ ] Estudiantes matriculados
- [ ] Profesores asignados a materias
- [ ] Horarios configurados

### Sistema y Notificaciones
- [ ] Tipos de evaluación definidos
- [ ] Plantillas de email configuradas
- [ ] Alertas automáticas activadas
- [ ] Sistema de notificaciones funcionando

### Datos de Prueba
- [ ] Calificaciones de muestra creadas
- [ ] Asistencias de prueba registradas
- [ ] Mensajes de prueba enviados
- [ ] Reportes generados exitosamente

### Verificación Final
- [ ] Todos los roles pueden acceder correctamente
- [ ] Funcionalidades principales operativas
- [ ] Datos de prueba visibles
- [ ] Sistema listo para uso en producción

**¡Configuración Completa! SchoolFlow MVP está listo para usar! 🎉**

---

**Próximo paso**: [Desplegar a producción](./DEPLOYMENT.md) o comenzar a usar el sistema con el [Manual de Usuario](./USER_MANUAL.md).