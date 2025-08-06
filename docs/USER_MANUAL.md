# 📖 Manual de Usuario - SchoolFlow MVP

## 🏫 Bienvenido a SchoolFlow

SchoolFlow es un sistema de gestión escolar diseñado para facilitar la administración de estudiantes, calificaciones, asistencias y comunicación en instituciones educativas.

## 👥 Tipos de Usuario

### 🔧 **Administrador**
- Gestión completa del sistema
- Creación y administración de usuarios
- Configuración de cursos y materias
- Acceso a todos los módulos

### 👩‍🏫 **Profesor**
- Gestión de sus cursos asignados
- Registro de calificaciones y asistencias
- Comunicación con estudiantes
- Generación de reportes

### 🎓 **Estudiante**
- Visualización de calificaciones
- Consulta de asistencias
- Acceso a boletines
- Recepción de mensajes

## 🚀 Primeros Pasos

### 1. Acceso al Sistema
1. Ve a la URL de SchoolFlow
2. Ingresa tu **email** y **contraseña**
3. Haz clic en **"Iniciar Sesión"**

### 2. Primer Login
- Los administradores pueden crear usuarios
- Los usuarios recibirán credenciales por email
- Es recomendable cambiar la contraseña en el primer acceso

### 3. Navegación Principal
- **Dashboard**: Vista general del sistema
- **Sidebar**: Menú de navegación lateral
- **Perfil**: Configuración de usuario (esquina superior derecha)

## 📊 Dashboard Principal

### Vista Administrador
- **KPIs**: Estadísticas generales del sistema
  - Total de estudiantes
  - Total de profesores
  - Cursos activos
  - Asistencia promedio
- **Acceso Rápido**: Enlaces directos a módulos principales
- **Alertas**: Notificaciones importantes
- **Actividad Reciente**: Últimas acciones del sistema

### Vista Profesor
- **Mis Cursos**: Cursos asignados
- **Estudiantes**: Total de estudiantes bajo su cargo
- **Tareas Pendientes**: Calificaciones por registrar
- **Acceso Rápido**: Enlaces a sus módulos de trabajo

### Vista Estudiante
- **Mis Calificaciones**: Resumen de notas actuales
- **Asistencia**: Porcentaje de asistencia
- **Próximas Evaluaciones**: Calendario de exámenes
- **Mensajes**: Comunicaciones recibidas

## 👥 Gestión de Usuarios

### Crear Usuario (Solo Administradores)
1. Ve a **"Usuarios"** en el sidebar
2. Haz clic en **"Agregar Usuario"**
3. Completa el formulario:
   - **Información Personal**: Nombre, apellido, email
   - **Rol**: Administrador, Profesor, Estudiante
   - **Estado**: Activo/Inactivo
4. Haz clic en **"Crear Usuario"**

### Editar Usuario
1. En la lista de usuarios, haz clic en el **ícono de editar**
2. Modifica los campos necesarios
3. Haz clic en **"Guardar Cambios"**

### Eliminar Usuario
1. Haz clic en el **ícono de eliminar**
2. Confirma la acción en el modal
3. El usuario será marcado como eliminado

### Importar Estudiantes (CSV)
1. Ve a **"Usuarios"**
2. Haz clic en **"Importar Estudiantes"**
3. Descarga la **plantilla CSV**
4. Completa la plantilla con los datos
5. Sube el archivo y confirma la importación

## 📚 Gestión de Cursos y Materias

### Crear Curso
1. Ve a **"Cursos & Materias"**
2. Haz clic en **"Agregar Curso"**
3. Completa:
   - **Nombre del curso**
   - **Descripción**
   - **Profesor asignado**
   - **Estudiantes matriculados**
4. Guarda el curso

### Asignar Materias
1. Selecciona un curso existente
2. Haz clic en **"Agregar Materia"**
3. Define:
   - **Nombre de la materia**
   - **Código**
   - **Créditos**
   - **Profesor responsable**

### Matricular Estudiantes
1. En la vista del curso
2. Haz clic en **"Matricular Estudiantes"**
3. Selecciona estudiantes de la lista
4. Confirma la matriculación

