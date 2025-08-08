## SchoolFlow MVP — Documento Técnico Interno

### 1. Visión general del proyecto

- **Objetivo**: Proveer un MVP funcional de gestión escolar con enfoque en registros académicos (asistencias, calificaciones, boletines), comunicación interna, reportes y alertas inteligentes, soportado en Firebase.
- **Alcance**: Módulos operativos para Admin, Docente y Alumno, con seguridad por roles y flujo básico de datos en Firestore. Incluye analítica visual y un bot IA contextual de apoyo.
- **Stack tecnológico**:
  - **Frontend**: React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Radix UI, lucide-react
  - **Estado/Contexto**: React Context (`AuthContext`), hooks personalizados
  - **Backend BaaS**: Firebase (Auth, Firestore, optional Analytics)
  - **Tests**: Vitest + @testing-library/react (setup en `src/test/setup.ts`)
  - **Build/Deploy**: Vite, Firebase CLI, Vercel (opcional)


### 2. Estructura del repositorio

- Carpetas principales (resumen):
  - `src/` código del frontend
    - `pages/` páginas de alto nivel (rutas)
    - `components/` componentes UI y vistas por rol
      - `messaging/` módulo de mensajería (muro, conversaciones, anuncios)
      - `charts/` gráficos reutilizables
      - `ui/` librería de UI basada en shadcn/radix
    - `context/` `AuthContext` y providers de error global
    - `hooks/` hooks de Firestore y helpers de permisos/teacher
    - `config/` configuración de permisos por rol
    - `utils/` utilidades (boletines, alertas automáticas, firebase utils, validation, etc.)
    - `routes/` enrutador principal, rutas privadas y por permisos
    - `types/` contratos TS para datos funcionales (mensajes, etc.)
    - `app/` definiciones de columnas para tablas por módulo
    - `services/` servicios (ej. `botService`)
    - `assets/` imágenes y media
    - `test/` pruebas unitarias y de integración
  - `functions/` plantilla para Cloud Functions (no implementadas en detalle aún)
  - `docs/` guías de instalación, despliegue, alertas y mensajería
  - `scripts/` scripts Node para utilidades con Firestore (listar/limpiar colecciones)

- Convenciones de nomenclatura y organización:
  - Componentes en PascalCase (`AdminCalificacionesOverview.tsx`).
  - Páginas en `src/pages` con PascalCase (`Asistencias.tsx`, `Calificaciones.tsx`).
  - Hooks en `src/hooks` con prefijo `use` (`useFirestoreCollection`, `usePermission`).
  - Utilidades en `src/utils` con nombres descriptivos.
  - Alias de importaciones `@` → `src` configurado en `vite.config.ts`.
  - Estilos con Tailwind y UI con componentes `ui/` de shadcn.


### 3. Módulos implementados (estado “✅ Completado”)

- Autenticación y autorización
  - Firebase Auth inicializado en `src/firebaseConfig.ts`.
  - `AuthContext` (`src/context/AuthContext.tsx`): escucha `onAuthStateChanged`, recupera documento `users/{uid}`, compone `AppUser` con `role`, `studentId`, `teacherId` y setea `lastLogin`.
  - Rutas protegidas: `PrivateRoute` para sesión y `PermissionRoute` para permisos granulares basados en `rolePermissions` (`src/config/roles.ts`).

- Gestión de usuarios
  - Página: `src/pages/Usuarios.tsx` (CRUD, modal de eliminación `DeleteUserModal.tsx`, importación de estudiantes `ImportStudentsModal.tsx`).
  - Permisos vía `usePermission` y `rolePermissions` (admin puede gestionar usuarios).

- Dashboard principal
  - Página: `src/pages/Dashboard.tsx`.
  - KPIs y métricas por rol; cálculo de promedios, distribución de notas y asistencias con datos de Firestore.
  - Quick Access por rol y gráficos con `components/charts/`.

- Asistencias
  - Páginas: `src/pages/Asistencias.tsx`, `src/pages/DetalleAsistencia.tsx`.
  - Componentes clave: `AttendanceCalendar`, `QuickAttendanceRegister`, vistas por rol (`AdminAttendanceOverview`, `TeacherAttendanceOverview`, `AlumnoAttendanceOverview`).
  - Colección: `attendances` (registros por alumno/curso/materia/fecha, con `present`).
  - Hooks: `useFirestoreCollection` con `constraints` por rol, `useTeacherStudents`.

