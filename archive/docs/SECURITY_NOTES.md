## Seguridad y control de acceso

Resumen ejecutivo: El front implementa guards (`PrivateRoute`, `PermissionRoute`) y mapeo de permisos en `src/config/roles.ts`. No hay reglas de seguridad Firestore en el repo; deben definirse y desplegarse antes de piloto/producción.

### Hallazgos

- Falta de reglas de seguridad Firestore en el repo (`firestore.rules`).
- Validación de permisos en UI: presente para rutas críticas (`/app/usuarios`, `/app/gestion-cursos-materias`).
- Escrituras UI con `serverTimestamp()` en `repository.ts` pero sin validación en backend contra schema.
- Mezcla de campos en documentos (dates string vs Timestamp) dificulta validaciones.
- Cloud Functions (`functions/index.js`) generan notificaciones a partir de mensajes/anuncios; no hay control de cuota ni validación de payload.

### Checklist de reglas (propuesta)

- Autenticación obligatoria para toda lectura/escritura salvo `/login`.
- users: un usuario solo puede leer su propio documento; admin puede leer/escribir todos.
- teachers/students: lectura por roles `admin|docente`; escritura restringida a admin.
- courses/subjects: lectura por usuarios autenticados con relación (curso asignado); escritura admin.
- attendances/calificaciones: escritura por `docente` asignado a curso/materia; lectura por `admin|docente` y por `alumno` solo si es su registro.
- alerts: creación `admin|docente`; lectura por destinatarios; `readBy` solo por el propio usuario.
- messages/conversations/announcements: escritura/lectura por participantes o destinatarios; límites de tamaño y rate-limiting.
- auditLogs: solo escritura por backend; lectura restringida a admin.

### Recomendaciones

- Añadir `firestore.rules` y `firestore.indexes.json` versionados.
- Validar payloads en Cloud Functions (tamaño, tipos, permisos).
- Introducir un validador ligero en UI (zod) y un “adapter” para normalizar fechas a `Timestamp`.
- Scoping por tenant si aplica multi-institución (prefijo o campo `tenantId`).