## 📝 Gestión de Calificaciones

### Registrar Calificaciones (Profesores)
1. Ve a **"Calificaciones"**
2. Selecciona el **curso** y **materia**
3. Haz clic en **"Agregar Calificación"**
4. Completa:
   - **Estudiante**
   - **Tipo de evaluación** (Parcial, Final, Tarea, etc.)
   - **Calificación** (0-100)
   - **Fecha**
   - **Observaciones** (opcional)
5. Guarda la calificación

### Edición Rápida
1. En la tabla de calificaciones
2. Haz **doble clic** en la celda de calificación
3. Ingresa el nuevo valor
4. Presiona **Enter** para guardar

### Importar Calificaciones (CSV)
1. Ve a **"Calificaciones"**
2. Haz clic en **"Importar Calificaciones"**
3. Descarga la plantilla
4. Completa y sube el archivo

### Consultar Calificaciones (Estudiantes)
1. Ve a **"Mis Calificaciones"**
2. Filtra por:
   - **Materia**
   - **Período**
   - **Tipo de evaluación**
3. Visualiza gráficos de progreso

## 📅 Gestión de Asistencias

### Registrar Asistencia (Profesores)
1. Ve a **"Asistencias"**
2. Selecciona **curso** y **fecha**
3. Marca asistencia para cada estudiante:
   - ✅ **Presente**
   - ❌ **Ausente**
   - ⏰ **Tardanza**
   - 🏥 **Justificada**
4. Guarda la asistencia

### Registro Rápido
1. Usa el botón **"Registro Rápido"**
2. Selecciona "Marcar todos como presentes"
3. Ajusta casos específicos
4. Guarda los cambios

### Ver Historial de Asistencia
1. En la vista de asistencias
2. Usa el **calendario** para navegar por fechas
3. Ve estadísticas por estudiante
4. Genera reportes de asistencia

### Justificar Ausencias (Estudiantes)
1. Ve a **"Mi Asistencia"**
2. Haz clic en una ausencia sin justificar
3. Sube documentos de justificación
4. Envía la solicitud para revisión

## 📊 Boletines de Calificaciones

### Generar Boletín (Profesores/Administradores)
1. Ve a **"Boletines"**
2. Selecciona:
   - **Estudiante**
   - **Período académico**
   - **Formato** (PDF/Web)
3. Haz clic en **"Generar Boletín"**

### Consultar Boletín (Estudiantes)
1. Ve a **"Mis Boletines"**
2. Selecciona el período deseado
3. Visualiza o descarga el boletín
4. Comparte con padres/tutores

### Configurar Boletines (Administradores)
1. Ve a configuración de boletines
2. Define:
   - **Escala de calificaciones**
   - **Formato de reporte**
   - **Logo institucional**
   - **Información de contacto**

## 📨 Sistema de Mensajería

### Enviar Mensaje
1. Ve a **"Mensajes"**
2. Haz clic en **"Nuevo Mensaje"**
3. Completa:
   - **Destinatario(s)**
   - **Asunto**
   - **Mensaje**
   - **Archivos adjuntos** (opcional)
4. Envía el mensaje

### Crear Anuncio (Profesores/Administradores)
1. Ve a **"Anuncios"**
2. Haz clic en **"Nuevo Anuncio"**
3. Define:
   - **Título**
   - **Contenido**
   - **Audiencia** (Curso específico, todos, etc.)
   - **Fecha de publicación**
4. Publica el anuncio

### Muro de Mensajes
- **Vista principal**: Todos los mensajes y anuncios
- **Filtros**: Por fecha, remitente, tipo
- **Búsqueda**: Buscar contenido específico
- **Respuestas**: Responder directamente desde el muro

## 🚨 Sistema de Alertas

### Alertas Automáticas
El sistema genera alertas automáticamente para:
- **Asistencia baja** (< 80%)
- **Calificaciones deficientes** (< 60%)
- **Ausencias consecutivas** (3+ días)
- **Tareas sin entregar**

### Ver Alertas
1. Ve a **"Alertas"** en el dashboard
2. Filtra por:
   - **Tipo de alerta**
   - **Prioridad**
   - **Estado**