- Calificaciones
  - Página: `src/pages/Calificaciones.tsx` y detalle `src/pages/DetallesCalificaciones.tsx`.
  - Componentes: `CrearCalificacion` (`CalificacioneslForm.tsx`), `EditCalificaciones`, `EditGradeCell`, `TeacherCalificacionesOverView`, `AdminCalificacionesOverview`, `AlumnoCalificacionesOverview`.
  - Lógica: promedio por curso/materia y exportación CSV en detalles; edición en línea; uso de `calificaciones` en Firestore.

- Boletines
  - Vistas: `Boletin.tsx`, `BoletinesCurso.tsx`, `BoletinComponent.tsx`, `BoletinView.tsx`, `ExplicacionBoletinOverview.tsx`, `AlumnoBoletinesOverview.tsx`.
  - Utilidades: `src/utils/boletines.ts` (promedios por materia y trimestre, `generarPDFBoletin`, `generarObservacionAutomaticaBoletin`).
  - Colección: `boletines` (documentos por alumno/período con materias y observaciones).

- Alertas
  - Página: `src/pages/Alertas.tsx` con vistas por rol (`AdminAlertasOverview`, `TeacherAlertasOverview`, `AlumnoAlertasOverview`).
  - Reglas automáticas: `src/utils/alertasAutomaticas.ts` (rendimiento crítico/bajo, asistencia crítica/baja, tendencia negativa, mejora, materias en riesgo).
  - Creación manual: `CreateAlertModal.tsx`.
  - Docs: `docs/AlertasAutomaticas.md` (flujo de datos, tipos de alertas, personalización de reglas).

- Cursos y materias
  - Gestión: `src/pages/GestionCursos&Materias.tsx`, columnas en `src/app/cursos_materias/colums.tsx`.
  - Colecciones: `courses`, `subjects`, `teachers`.
  - Asignaciones: relación `subjectId`, `teacherId`, `cursoIds` en tipos; helpers `useTeacherCourses`/`useTeacherStudents`.

- Bot IA flotante
  - Componente: `src/components/FloatingBot.tsx`.
  - Arquitectura: lee datos de Firestore (students, courses, subjects, attendances, calificaciones, boletines, alerts), determina contexto y genera respuestas internas; servicio auxiliar `src/services/botService.ts` con clasificadores de consultas.

- Reportes inteligentes
  - Componente integral: `src/components/ReportesInteligentesOverview.tsx`.
  - Librería de gráficos: `components/charts` (Bar, Line, Pie), datos agregados vía hooks a múltiples colecciones.

- Inscripciones
  - Componente: `src/components/InscripcionesOverview.tsx`.
  - Flujo: listado, filtros, detalles/edición, estado de inscripción, combinación de datos de `students` y `courses`.


### 4. Módulos en progreso (estado “🔄 En desarrollo”)

- Sistema de mensajería (`/app/mensajes`)
  - Arquitectura documentada en `docs/MessagingSystem.md`.
  - Componentes ya implementados:
    - Contenedor de módulo: `components/MessagingModule.tsx` (tabs: overview, conversations, announcements, wall; control de acceso por rol).
    - Muro de curso: `components/messaging/WallView.tsx` (publicación, filtros, respuestas, marcadores; listeners tiempo real).
    - Placeholders: `components/messaging/ConversationsPlaceholder.tsx`, `AnnouncementsPlaceholder.tsx`.
    - Vistas base: `components/messaging/ConversationsView.tsx`, `AnnouncementsView.tsx` (estructura presente; completar funcionalidad).
    - Overview: `components/messaging/OverviewDashboard.tsx`.
  - Hooks y tipos:
    - `types/index.ts` define `Message`, `MessageReply`, estados y metadatos.
    - Acceso a datos con `useFirestoreCollection` y subcolecciones planificadas.
  - Pendiente:
    - Conversaciones directas: modelos `conversations` y subcolección `conversations/{id}/messages`, indicadores de escritura y leído.
    - Anuncios: CRUD completo, comentarios (`announcements/{id}/comments`), permisos por rol.
    - Notificaciones en tiempo real y Cloud Functions (gatilladores `onNewMessage`, `onNewAnnouncement`).


### 5. Funcionalidades planificadas

- Integraciones IA externas y ML: análisis predictivo, recomendaciones personalizadas, detección de anomalías.
- Notificaciones push (Web Push/FCM) y centro de notificaciones unificado (`notifications`).
- App móvil (React Native/Expo) con base en API de Firestore/Cloud Functions.
- Exportaciones avanzadas (PDF/Excel) en más módulos.
- Moderación/flujo de aprobación de contenidos en mensajería/anuncios.


### 6. Arquitectura de datos

