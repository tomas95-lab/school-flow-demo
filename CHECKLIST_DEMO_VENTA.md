# ✅ Checklist de Salida a Demo/Venta

## 🚀 Pre-Demo (24h antes)

### Build y Calidad
- [ ] `pnpm run build` ✅ sin errores
- [ ] `pnpm run lint` ✅ sin errores críticos
- [ ] `pnpm run typecheck` ✅ sin errores de tipos
- [ ] `pnpm run test:run` ✅ tests pasando (>80% cobertura)

### Infraestructura Firebase
- [ ] Proyecto Firebase activo y facturación configurada
- [ ] Reglas de Firestore desplegadas (`firebase deploy --only firestore:rules`)
- [ ] Hosting desplegado (`firebase deploy --only hosting`)
- [ ] Autenticación habilitada (Email/Password)
- [ ] Storage habilitado (para PDFs)

### Variables de Entorno
- [ ] `.env.local` configurado con credenciales reales
- [ ] `VITE_FIREBASE_*` variables correctas
- [ ] `VITE_ENABLE_DEBUG_MODE=false` (producción)
- [ ] `VITE_ENABLE_ANALYTICS=true` (si aplica)

## 🎯 Setup de Demo (2h antes)

### Datos Semilla
- [ ] `pnpm run clean-collections` ejecutado
- [ ] `pnpm run seed:demo` ejecutado exitosamente
- [ ] `pnpm run list-collections` muestra datos cargados
- [ ] Colecciones mínimas: `users`, `courses`, `subjects`, `students`, `attendances`, `calificaciones`

### Usuarios de Prueba
- [ ] `admin1@example.com` creado y funcional
- [ ] `doc1@example.com` creado y funcional  
- [ ] `al1@example.com` creado y funcional
- [ ] Roles asignados correctamente en Firestore
- [ ] Permisos funcionando (`usePermission` hooks)

### Funcionalidades Core
- [ ] Login funciona con usuarios demo
- [ ] Dashboard carga métricas reales
- [ ] Navegación lateral funcional
- [ ] Rutas protegidas funcionando

## 🔧 Funcionalidades Críticas (1h antes)

### Calificaciones
- [ ] Tabla de calificaciones carga datos
- [ ] Formulario de crear nota funciona
- [ ] Edición inline funciona
- [ ] Cálculo de promedios automático
- [ ] Exportación CSV funcional

### Asistencias
- [ ] Calendario de asistencias visible
- [ ] Registro rápido de asistencia funciona
- [ ] Filtros por curso/materia funcionan
- [ ] Vista por roles (admin/docente/alumno) correcta

### Boletines
- [ ] Generación de boletín funciona
- [ ] PDF se genera y descarga
- [ ] Observaciones automáticas aparecen
- [ ] Vista de explicación funcional

### Alertas
- [ ] Alertas automáticas generadas
- [ ] Creación manual de alertas funciona
- [ ] Filtros por severidad funcionan
- [ ] Notificaciones toast visibles

## 📱 UI/UX (30min antes)

### Componentes Visuales
- [ ] Toasts de notificación visibles
- [ ] Loading states funcionando
- [ ] Error boundaries activos
- [ ] Responsive design en móvil
- [ ] Tema claro/oscuro funcional

### Navegación
- [ ] Breadcrumbs funcionando
- [ ] Sidebar colapsable
- [ ] Búsqueda global funcional
- [ ] Filtros avanzados funcionando

## 🧪 Testing de Demo (15min antes)

### Flujo Completo
- [ ] Login → Dashboard → Módulos → Logout
- [ ] Crear nota → Ver en tabla → Editar → Eliminar
- [ ] Marcar asistencia → Ver en calendario
- [ ] Generar boletín → Descargar PDF
- [ ] Crear alerta → Ver en listado

### Performance
- [ ] Tiempo de carga < 3s en módulos principales
- [ ] Navegación entre páginas < 1s
- [ ] Generación PDF < 10s
- [ ] Búsquedas < 2s

### Datos
- [ ] Métricas del dashboard son reales
- [ ] Gráficos muestran datos correctos
- [ ] Filtros aplican correctamente
- [ ] Paginación funciona

## 🚨 Contingencias Preparadas

### Fallbacks
- [ ] Si PDF falla: mostrar vista HTML del boletín
- [ ] Si Firestore lento: mostrar datos cacheados
- [ ] Si auth falla: modo offline con datos demo
- [ ] Si build falla: versión pre-compilada lista

### Documentación de Emergencia
- [ ] Screenshots de cada módulo funcional
- [ ] Video de demo pre-grabado
- [ ] Lista de URLs directas a funcionalidades
- [ ] Contacto de soporte técnico

## 📋 Post-Demo

### Feedback
- [ ] Notas de preguntas del cliente
- [ ] Funcionalidades solicitadas
- [ ] Bugs reportados
- [ ] Mejoras sugeridas

### Seguimiento
- [ ] Propuesta técnica preparada
- [ ] Timeline de implementación
- [ ] Presupuesto estimado
- [ ] Próximos pasos acordados

---

## 🎯 Estado Final

**Demo Status**: 🟢 LISTO / 🟡 PARCIAL / 🔴 NO LISTO

**Confianza**: ___% (1-100)

**Riesgos Identificados**: 
- 

**Plan de Contingencia**: 
- 

**Notas para el Equipo de Ventas**:
- 

---

*Última actualización: [FECHA] por [RESPONSABLE]* 