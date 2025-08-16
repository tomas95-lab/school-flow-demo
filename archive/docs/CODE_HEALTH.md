## Salud de código (ESLint/TS/Perf)

Resumen ejecutivo: Lint reporta 325 issues (297 errores, 28 warnings). Build y tests pasan. Typecheck sin errores (tsc --noEmit limpio). Quick wins: tipar `any`, corregir dependencias de hooks, evitar hooks condicionales en `Auditoria.tsx`.

### Top reglas con incidencias (fuente: `lint-summary.json`)

| Regla | # | Impacto | Quick win |
|---|---:|---|---|
| @typescript-eslint/no-explicit-any | 278 | Riesgo de runtime y DX pobre | Reemplazar con tipos de dominio (`User`, `Grade`, `unknown` + narrow) |
| react-hooks/exhaustive-deps | 17 | Bugs por stale closures | Añadir deps o memoizar funciones con `useCallback` |
| @typescript-eslint/no-unused-vars | 12 | Ruido, potencial code smell | Eliminar vars sin uso o prefijo `_` |
| react-refresh/only-export-components | 7 | DX hot-reload | Mover const/func auxiliares a archivo aparte |
| @typescript-eslint/ban-ts-comment | 2 | Oculta problemas de tipos | Cambiar a `@ts-expect-error` documentado o tipar |
| no-empty | 2 | Silencia errores | Remover bloques vacíos o agregar manejo |
| react-hooks/rules-of-hooks | 2 | Bug crítico en runtime | Reordenar para no llamar hooks condicionalmente |
| prefer-const | 1 | Estilo | Usar `const` |

### Hooks mal usados (detectados)

- `src/pages/Auditoria.tsx`: hooks `useFirestoreCollection` y `useMemo` llamados condicionalmente. Acción: extraer la condición antes y render condicional, no hook.
- Dependencias faltantes frecuentes en `useEffect`/`useMemo` (múltiples archivos listados por ESLint). Acción: revisar y añadir deps; si causa loops, memoizar handlers.

### Componentes grandes candidatos a refactor

- `src/components/FloatingBot.tsx` (>1400 líneas, múltiples responsabilidades).
- `src/pages/DetallesCalificaciones.tsx` (~800 líneas).
- `src/components/ReportesInteligentesOverview.tsx` (~900 líneas).

Acción: dividir en subcomponentes “pure” y hooks específicos.

### Performance

- Firestore listeners: el repositorio usa `getDocs` (no listeners persistentes), bajo riesgo de leaks. Verificar en `useFireStoreCollection` si hay `onSnapshot` y cleanup correcto (tests cubren hook básico).
- Memoización: advertencias por deps indican re-render innecesario. Acción: `useMemo`/`useCallback` bien calibrados para tablas, filtros, export.
- Bundle: Vite build generado; assets principales: `index-BSkV5UjW.js ~303 kB gzip ~93k`, `firebase ~488 kB` (vendorizado), tablas ~353 kB. Aceptable para MVP; se sugiere code-splitting adicional en páginas más pesadas.

### Sugerencias 80/20

1) Tipar `any` en módulos UI clave: `FloatingBot.tsx`, `Dashboard.tsx`, `Usuarios.tsx`, messaging/*. Priorizar props/handlers y datos provenientes de Firestore.
2) Corregir `react-hooks/exhaustive-deps` más ruidosos (tablas/export handlers). 
3) Arreglar hooks condicionales en `Auditoria.tsx` (P0).


