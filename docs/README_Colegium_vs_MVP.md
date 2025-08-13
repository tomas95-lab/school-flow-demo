## Comparativa 1:1 — Colegium vs. MVP SchoolFlow

Referencia externa: [Colegium](https://www.colegium.com.ar/)

### Alcance
- Comparación enfocada en módulos académicos, comunicaciones, analítica, administración y finanzas.
- Basada en las funcionalidades públicas de Colegium y el estado actual del MVP.

### Matriz comparativa 1:1
| Área | Colegium | MVP actual | Gap/Notas | Prioridad |
|---|---|---|---|---|
| Calificaciones | Sí (escalas flexibles) | Sí (`src/pages/Calificaciones.tsx`, edición en línea) | OK | — |
| Asistencias | Sí | Sí (`src/pages/Asistencias.tsx`, calendario) | OK | — |
| Boletines | Sí | Sí (`src/pages/Boletin.tsx`, `src/pages/BoletinesCurso.tsx`) | OK | — |
| Observaciones/Alertas automáticas | Sí | Sí (`src/components/ObservacionesAutomaticasPanel.tsx`, `src/utils/observacionesAutomaticas.ts`) | Ventaja en automatizaciones | — |
| Mensajería (conversaciones/anuncios) | Sí | Sí (`src/components/messaging/*`) | OK | — |
| Dashboards/Analítica | Avanzado | Sí (`src/pages/Dashboard.tsx`, `src/pages/Panel360.tsx`, gráficos) | Falta analítica comparativa avanzada | P2 |
| Reportes oficiales | Sí | Parcial (exports básicos) | Formatos oficiales/regulatorios | P2 |
| Importaciones (CSV) | Sí | Sí (import alumnos/docentes/cursos) | OK | — |
| Gestión cursos/materias | Sí | Sí (`src/pages/GestionCursos&Materias.tsx`) | OK | — |
| Inscripciones/Matrículas online | Sí | Parcial (`src/components/InscripcionesOverview.tsx`) | Falta flujo end-to-end y pagos | P1 |
| Finanzas (facturación/cobranzas/pagos) | Sí (e-invoice, pasarelas, contable) | No | Módulo financiero completo | P0 |
| Integraciones (pagos/contable/SSO) | Amplias | Básicas (Firebase) | Pasarelas/contable/SSO | P0 |
| Apps móviles (iOS/Android) | Sí | No (web responsive) | PWA + push o apps nativas | P1 |
| Notificaciones push | Sí | Parcial (in-app/email) | Push móviles/web confiables | P1 |
| Seguridad/Compliance | Enterprise | Básico (Firebase Auth/roles) | Auditoría, backups, DPA, retención | P0 |
| SLA/Soporte | Enterprise | En construcción | Niveles de servicio y soporte | P1 |
| Personalización/Config | Alta | Alta velocidad de iteración | Parametrización avanzada UI/reglas | P2 |
| Multisede/Multi-colegio | Sí | Parcial | Separación tenants, data scoping | P1 |
| Analítica avanzada (metas, cohortes) | Sí | Básica | Metas, comparativas, alerts de KPIs | P2 |
| Asistente/IA | Sí (mensajería) | Sí (bot, automatizaciones) | Diferenciador académico | — |
| Auditoría/Bitácoras | Sí | No | Logs de auditoría por entidad/acción | P0 |
| Offline/PWA | Sí (parcial) | No | Modo offline crítico (asistencia) | P2 |

Leyenda: Sí = completo; Parcial = básico/incompleto; No = ausente. Prioridad: P0 crítica, P1 alta, P2 media.

### Roadmap por hitos

#### P0 — Crítico
- [ ] Finanzas: facturación, cobranzas, conciliación; integración con pasarela (ej. Mercado Pago) y exportes contables
- [ ] Integraciones: SSO (Google/Microsoft), endpoints API, conectores contables
- [ ] Seguridad: bitácoras/auditoría por entidad, retención y backups, hardening permisos/roles, export de datos

#### P1 — Alto
- [ ] Inscripciones end-to-end con pagos online y gestión de cupos
- [ ] PWA + notificaciones push (web y móviles); estrategia de permisos y topics
- [ ] Multisede/multi-colegio: scoping de datos, switching de tenant, roles por sede
- [ ] SLA/Soporte: catálogo de SLAs, runbooks, monitoreo y alertas

#### P2 — Medio
- [ ] Reportes oficiales y formatos regulatorios
- [ ] Analítica avanzada: metas, cohortes, comparativas históricas, alertas de KPIs
- [ ] Parametrización avanzada de reglas y UI (escalas, periodos, vistas)
- [ ] Offline selectivo (asistencia/calificaciones en aula)

### Criterios de aceptación (resumen)
- P0: emitir y registrar pagos end-to-end; auditoría completa de acciones sensibles; SSO operativo.
- P1: inscripción y pago confirmados en una sola experiencia; push confiable con tasas de entrega monitorizadas; tenants aislados.
- P2: reportes normativos descargables; dashboards con metas y alertas configurables; operación básica offline.

### KPIs sugeridos
- Adopción: usuarios activos diarios/mensuales por rol.
- Eficiencia: tiempo para registrar asistencia y calificaciones.
- Cobranza: tasa de pago a tiempo, mora, recupero.
- Fiabilidad: caídas, tiempos de carga p95, tasa de entrega push.

### Diferenciadores actuales del MVP
- Automatizaciones académicas y bot integrados.
- UI moderna con foco en velocidad de operación y visualizaciones.
- Capacidad de personalización e iteración rápida por institución.


