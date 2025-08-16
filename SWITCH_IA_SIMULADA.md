# 🤖 Switch de IA Simulada - Guía de Demo

## 🎯 Objetivo
Documentar cómo habilitar/deshabilitar funcionalidades de IA simulada (observaciones automáticas, alertas inteligentes) durante demos para controlar el comportamiento del sistema.

---

## 🔧 Variables de Control

### Variables Principales (`.env.local`)

```env
# 🧠 IA y Observaciones Automáticas
VITE_ENABLE_AI_OBSERVATIONS=true          # true/false
VITE_ENABLE_AI_ALERTS=true                # true/false
VITE_ENABLE_AI_RECOMMENDATIONS=true       # true/false

# 🎭 Modo Demo
VITE_DEMO_MODE=true                       # true/false
VITE_DEMO_AI_DELAY=2000                  # ms de delay para simular procesamiento
VITE_DEMO_AI_CONFIDENCE=0.85             # confianza simulada (0.0-1.0)

# 📊 Generación de Contenido
VITE_ENABLE_AUTO_OBSERVATIONS=true        # observaciones en boletines
VITE_ENABLE_AUTO_ALERTS=true             # alertas automáticas
VITE_ENABLE_SMART_REPORTS=true           # reportes inteligentes
```

### Variables de Configuración Avanzada

```env
# 🎨 Personalización de IA
VITE_AI_OBSERVATION_STYLE=professional   # professional/casual/educational
VITE_AI_ALERT_THRESHOLDS=strict          # strict/medium/lenient
VITE_AI_LANGUAGE=es                      # es/en (idioma de observaciones)

# 🔄 Frecuencia de Generación
VITE_AI_UPDATE_INTERVAL=300000           # ms entre actualizaciones
VITE_AI_BATCH_SIZE=10                    # alertas por lote
VITE_AI_MAX_OBSERVATIONS=5               # máx observaciones por alumno
```

---

## 🎮 Modos de Operación

### Modo Demo Completo
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=true
VITE_ENABLE_AI_ALERTS=true
VITE_DEMO_AI_DELAY=3000
VITE_DEMO_AI_CONFIDENCE=0.95
```

**Comportamiento**: 
- IA genera observaciones automáticamente
- Alertas se crean en tiempo real
- Delay artificial para simular procesamiento
- Alta confianza simulada

### Modo Demo Controlado
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=true
VITE_ENABLE_AI_ALERTS=false
VITE_DEMO_AI_DELAY=1000
```

**Comportamiento**:
- Solo observaciones automáticas
- Sin alertas automáticas
- Delay mínimo
- Ideal para demos de boletines

### Modo Demo Manual
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=false
VITE_ENABLE_AI_ALERTS=false
VITE_DEMO_AI_DELAY=0
```

**Comportamiento**:
- Sin generación automática
- Control total del presentador
- Ideal para explicar funcionalidades paso a paso

---

## 🎬 Configuraciones por Tipo de Demo

### Demo de Ventas (15 min)
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=true
VITE_ENABLE_AI_ALERTS=true
VITE_DEMO_AI_DELAY=2000
VITE_AI_OBSERVATION_STYLE=professional
VITE_AI_ALERT_THRESHOLDS=medium
```

**Justificación**: Muestra capacidades completas con timing controlado

