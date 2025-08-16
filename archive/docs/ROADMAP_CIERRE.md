## Roadmap de cierre (2–4 semanas)

Resumen ejecutivo: plan por sprints enfocado en seguridad, calidad, UX y demo.

### Sprint 1 (Seguridad & P0 calidad)

- P0: Añadir `firestore.rules` y `firestore.indexes.json` y automatizar despliegue.
- P0: Corregir hooks condicionales en `src/pages/Auditoria.tsx`.
- P0: Normalizar fechas a `Timestamp` en escrituras nuevas (`repository.ts`).
- P1: Tipar `any` en `FloatingBot.tsx` (props/handlers) y `Usuarios.tsx`.

Estimación: 1 semana.

### Sprint 2 (UX/UI & hooks)

- P0: Revisar `react-hooks/exhaustive-deps` top 15 casos (tablas/export, messaging).
- P1: Estados vacíos y toasts consistentes (shadcn/ui), revisar `DialogReutlizable`.
- P1: Accesibilidad básica en modales (roles/aria, focus trap).

Estimación: 1 semana.

### Sprint 3 (Mensajería mínimo viable & Demo pack)

- P1: Consolidar vistas de `messaging/*` (lectura, envío básico, permisos por participante).
- P0: Script `seed-demo-data.ts` listo y documentado; guion de demo final.
- P1: KPIs de demo (tiempos) en `docs/DEMO_PLAYBOOK.md`.

Estimación: 1 semana.

### Sprint 4 (Endgame & performance)

- P2: Code-splitting adicional en páginas pesadas (DetallesCalificaciones, Reportes).
- P2: Auditoría de bundle y lazy-loading de gráficos.
- P2: Monitoreo básico de errores (toggle `VITE_ENABLE_ERROR_REPORTING`).

Estimación: 1 semana.

### Responsables (propuesta)

- Seguridad: Lead backend/Cloud Functions.
- Calidad TS/ESLint: Front lead.
- UX/UI: Front + diseño.
- Mensajería: Fullstack.
- Demo pack: PM + Front.