- Hooks de acceso a datos
  - `useFirestoreCollection(path, { constraints, orderBy, limit, enableCache })`: listener en tiempo real, con cache global de 5 min y manejo de errores/permiso.
  - `useFirestoreCollectionOnce(path, { orderBy, limit })`: fetch puntual sin suscripción (para vistas no reactivas).
  - Hooks de dominio: `useTeacherCourses`, `useTeacherStudents`.

- Esquema Firestore (colecciones principales observadas en código y scripts):

| Colección | Descripción | Campos clave (observados) |
| --- | --- | --- |
| `users` | Perfil de usuario app | `role`, `teacherId`, `studentId`, `name`, `lastLogin` |
| `students` | Estudiantes | `nombre`, `apellido`, `cursoId`, `email` |
| `teachers` | Docentes | `nombre`, `apellido`, `subjects` |
| `courses` | Cursos | `nombre`, `division`, `alumnos[]`, `teacherId`, `status` |
| `subjects` | Materias | `nombre`/`name`, `code`, `cursoIds[]`, `teacherId[]`, `isCore`, `isActive` |
| `attendances` | Asistencias | `studentId`, `courseId`, `subject`, `date`, `present`, `createdAt`, `updatedAt` |
| `calificaciones` | Notas | `studentId`, `subjectId`, `Actividad`, `valor`, `ausente`, `Comentario`, `fecha`, `creadoEn` |
| `boletines` | Boletines | `alumnoId`, `periodo`, `materias[]`, `promedioTotal`, `observacionAutomatica` |
| `alerts` | Alertas | Datos agregados de reglas, severidad, estado |
| `inscripciones` | Inscripciones | `studentId`, `courseId`, `status`, `fechaInscripcion`, `comentarios` |
| `messages` | Muro de mensajes | `courseId`, `authorId`, `content`, `type`, `priority`, `status`, `createdAt` |
| `notifications` | Notificaciones | Tipos: mensaje, anuncio, conversación, sistema |
| `conversations` | Conversaciones directas | `participants[]` y subcolección `messages` (planificado) |
| `announcements` | Anuncios | `title`, `content`, `courseId?`, `priority`, subcolección `comments` (planificado) |
| `evaluation_types`, `evaluations`, `schedules`, `academic_periods`, `grades` | Soporte académico | Campos según `docs/INITIAL_SETUP.md` |


### 7. Infraestructura y despliegue

- Configuración Firebase
  - `src/firebaseConfig.ts` lee de `import.meta.env.VITE_*`.
  - Variables en `.env.local` (plantillas: `env.example`, `docs/INSTALLATION.md`, `DEPLOYMENT.md`, `SECURITY_INSTRUCTIONS.md`).
  - Reglas Firestore: guía en `docs/INSTALLATION.md` y `docs/MessagingSystem.md` con ejemplos a adaptar.

- Scripts npm (ver `package.json`):
  - Desarrollo: `dev`, `build`, `build:prod`, `preview`.
  - Linting: `lint`, `lint:fix`.
  - Tests: `test`, `test:ui`, `test:run`, `test:coverage`.
  - Firebase: `firebase:*`, `deploy`, `deploy:*`.
  - Vercel: `vercel:*`.
  - Utilidades: `list-collections`, `clean-collections`.

- Despliegue
  - Guía detallada en `DEPLOYMENT.md` (deploy completo y por partes: hosting, reglas, firestore).
  - Hosting: Firebase Hosting o Vercel (build con Vite). Análisis y división de chunks configurados en `vite.config.ts`.


### 8. Deuda técnica actual

- Tipado y consistencia de datos
  - Alinear tipos TS en `src/types/` con la realidad de documentos en Firestore (ej. campos opcionales, fechas `Timestamp` vs `string`).
  - Evitar `any` en utilidades complejas y componentes con cálculos (alertas/boletines) y reforzar tipos derivados.

- Hooks y efectos
  - Revisar dependencias de `useEffect`/`useMemo` en páginas de gran tamaño (`Dashboard`, `Asistencias`, `DetallesCalificaciones`) para evitar recalculados y posibles warnings de reglas de hooks.
  - Centralizar selectores/cálculos pesados en helpers reutilizables.

- Componentes grandes
  - Dividir vistas extensas en subcomponentes (ej. `ReportesInteligentesOverview`, `FloatingBot`) para mejorar legibilidad y testabilidad.

- UI/UX
  - Homogeneizar iconografía y estilos entre módulos; validar accesibilidad (focus states) y estados de carga/vacío.

