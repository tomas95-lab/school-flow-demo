// Sistema de Alertas Críticas Automáticas
// Genera alertas automáticas basadas en rendimiento, asistencia y tendencias

import { getPeriodoActual } from './boletines';

export interface DatosAlumno {
  studentId: string;
  calificaciones: Array<{
    valor: number;
    fecha: string;
    subjectId: string;
  }>;
  asistencias: Array<{
    present: boolean;
    fecha: string;
  }>;
  periodoActual: string;
  periodoAnterior?: string;
}

export interface AlertaAutomatica {
  id: string;
  studentId: string;
  studentName: string;
  tipo: 'rendimiento_critico' | 'asistencia_critica' | 'tendencia_negativa' | 'materia_riesgo' | 'mejora_significativa';
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  datosSoporte: {
    promedioActual: number;
    promedioAnterior?: number;
    ausencias: number;
    tendencia: 'mejora' | 'descenso' | 'estable' | 'sin_datos';
    materiasEnRiesgo?: string[];
    porcentajeAsistencia?: number;
  };
  fechaGeneracion: Date;
  activa: boolean;
  leida: boolean;
}

// Tipo para las reglas de alertas
type ReglaAlerta = {
  condicion: (...args: any[]) => boolean;
  titulo: string;
  descripcion: string;
  tipo: AlertaAutomatica['tipo'];
  prioridad: AlertaAutomatica['prioridad'];
};

// Reglas para generar alertas automáticas
const REGLAS_ALERTAS: Record<string, ReglaAlerta> = {
  RENDIMIENTO_CRITICO: {
    condicion: (datos: DatosAlumno, promedioActual: number) => promedioActual < 5.0,
    titulo: "Rendimiento Crítico Detectado",
    descripcion: "El estudiante presenta un rendimiento académico crítico que requiere intervención inmediata.",
    tipo: 'rendimiento_critico',
    prioridad: 'critica'
  },
  
  RENDIMIENTO_BAJO: {
    condicion: (datos: DatosAlumno, promedioActual: number) => promedioActual >= 5.0 && promedioActual < 6.0,
    titulo: "Rendimiento Bajo",
    descripcion: "El estudiante presenta un rendimiento académico bajo que necesita atención.",
    tipo: 'rendimiento_critico',
    prioridad: 'alta'
  },
  
  ASISTENCIA_CRITICA: {
    condicion: (datos: DatosAlumno, promedioActual: number, ausencias: number, porcentajeAsistencia: number) => 
      porcentajeAsistencia < 70 || ausencias > 5,
    titulo: "Asistencia Crítica",
    descripcion: "El estudiante presenta problemas graves de asistencia que afectan su aprendizaje.",
    tipo: 'asistencia_critica',
    prioridad: 'critica'
  },
  
  ASISTENCIA_BAJA: {
    condicion: (datos: DatosAlumno, promedioActual: number, ausencias: number, porcentajeAsistencia: number) => 
      (porcentajeAsistencia >= 70 && porcentajeAsistencia < 80) || (ausencias > 3 && ausencias <= 5),
    titulo: "Asistencia Baja",
    descripcion: "El estudiante presenta una asistencia baja que puede afectar su rendimiento.",
    tipo: 'asistencia_critica',
    prioridad: 'alta'
  },
  
  TENDENCIA_NEGATIVA: {
    condicion: (datos: DatosAlumno, promedioActual: number, promedioAnterior?: number) => {
      if (!promedioAnterior) return false;
      return (promedioActual - promedioAnterior) < -1.0;
    },
    titulo: "Tendencia Negativa Detectada",
    descripcion: "El estudiante muestra una tendencia negativa en su rendimiento académico.",
    tipo: 'tendencia_negativa',
    prioridad: 'alta'
  },
  
  MATERIAS_EN_RIESGO: {
    condicion: (datos: DatosAlumno, promedioActual: number, materiasEnRiesgo: string[]) => 
      materiasEnRiesgo.length >= 2,
    titulo: "Múltiples Materias en Riesgo",
    descripcion: "El estudiante tiene múltiples materias con rendimiento bajo.",
    tipo: 'materia_riesgo',
    prioridad: 'alta'
  },
  
  MEJORA_SIGNIFICATIVA: {
    condicion: (datos: DatosAlumno, promedioActual: number, promedioAnterior?: number) => {
      if (!promedioAnterior) return false;
      return (promedioActual - promedioAnterior) > 1.0;
    },
    titulo: "Mejora Significativa",
    descripcion: "¡Excelente! El estudiante muestra una mejora significativa en su rendimiento.",
    tipo: 'mejora_significativa',
    prioridad: 'baja'
  }
};

