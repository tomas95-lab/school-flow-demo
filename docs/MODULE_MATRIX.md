## Mapa de módulos → rutas → componentes → colecciones

Resumen ejecutivo: estado actual por módulo con rutas registradas en `src/routes/AppRoutes.tsx`, componentes clave en `src/components` y páginas en `src/pages`, y colecciones usadas según `src/types/schema.ts` y servicios.

| Módulo | Estado | Rutas | Componentes principales | Colecciones Firestore | Demo Path |
|---|---|---|---|---|---|
| Autenticación & permisos | Completo | `/login`, guard: `/app/*` | `AuthContext`, `PrivateRoute`, `PermissionRoute`, `usePermission` | `users` | ⭐ **CRÍTICO** |
| Usuarios | Parcial | `/app/usuarios` | `UserModal`, `data-table`, `Usuarios.tsx` | `users` | ⭐ **SHOWCASE** |
| Cursos & Materias | Parcial | `/app/gestion-cursos-materias` | `GestionCursos&Materias.tsx`, `CourseCard.tsx` | `courses`, `subjects`, `teachers`, `students` | ⭐ **CORE** |
| Calificaciones | Parcial | `/app/calificaciones`, `/app/calificaciones/detalles` | `Calificaciones.tsx`, `DetallesCalificaciones.tsx`, `EditCalificaciones.tsx`, `InlineGradeForm.tsx` | `calificaciones`, `students`, `subjects` | ⭐ **STAR** |
| Asistencias | Parcial | `/app/asistencias`, `/app/asistencias/detalles` | `Asistencias.tsx`, `DetalleAsistencia.tsx`, `AttendanceCalendar.tsx`, `QuickAttendanceRegister.tsx` | `attendances`, `students`, `subjects`, `courses` | ⭐ **STAR** |
| Boletines | Parcial | `/app/boletines`, `/app/boletines/cursos` | `Boletin.tsx`, `BoletinesCurso.tsx`, `BoletinComponent.tsx`, `BoletinView.tsx`, `ExplicacionBoletinOverview.tsx` | `students`, `courses`, `calificaciones` | ⭐ **STAR** |
| Alertas | Parcial | `/app/alertas` | `Alertas.tsx`, `CreateAlertModal.tsx`, `ObservacionesAutomaticasPanel.tsx`, `ObservacionAutomatica.tsx` | `alerts`, `students`, `courses` | ⭐ **SHOWCASE** |
| Reportes | Parcial | `/app/reportes` | `ReportesInteligentesOverview.tsx`, `charts/*`, `StatCards.tsx` | Lecturas agregadas (múltiples colecciones) | ⭐ **VISUAL** |
| Mensajería | Parcial | `/app/mensajes`, `/app/mensajes/detalles` | `MessagingModule.tsx`, `messaging/*` vistas, `DetallesMuro.tsx` | `messages`, `conversations`, `announcements`, `notifications` (via Functions) | 🔄 **WIP** |
| Bot IA | Parcial (simulado) | `/app/bot` | `BotOverview.tsx`, `services/botService.ts` | Sin acceso real a datos; genera métricas simuladas | 🎭 **DEMO** |
| Panel 360 | Parcial | `/app/360` | `Panel360.tsx` | Agregaciones en UI (múltiples colecciones) | 🔄 **WIP** |
| Finanzas | Demo | `/app/finanzas`, `/app/pago/:id` | `Finanzas.tsx`, `PagoSimulado.tsx` | N/A (simulado) | 🎭 **DEMO** |
| Auditoría | Parcial | `/app/auditoria` | `Auditoria.tsx` | `auditLogs` | 🔄 **WIP** |
| Inscripciones | Parcial | `/app/inscripciones` | `InscripcionesOverview.tsx` | `students`, `courses` | 🔄 **WIP** |

### Leyenda de Demo Paths:
- ⭐ **CRÍTICO**: Debe funcionar sí o sí (login, permisos)
- ⭐ **STAR**: Funcionalidades principales que se muestran en demo
- ⭐ **CORE**: Estructura de datos que se explica
- ⭐ **SHOWCASE**: Características avanzadas que impresionan
- ⭐ **VISUAL**: Gráficos y métricas que se destacan
- 🔄 **WIP**: En desarrollo, mostrar con precaución
- 🎭 **DEMO**: Simulado, explicar que es demo

### Happy Paths de Demo (15 min):
1. **Login** → **Dashboard** (KPIs y métricas)
2. **Usuarios** → Listado y filtros básicos
3. **Cursos & Materias** → Estructura de datos
4. **Calificaciones** → Crear/editar nota + promedios
5. **Asistencias** → Calendario + registro rápido
6. **Boletines** → Generación + PDF + observaciones
7. **Alertas** → Creación manual + automáticas
8. **Reportes** → Gráficos y métricas visuales

### Rutas Exactas para Demo:
- `/login` → Login con `admin1@example.com`
- `/app/dashboard` → KPIs y navegación
- `/app/usuarios` → Gestión de usuarios
- `/app/gestion-cursos-materias` → Estructura académica
- `/app/calificaciones` → Sistema de notas
- `/app/asistencias` → Control de asistencia
- `/app/boletines` → Generación de boletines
- `/app/alertas` → Sistema de alertas
- `/app/reportes` → Analítica visual

### Roles de Prueba:
- **Admin**: Acceso completo a todos los módulos
- **Docente**: Acceso a calificaciones, asistencias, boletines
- **Alumno**: Vista limitada de sus propios datos