- Tests y QA
  - Existe base de tests en `src/test/` (hooks y páginas clave). Ampliar cobertura en: reglas de negocio (alertas automáticas, boletines), permisos por rol, y mensajería.
  - Añadir escenarios con datos realistas y mocks de `Firestore`.

- Build/Performance
  - Validar tree-shaking de librerías y lazy-loading donde aplique (páginas pesadas, charts, bot).
  - Revisar tamaño de bundles y `manualChunks` en `vite.config.ts`.


### 9. Roadmap interno y prioridades

- Bugs críticos
  - Validar reglas de Firestore antes de producción (lectura/escritura por rol y scoping por curso/alumno).
  - Normalizar campos de fecha (`Timestamp` vs `string`) y parsing consistente en UI/exportaciones.
  - Reforzar control de acceso en vistas sensibles (`Usuarios`, `GestionCursos&Materias`).

- Mejoras UX/UI y performance
  - Carga progresiva en `Dashboard` y `Reportes` con skeletons y segmentación de queries.
  - Estados de error uniformes con `GlobalErrorProvider` y `ErrorBoundary`.
  - Optimizar `useFirestoreCollection` para cache por clave con constraints en la firma de cache.

- Mensajería
  - Completar conversaciones directas y anuncios (CRUD, comentarios, typing, read-receipts) y notificaciones.

- IA y analítica
  - Integrar servicios externos para explicaciones/observaciones y predicción de riesgo académico.

- Migración a SQL (fases)
  - Fase 1: replicación de colecciones clave a tablas SQL (users, students, courses, subjects, attendances, grades, bulletins) vía ETL/Cloud Functions.
  - Fase 2: capa de acceso de datos abstracta (repositorios) para poder alternar Firestore/SQL por módulo.
  - Fase 3: mover agregaciones pesadas (reportes/alertas) a vistas/materialized views y jobs programados.


### 10. Guía de colaboración

- Commits
  - Adoptar Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `build:`.
  - Mensajes concisos y orientados a la intención; agrupar cambios por dominio (módulo/feature).

- Flujo de branches y PRs
  - `main` protegido; desarrollo en `feature/*`, `fix/*`, `chore/*`.
  - PRs con descripción técnica, screenshots cuando aplique, y checklist de QA (lint, tests, build).
  - Revisión por al menos 1 persona; squash merge recomendado.

- Cómo añadir nuevos módulos o reglas de negocio
  - Estructurar página en `src/pages/`, componentes en `src/components/` y utilidades en `src/utils/`.
  - Si hay modales, utilizar `DialogReutlizable.tsx` para consistencia.
  - Exponer columnas/tablas en `src/app/<modulo>/columns.tsx` si aplica.
  - Definir tipos en `src/types/` y, si procede, scripts de soporte en `scripts/`.
  - Respetar permisos en `src/config/roles.ts` y proteger rutas con `PermissionRoute`.
  - Añadir pruebas mínimas en `src/test/` y actualizar docs en `docs/`.


### Apéndice A. Rutas principales

- Router: `src/routes/AppRoutes.tsx`. Base `/app` protegida por `PrivateRoute`.
  - `/login`
  - `/app/dashboard`
  - `/app/asistencias`, `/app/asistencias/detalles`
  - `/app/calificaciones`, `/app/calificaciones/detalles`
  - `/app/boletines`, `/app/boletines/cursos`, `/app/explicacion-boletin`
  - `/app/alertas`
  - `/app/usuarios` (tras `PermissionRoute: canManageUsers`)
  - `/app/gestion-cursos-materias` (tras `PermissionRoute: canManageCourses`)
  - `/app/mensajes`, `/app/mensajes/detalles`
  - `/app/inscripciones`
  - `/app/reportes`


### Apéndice B. Roles y permisos

- Definición en `src/config/roles.ts`:
  - `admin`: `canManageUsers`, `canManageCourses`, `canViewAll`, `canViewAlerts`.
  - `docente`: `canEditGrades`, `canEditAttendance`, `canSendMessages`, `canViewAlerts`.
  - `alumno`/`familiar`: `canSendMessages`, `canViewAlerts`.
  - `usePermission` expone `can(permissionKey)` para verificar flags por rol.


### Apéndice C. Pruebas y calidad

- Ejecutar: `npm run lint`, `npm run test`, `npm run test:coverage`, `npm run build`.
- Setup de pruebas: `src/test/setup.ts`.
- Sugerencias de cobertura: reglas de negocio (alertas/boletines), rutas protegidas, formularios de calificaciones/asistencias, reportes, mensajería.


