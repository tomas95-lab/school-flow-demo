# Módulo de Finanzas - Deshabilitado

## Estado Actual
El módulo de finanzas ha sido **deshabilitado** temporalmente en el sistema.

## Cambios Realizados

### 1. Navegación
- **Archivo**: `src/components/ui/app-sidebar.tsx`
- **Cambio**: Comentada la entrada "Finanzas" en el menú de navegación
- **Línea**: `// { title: "Finanzas", url: "/app/finanzas", isActive: false },`

### 2. Rutas
- **Archivo**: `src/routes/AppRoutes.tsx`
- **Cambios**:
  - Comentado el import: `// const Finanzas = lazy(() => import("@/pages/Finanzas"));`
  - Comentada la ruta: `{/* <Route path="/app/finanzas" element={<Finanzas />} /> */}`

### 3. Permisos
- **Archivo**: `src/config/roles.ts`
- **Cambio**: Agregado `canAccessFinances: false` para todos los roles (admin, docente, alumno, familiar)

### 4. Componente de Inscripciones
- **Archivo**: `src/components/InscripcionesOverview.tsx`
- **Cambios**:
  - Comentada la propiedad `finanzas` en la interfaz `AprobacionesPorArea`
  - Removidas las referencias a finanzas en las aprobaciones por área
  - Cambiado el grid de 3 columnas a 2 columnas para las áreas de aprobación

## Archivos Afectados
- ✅ `src/components/ui/app-sidebar.tsx`
- ✅ `src/routes/AppRoutes.tsx`
- ✅ `src/config/roles.ts`
- ✅ `src/components/InscripcionesOverview.tsx`

## Archivos Mantenidos
Los siguientes archivos del módulo de finanzas se mantienen en el código pero no son accesibles:
- `src/pages/Finanzas.tsx`
- `src/pages/PagoSimulado.tsx`

## Para Rehabilitar el Módulo

1. **Descomentar en sidebar**: Remover los comentarios en `app-sidebar.tsx`
2. **Descomentar rutas**: Remover los comentarios en `AppRoutes.tsx`
3. **Actualizar permisos**: Cambiar `canAccessFinances: true` para los roles deseados
4. **Restaurar inscripciones**: Descomentar las referencias a finanzas en `InscripcionesOverview.tsx`

## Notas
- El módulo de finanzas era un MVP simulado según la documentación
- No había integración real con pasarelas de pago
- Se mantiene la funcionalidad de PagoSimulado para posibles pruebas futuras
