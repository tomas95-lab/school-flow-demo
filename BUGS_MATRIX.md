# 🐛 Matriz de Bugs Abiertos vs. Gravedad

## 📊 Estado General

**Total Bugs**: 12 | **Críticos**: 3 | **Altos**: 4 | **Medios**: 3 | **Bajos**: 2

---

## 🔴 CRÍTICOS (Demo Blocker)

| Módulo | Síntoma | Repro | Estado | Asignado |
|--------|---------|-------|--------|----------|
| **Auth** | Login falla con usuarios demo | 1. Ejecutar `seed:demo`<br>2. Intentar login `admin1@example.com`<br>3. Error "User not found" | 🔴 ABIERTO | TBD |
| **Firestore** | Reglas bloquean operaciones CRUD | 1. Crear nota en calificaciones<br>2. Error "Permission denied"<br>3. Reglas no validan roles correctamente | 🔴 ABIERTO | TBD |
| **PDF** | Generación de boletines falla | 1. Ir a `/app/boletines`<br>2. Generar boletín de curso<br>3. Error "jsPDF not defined" | 🔴 ABIERTO | TBD |

---

## 🟠 ALTOS (Demo Risk)

| Módulo | Síntoma | Repro | Estado | Asignado |
|--------|---------|-------|--------|----------|
| **Calificaciones** | Promedios no se calculan | 1. Cargar notas en tabla<br>2. Cambiar a vista de promedios<br>3. Columnas vacías o NaN | 🟠 ABIERTO | TBD |
| **Asistencias** | Calendario no muestra datos | 1. Navegar a `/app/asistencias`<br>2. Seleccionar curso/materia<br>3. Calendario vacío | 🟠 ABIERTO | TBD |
| **Dashboard** | KPIs muestran 0 o undefined | 1. Login como admin<br>2. Dashboard principal<br>3. Métricas no cargan | 🟠 ABIERTO | TBD |
| **Alertas** | Generación automática falla | 1. Ejecutar seed con datos<br>2. Verificar `/app/alertas`<br>3. No se generan alertas automáticas | 🟠 ABIERTO | TBD |

---

## 🟡 MEDIOS (Demo Impact)

| Módulo | Síntoma | Repro | Estado | Asignado |
|--------|---------|-------|--------|----------|
| **Usuarios** | Filtros no funcionan | 1. Ir a `/app/usuarios`<br>2. Usar filtros de búsqueda<br>3. No filtra resultados | 🟡 ABIERTO | TBD |
| **Cursos** | Asignaciones no se guardan | 1. Crear asignación docente-curso<br>2. Guardar cambios<br>3. No persiste en Firestore | 🟡 ABIERTO | TBD |
| **Mensajería** | Muro no carga mensajes | 1. Navegar a `/app/mensajes`<br>2. Ver muro de curso<br>3. Lista vacía | 🟡 ABIERTO | TBD |

---

## 🟢 BAJOS (Demo Polish)

| Módulo | Síntoma | Repro | Estado | Asignado |
|--------|---------|-------|--------|----------|
| **UI** | Toasts no aparecen | 1. Realizar acción (crear/editar)<br>2. Esperar notificación<br>3. Toast no visible | 🟢 ABIERTO | TBD |
| **Responsive** | Sidebar no colapsa en móvil | 1. Abrir en dispositivo móvil<br>2. Intentar colapsar sidebar<br>3. No responde al touch | 🟢 ABIERTO | TBD |

---

## 🔧 Bugs Resueltos (Esta Semana)

| Módulo | Síntoma | Solución | Fecha |
|--------|---------|----------|-------|
| **Build** | Error de tipos en `useFirestoreCollection` | Corregido tipado de constraints | 2024-01-XX |
| **Routing** | 404 en rutas anidadas | Corregido `AppRoutes.tsx` | 2024-01-XX |

---

## 📋 Acciones Inmediatas

### Para Demo de Hoy
- [ ] **CRÍTICO**: Validar reglas de Firestore
- [ ] **CRÍTICO**: Probar login con usuarios demo
- [ ] **ALTO**: Verificar cálculo de promedios

### Para Esta Semana
- [ ] **MEDIO**: Revisar filtros de usuarios
- [ ] **MEDIO**: Validar asignaciones de cursos
- [ ] **BAJO**: Corregir toasts de notificación

---

## 🎯 Métricas de Calidad

- **Build Success Rate**: 95% ✅
- **Test Coverage**: 78% ⚠️ (Meta: 85%)
- **Lint Score**: 92% ✅
- **Type Safety**: 89% ⚠️ (Meta: 95%)

---

## 📝 Notas de Desarrollo

### Prioridades
1. **Demo Ready**: Resolver bugs críticos y altos
2. **Code Quality**: Mejorar cobertura de tests
3. **Performance**: Optimizar queries de Firestore
4. **UX Polish**: Corregir bugs bajos

### Dependencias
- Firebase Admin SDK para scripts de seed
- jsPDF para generación de boletines
- Reglas de Firestore para permisos

---

*Última actualización: [FECHA] | Responsable: [DEV]* 