// Función principal para generar alertas automáticas
export function generarAlertasAutomaticas(
  datosAlumno: DatosAlumno,
  studentName: string
): AlertaAutomatica[] {
  const alertas: AlertaAutomatica[] = [];
  
  // Calcular métricas básicas
  const promedioActual = calcularPromedioActual(datosAlumno.calificaciones);
  const promedioAnterior = calcularPromedioAnterior(datosAlumno.calificaciones, datosAlumno.periodoAnterior);
  const ausencias = contarAusencias(datosAlumno.asistencias);
  const porcentajeAsistencia = calcularPorcentajeAsistencia(datosAlumno.asistencias);
  const materiasEnRiesgo = identificarMateriasEnRiesgo(datosAlumno.calificaciones);
  const tendencia = determinarTendencia(promedioActual, promedioAnterior);
  
  // Verificar cada regla
  Object.entries(REGLAS_ALERTAS).forEach(([key, regla]) => {
    let seCumple = false;
    
    switch (key) {
      case 'RENDIMIENTO_CRITICO':
      case 'RENDIMIENTO_BAJO':
        seCumple = regla.condicion(datosAlumno, promedioActual);
        break;
        
      case 'ASISTENCIA_CRITICA':
      case 'ASISTENCIA_BAJA':
        seCumple = regla.condicion(datosAlumno, promedioActual, ausencias, porcentajeAsistencia);
        break;
        
      case 'TENDENCIA_NEGATIVA':
      case 'MEJORA_SIGNIFICATIVA':
        seCumple = regla.condicion(datosAlumno, promedioActual, promedioAnterior);
        break;
        
      case 'MATERIAS_EN_RIESGO':
        seCumple = regla.condicion(datosAlumno, promedioActual, materiasEnRiesgo);
        break;
    }
    
    if (seCumple) {
      const alerta: AlertaAutomatica = {
        id: `${datosAlumno.studentId}_${key}_${Date.now()}`,
        studentId: datosAlumno.studentId,
        studentName,
        tipo: regla.tipo,
        prioridad: regla.prioridad,
        titulo: regla.titulo,
        descripcion: regla.descripcion,
        datosSoporte: {
          promedioActual,
          promedioAnterior,
          ausencias,
          tendencia,
          materiasEnRiesgo: materiasEnRiesgo.length > 0 ? materiasEnRiesgo : undefined,
          porcentajeAsistencia
        },
        fechaGeneracion: new Date(),
        activa: true,
        leida: false
      };
      
      alertas.push(alerta);
    }
  });
  
  // Ordenar por prioridad (crítica > alta > media > baja)
  const prioridades = { critica: 4, alta: 3, media: 2, baja: 1 };
  alertas.sort((a, b) => prioridades[b.prioridad] - prioridades[a.prioridad]);
  
  return alertas;
}

// Función para generar alertas para múltiples estudiantes
export function generarAlertasParaEstudiantes(
  estudiantes: Array<{ studentId: string; studentName: string; datos: DatosAlumno }>
): AlertaAutomatica[] {
  const todasLasAlertas: AlertaAutomatica[] = [];
  
  estudiantes.forEach(({ studentId, studentName, datos }) => {
    const alertas = generarAlertasAutomaticas(datos, studentName);
    todasLasAlertas.push(...alertas);
  });
  
  return todasLasAlertas;
}

// Función para obtener alertas críticas (prioridad crítica y alta)
export function filtrarAlertasCriticas(alertas: AlertaAutomatica[]): AlertaAutomatica[] {
  return alertas.filter(alerta => 
    alerta.prioridad === 'critica' || alerta.prioridad === 'alta'
  );
}

// Función para obtener alertas por tipo
export function filtrarAlertasPorTipo(alertas: AlertaAutomatica[], tipo: AlertaAutomatica['tipo']): AlertaAutomatica[] {
  return alertas.filter(alerta => alerta.tipo === tipo);
}

// Función para obtener alertas por estudiante
export function filtrarAlertasPorEstudiante(alertas: AlertaAutomatica[], studentId: string): AlertaAutomatica[] {
  return alertas.filter(alerta => alerta.studentId === studentId);
}