3. Haz clic en una alerta para ver detalles

### Gestionar Alertas (Profesores)
1. Revisa alertas de tus estudiantes
2. Toma acciones correctivas
3. Marca alertas como **"Resueltas"**
4. Agrega comentarios de seguimiento

## 📈 Reportes e Informes

### Reportes Disponibles
- **Reporte de Asistencia**: Por estudiante, curso, período
- **Reporte de Calificaciones**: Estadísticas y promedios
- **Reporte de Rendimiento**: Análisis comparativo
- **Reporte de Alertas**: Seguimiento de problemas

### Generar Reporte
1. Ve a **"Reportes"**
2. Selecciona el tipo de reporte
3. Define parámetros:
   - **Período**
   - **Cursos**
   - **Estudiantes**
4. Genera y descarga el reporte

### Programar Reportes
1. Configura reportes automáticos
2. Define frecuencia (diario, semanal, mensual)
3. Especifica destinatarios
4. Activa la programación

## ⚙️ Configuración Personal

### Cambiar Contraseña
1. Haz clic en tu **avatar** (esquina superior derecha)
2. Selecciona **"Configuración"**
3. Ve a **"Seguridad"**
4. Cambia tu contraseña

### Personalizar Perfil
1. Ve a **"Mi Perfil"**
2. Actualiza:
   - **Foto de perfil**
   - **Información personal**
   - **Preferencias de notificación**
3. Guarda los cambios

### Configurar Notificaciones
1. En configuración personal
2. Elige qué notificaciones recibir:
   - **Email**
   - **En la aplicación**
   - **Push notifications**

## 🛠️ Solución de Problemas Comunes

### No puedo iniciar sesión
1. Verifica tu email y contraseña
2. Usa **"¿Olvidaste tu contraseña?"**
3. Contacta al administrador si persiste

### No veo mis calificaciones
1. Verifica que estés en el período correcto
2. Asegúrate de estar matriculado en el curso
3. Contacta a tu profesor

### Error al subir archivos
1. Verifica el tamaño del archivo (máx. 10MB)
2. Usa formatos permitidos (PDF, DOC, JPG, PNG)
3. Verifica tu conexión a internet

### La página no carga
1. Actualiza la página (F5)
2. Limpia el cache del navegador
3. Verifica tu conexión a internet
4. Contacta soporte técnico

## 📞 Soporte Técnico

### Canales de Soporte
- **Email**: soporte@schoolflow.edu
- **WhatsApp**: +1 234 567 8900
- **Portal de ayuda**: help.schoolflow.edu
- **Chat en vivo**: Disponible 8AM-6PM

### Información para Soporte
Cuando contactes soporte, incluye:
- **Tu email de usuario**
- **Navegador que usas**
- **Descripción del problema**
- **Pasos para reproducir el error**
- **Capturas de pantalla** (si es necesario)

## 💡 Consejos y Buenas Prácticas

### Para Administradores
- Realiza backups regulares de datos
- Mantén actualizada la información de usuarios
- Revisa alertas diariamente
- Configura reglas de seguridad apropiadas

### Para Profesores
- Registra calificaciones regularmente
- Mantén comunicación constante con estudiantes
- Usa el sistema de alertas proactivamente
- Genera reportes periódicos para seguimiento

### Para Estudiantes
- Revisa tus calificaciones frecuentemente
- Mantén actualizada tu información de contacto
- Justifica ausencias oportunamente
- Mantén comunicación con tus profesores

## 🔄 Actualizaciones y Nuevas Funcionalidades

### Changelog
- **v1.0**: Lanzamiento inicial del MVP
- Funcionalidades principales implementadas
- Sistema de autenticación y roles
- Módulos básicos operativos

### Próximas Funcionalidades
- Sistema de evaluaciones en línea
- Integración con sistemas de pago
- App móvil nativa
- Módulo de biblioteca
- Sistema de transporte escolar

---

**¿Necesitas ayuda adicional?** Consulta nuestra documentación técnica o contacta al equipo de soporte.

**¡Gracias por usar SchoolFlow MVP! 🎓✨**