### Demo Técnica (30 min)
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=true
VITE_ENABLE_AI_ALERTS=true
VITE_DEMO_AI_DELAY=500
VITE_AI_UPDATE_INTERVAL=60000
VITE_AI_BATCH_SIZE=5
```

**Justificación**: Permite explicar algoritmos sin esperas largas

### Demo de Capacitación (60 min)
```env
VITE_DEMO_MODE=true
VITE_ENABLE_AI_OBSERVATIONS=false
VITE_ENABLE_AI_ALERTS=false
VITE_DEMO_AI_DELAY=0
VITE_ENABLE_AI_RECOMMENDATIONS=true
```

**Justificación**: Enfoque en funcionalidades manuales y recomendaciones

---

## 🛠️ Implementación en Código

### Hook de Control de IA
```typescript
// src/hooks/useAIControl.ts
export const useAIControl = () => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const enableObservations = import.meta.env.VITE_ENABLE_AI_OBSERVATIONS === 'true'
  const enableAlerts = import.meta.env.VITE_ENABLE_AI_ALERTS === 'true'
  const aiDelay = parseInt(import.meta.env.VITE_DEMO_AI_DELAY || '0')
  
  return {
    isDemoMode,
    enableObservations,
    enableAlerts,
    aiDelay,
    shouldSimulateAI: isDemoMode && (enableObservations || enableAlerts)
  }
}
```

### Servicio de IA Simulada
```typescript
// src/services/demoAIService.ts
export const demoAIService = {
  async generateObservation(studentData: any, delay: number = 0) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // Lógica de generación simulada
    return {
      text: "Observación generada automáticamente para demo",
      confidence: import.meta.env.VITE_DEMO_AI_CONFIDENCE || 0.85,
      timestamp: new Date().toISOString()
    }
  },
  
  async generateAlert(studentData: any, type: string) {
    const delay = parseInt(import.meta.env.VITE_DEMO_AI_DELAY || '0')
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    return {
      type,
      severity: 'medium',
      description: `Alerta ${type} generada automáticamente`,
      confidence: import.meta.env.VITE_DEMO_AI_CONFIDENCE || 0.85
    }
  }
}
```

---

## 🎯 Funcionalidades Controladas

### 1. Observaciones Automáticas en Boletines
**Archivo**: `src/utils/boletines.ts`
**Variable**: `VITE_ENABLE_AUTO_OBSERVATIONS`

```typescript
export const generarObservacionAutomaticaBoletin = async (alumno: Student) => {
  const { enableObservations, aiDelay } = useAIControl()
  
  if (!enableObservations) {
    return null
  }
  
  if (aiDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, aiDelay))
  }
  
  // Lógica de generación simulada
  return demoAIService.generateObservation(alumno)
}
```

### 2. Alertas Automáticas
**Archivo**: `src/utils/alertasAutomaticas.ts`
**Variable**: `VITE_ENABLE_AUTO_ALERTS`

```typescript
export const generarAlertasAutomaticas = async () => {
  const { enableAlerts, aiDelay } = useAIControl()
  
  if (!enableAlerts) {
    return []
  }
  
  if (aiDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, aiDelay))
  }
  
  // Generar alertas simuladas
  return demoAIService.generateBatchAlerts()
}
```

### 3. Reportes Inteligentes
**Archivo**: `src/components/ReportesInteligentesOverview.tsx`
**Variable**: `VITE_ENABLE_SMART_REPORTS`

```typescript
const ReportesInteligentesOverview = () => {
  const { enableSmartReports, aiDelay } = useAIControl()
  
  useEffect(() => {
    if (enableSmartReports) {
      // Simular generación de insights
      setTimeout(() => {
        setInsights(generateDemoInsights())
      }, aiDelay)
    }
  }, [])
  
  // ... resto del componente
}
```

---

## 🔄 Cambios en Tiempo Real

### Sin Reiniciar la App
```typescript
// src/context/AIContext.tsx
export const AIContext = createContext({
  settings: {
    enableObservations: false,
    enableAlerts: false,
    aiDelay: 0
  },
  updateSettings: (newSettings: Partial<AISettings>) => {}
})

// Permite cambiar configuración sin reload
const updateAISettings = (newSettings: Partial<AISettings>) => {
  // Actualizar variables de entorno en runtime
  Object.entries(newSettings).forEach(([key, value]) => {
    import.meta.env[`VITE_${key}`] = value.toString()
  })
  
  // Notificar cambios a componentes
  setSettings(prev => ({ ...prev, ...newSettings }))
}
```

### Con Reinicio (Recomendado)
```bash
# Cambiar .env.local y reiniciar
cp .env.demo .env.local
pnpm run dev
```

---

## 📋 Checklist de Configuración para Demo

### Antes de la Demo
- [ ] Configurar `.env.local` con modo demo deseado
- [ ] Verificar que `VITE_DEMO_MODE=true`
- [ ] Ajustar delays según tiempo disponible
- [ ] Probar generación de observaciones/alertas

### Durante la Demo
- [ ] Explicar que es IA simulada para demo
- [ ] Mostrar timing controlado
- [ ] Demostrar personalización de estilos
- [ ] Permitir preguntas sobre implementación real

### Después de la Demo
- [ ] Cambiar a modo producción
- [ ] Documentar configuración usada
- [ ] Recopilar feedback sobre timing
- [ ] Ajustar configuración para próximas demos

---

## 🚨 Troubleshooting

### Problema: IA no genera contenido
1. Verificar `VITE_DEMO_MODE=true`
2. Confirmar `VITE_ENABLE_AI_*` variables
3. Revisar consola del navegador
4. Verificar que `useAIControl` hook funciona

### Problema: Delays muy largos
1. Ajustar `VITE_DEMO_AI_DELAY` a valor menor
2. Verificar que no hay delays acumulativos
3. Usar modo manual si es necesario

### Problema: Contenido no personalizado
1. Verificar `VITE_AI_OBSERVATION_STYLE`
2. Confirmar `VITE_AI_LANGUAGE`
3. Revisar lógica de generación en `demoAIService`

---

## 🔗 Archivos Relacionados

- **Configuración**: `.env.local`, `.env.example`
- **Hooks**: `src/hooks/useAIControl.ts`
- **Servicios**: `src/services/demoAIService.ts`
- **Contexto**: `src/context/AIContext.tsx`
- **Utilidades**: `src/utils/boletines.ts`, `src/utils/alertasAutomaticas.ts`
- **Componentes**: `src/components/ReportesInteligentesOverview.tsx`

---

*Última actualización: [FECHA] | Para control de IA en demos* 