// Función para marcar alerta como leída
export function marcarAlertaComoLeida(alerta: AlertaAutomatica): AlertaAutomatica {
  return {
    ...alerta,
    leida: true
  };
}

// Función para desactivar alerta
export function desactivarAlerta(alerta: AlertaAutomatica): AlertaAutomatica {
  return {
    ...alerta,
    activa: false
  };
}

// Funciones auxiliares
function calcularPromedioActual(calificaciones: DatosAlumno['calificaciones']): number {
  if (calificaciones.length === 0) return 0;
  const suma = calificaciones.reduce((sum, cal) => sum + cal.valor, 0);
  return suma / calificaciones.length;
}

function calcularPromedioAnterior(
  calificaciones: DatosAlumno['calificaciones'], 
  periodoAnterior?: string
): number | undefined {
  if (!periodoAnterior) return undefined;
  
  // Filtrar calificaciones del período anterior (simplificado)
  const calificacionesAnteriores = calificaciones.filter(cal => {
    const fecha = new Date(cal.fecha);
    const periodo = obtenerPeriodoDesdeFecha(fecha);
    return periodo === periodoAnterior;
  });
  
  if (calificacionesAnteriores.length === 0) return undefined;
  
  const suma = calificacionesAnteriores.reduce((sum, cal) => sum + cal.valor, 0);
  return suma / calificacionesAnteriores.length;
}

function contarAusencias(asistencias: DatosAlumno['asistencias']): number {
  return asistencias.filter(asist => !asist.present).length;
}

function calcularPorcentajeAsistencia(asistencias: DatosAlumno['asistencias']): number {
  if (asistencias.length === 0) return 100;
  const presentes = asistencias.filter(asist => asist.present).length;
  return (presentes / asistencias.length) * 100;
}

function identificarMateriasEnRiesgo(calificaciones: DatosAlumno['calificaciones']): string[] {
  const materiasMap = new Map<string, number[]>();
  
  // Agrupar calificaciones por materia
  calificaciones.forEach(cal => {
    if (!materiasMap.has(cal.subjectId)) {
      materiasMap.set(cal.subjectId, []);
    }
    materiasMap.get(cal.subjectId)!.push(cal.valor);
  });
  
  const materiasEnRiesgo: string[] = [];
  
  materiasMap.forEach((notas, subjectId) => {
    const promedio = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
    if (promedio < 6.0) {
      materiasEnRiesgo.push(subjectId);
    }
  });
  
  return materiasEnRiesgo;
}

function determinarTendencia(
  promedioActual: number, 
  promedioAnterior?: number
): 'mejora' | 'descenso' | 'estable' | 'sin_datos' {
  if (!promedioAnterior) return 'sin_datos';
  
  const diferencia = promedioActual - promedioAnterior;
  
  if (diferencia > 0.5) return 'mejora';
  if (diferencia < -0.5) return 'descenso';
  return 'estable';
}

function obtenerPeriodoDesdeFecha(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = fecha.getMonth() + 1;
  
  if (month >= 3 && month <= 5) return `${year}-T1`;
  if (month >= 6 && month <= 8) return `${year}-T2`;
  if (month >= 9 && month <= 11) return `${year}-T3`;
  return `${year}-T1`; // Diciembre, enero, febrero
}

// Función para obtener estadísticas de alertas
export function obtenerEstadisticasAlertas(alertas: AlertaAutomatica[]) {
  const total = alertas.length;
  const criticas = alertas.filter(a => a.prioridad === 'critica').length;
  const altas = alertas.filter(a => a.prioridad === 'alta').length;
  const noLeidas = alertas.filter(a => !a.leida).length;
  const activas = alertas.filter(a => a.activa).length;
  
  const porTipo = {
    rendimiento_critico: alertas.filter(a => a.tipo === 'rendimiento_critico').length,
    asistencia_critica: alertas.filter(a => a.tipo === 'asistencia_critica').length,
    tendencia_negativa: alertas.filter(a => a.tipo === 'tendencia_negativa').length,
    materia_riesgo: alertas.filter(a => a.tipo === 'materia_riesgo').length,
    mejora_significativa: alertas.filter(a => a.tipo === 'mejora_significativa').length
  };
  
  return {
    total,
    criticas,
    altas,
    noLeidas,
    activas,
    porTipo
  };
} 
