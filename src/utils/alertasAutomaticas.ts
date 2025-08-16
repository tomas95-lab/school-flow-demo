// Sistema de Alertas Críticas Automáticas
// Genera alertas automáticas basadas en rendimiento, asistencia y tendencias

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Interfaz para umbrales de IA configurables
export interface UmbralesIA {
  rendimientoCritico: number;
  rendimientoBajo: number;
  rendimientoExcelente: number;
  asistenciaCritica: number;
  asistenciaBaja: number;
  maxAusenciasCriticas: number;
  maxAusenciasBajas: number;
  tendenciaNegativaMinima: number;
  mejoraSignificativa: number;
  materiasEnRiesgoMinimas: number;
  diasAnalisisRendimiento: number;
  frecuenciaRevisionAlertas: number;
}

// Umbrales por defecto
const UMBRALES_DEFAULT: UmbralesIA = {
  rendimientoCritico: 5.0,
  rendimientoBajo: 6.0,
  rendimientoExcelente: 8.5,
  asistenciaCritica: 70,
  asistenciaBaja: 80,
  maxAusenciasCriticas: 5,
  maxAusenciasBajas: 3,
  tendenciaNegativaMinima: 1.0,
  mejoraSignificativa: 1.0,
  materiasEnRiesgoMinimas: 2,
  diasAnalisisRendimiento: 30,
  frecuenciaRevisionAlertas: 24
};

// Función para obtener umbrales personalizados
async function obtenerUmbralesIA(): Promise<UmbralesIA> {
  try {
    const configDoc = await getDoc(doc(db, 'configuracion', 'umbralesIA'));
    if (configDoc.exists()) {
      return { ...UMBRALES_DEFAULT, ...configDoc.data() } as UmbralesIA;
    }
  } catch (error) {
    console.warn('Error cargando configuración de IA, usando valores por defecto:', error);
  }
  return UMBRALES_DEFAULT;
}

export interface DatosAlumno {
  studentId: string;
  calificaciones: Array<{
    valor: number;
    fecha: string;
    subjectId: string;
    ausente?: boolean;
  }>;
  asistencias: Array<{
    present: boolean;
    fecha: string;
    late?: boolean;
  }>;
  periodoActual: string;
  periodoAnterior?: string;
}

export interface AlertaAutomatica {
  id: string;
  studentId: string;
  studentName: string;
  tipo: 'rendimiento_critico' | 'asistencia_critica' | 'tendencia_negativa' | 'mejora_significativa' | 'materia_riesgo';
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  datosSoporte: {
    promedioActual?: number;
    promedioAnterior?: number;
    ausencias?: number;
    tendencia?: string;
    materiasEnRiesgo?: string[];
    porcentajeAsistencia?: number;
  };
  fechaGeneracion: Date;
  activa: boolean;
  leida: boolean;
}

type ReglaAlerta = {
  condicion: (...args: unknown[]) => boolean;
  titulo: string;
  descripcion: string;
  tipo: AlertaAutomatica['tipo'];
  prioridad: AlertaAutomatica['prioridad'];
};

// Función para crear reglas dinámicas basadas en configuración
function crearReglasAlertas(umbrales: UmbralesIA): Record<string, ReglaAlerta> {
  return {
    RENDIMIENTO_CRITICO: {
      condicion: ((promedioActual: number) => promedioActual < umbrales.rendimientoCritico) as (...args: unknown[]) => boolean,
      titulo: "Rendimiento Crítico Detectado",
      descripcion: `El estudiante presenta un rendimiento académico crítico (< ${umbrales.rendimientoCritico}) que requiere intervención inmediata.`,
      tipo: 'rendimiento_critico',
      prioridad: 'critica'
    },
    
    RENDIMIENTO_BAJO: {
      condicion: ((promedioActual: number) => 
        promedioActual >= umbrales.rendimientoCritico && promedioActual < umbrales.rendimientoBajo
      ) as (...args: unknown[]) => boolean,
      titulo: "Rendimiento Bajo",
      descripcion: `El estudiante presenta un rendimiento académico bajo (${umbrales.rendimientoCritico}-${umbrales.rendimientoBajo}) que necesita atención.`,
      tipo: 'rendimiento_critico',
      prioridad: 'alta'
    },
    
    ASISTENCIA_CRITICA: {
      condicion: ((ausencias: number, porcentajeAsistencia: number) => 
        porcentajeAsistencia < umbrales.asistenciaCritica || ausencias > umbrales.maxAusenciasCriticas
      ) as (...args: unknown[]) => boolean,
      titulo: "Asistencia Crítica",
      descripcion: `El estudiante presenta problemas graves de asistencia (< ${umbrales.asistenciaCritica}% o > ${umbrales.maxAusenciasCriticas} ausencias) que afectan su aprendizaje.`,
      tipo: 'asistencia_critica',
      prioridad: 'critica'
    },
    
    ASISTENCIA_BAJA: {
      condicion: ((ausencias: number, porcentajeAsistencia: number) => 
        (porcentajeAsistencia >= umbrales.asistenciaCritica && porcentajeAsistencia < umbrales.asistenciaBaja) || 
        (ausencias > umbrales.maxAusenciasBajas && ausencias <= umbrales.maxAusenciasCriticas)
      ) as (...args: unknown[]) => boolean,
      titulo: "Asistencia Baja",
      descripcion: `El estudiante presenta una asistencia baja (${umbrales.asistenciaCritica}-${umbrales.asistenciaBaja}% o ${umbrales.maxAusenciasBajas}-${umbrales.maxAusenciasCriticas} ausencias) que puede afectar su rendimiento.`,
      tipo: 'asistencia_critica',
      prioridad: 'alta'
    },
    
    TENDENCIA_NEGATIVA: {
      condicion: ((promedioActual: number, promedioAnterior?: number) => {
        if (!promedioAnterior) return false;
        return (promedioAnterior - promedioActual) > umbrales.tendenciaNegativaMinima;
      }) as (...args: unknown[]) => boolean,
      titulo: "Tendencia Negativa en Rendimiento",
      descripcion: `Se detectó una disminución significativa (> ${umbrales.tendenciaNegativaMinima} puntos) en el rendimiento académico del estudiante.`,
      tipo: 'tendencia_negativa',
      prioridad: 'alta'
    },
    
    MEJORA_SIGNIFICATIVA: {
      condicion: ((promedioActual: number, promedioAnterior?: number) => {
        if (!promedioAnterior) return false;
        return (promedioActual - promedioAnterior) > umbrales.mejoraSignificativa;
      }) as (...args: unknown[]) => boolean,
      titulo: "Mejora Significativa Detectada",
      descripcion: `El estudiante muestra una mejora notable (> ${umbrales.mejoraSignificativa} puntos) en su rendimiento académico. ¡Felicitaciones!`,
      tipo: 'mejora_significativa',
      prioridad: 'baja'
    },
    
    MATERIAS_EN_RIESGO: {
      condicion: ((materiasEnRiesgo: string[]) => 
        materiasEnRiesgo.length >= umbrales.materiasEnRiesgoMinimas
      ) as (...args: unknown[]) => boolean,
      titulo: "Múltiples Materias en Riesgo",
      descripcion: `El estudiante presenta dificultades en ${umbrales.materiasEnRiesgoMinimas} o más materias, requiere atención integral.`,
      tipo: 'materia_riesgo',
      prioridad: 'critica'
    }
  };
}

// Función principal para generar alertas automáticas
export async function generarAlertasAutomaticas(
  datosAlumno: DatosAlumno,
  studentName: string
): Promise<AlertaAutomatica[]> {
  // Obtener umbrales personalizados de la configuración
  const umbrales = await obtenerUmbralesIA();
  const REGLAS_ALERTAS = crearReglasAlertas(umbrales);
  const alertas: AlertaAutomatica[] = [];
  
  // Calcular métricas básicas
  const promedioActual = calcularPromedioActual(datosAlumno.calificaciones);
  const promedioAnterior = calcularPromedioAnterior(datosAlumno.calificaciones, datosAlumno.periodoAnterior);
  const ausencias = calcularAusencias(datosAlumno.asistencias);
  const porcentajeAsistencia = calcularPorcentajeAsistencia(datosAlumno.asistencias);
  const materiasEnRiesgo = obtenerMateriasEnRiesgo(datosAlumno.calificaciones);
  const tendencia = promedioAnterior > 0 ? (promedioActual - promedioAnterior > 0 ? 'positiva' : 'negativa') : 'nueva';

  // Verificar cada regla
  Object.entries(REGLAS_ALERTAS).forEach(([key, regla]) => {
    let seCumple = false;
    
    switch (key) {
      case 'RENDIMIENTO_CRITICO':
      case 'RENDIMIENTO_BAJO':
        seCumple = regla.condicion(promedioActual);
        break;
        
      case 'ASISTENCIA_CRITICA':
      case 'ASISTENCIA_BAJA':
        seCumple = regla.condicion(ausencias, porcentajeAsistencia);
        break;
        
      case 'TENDENCIA_NEGATIVA':
      case 'MEJORA_SIGNIFICATIVA':
        seCumple = regla.condicion(promedioActual, promedioAnterior);
        break;
        
      case 'MATERIAS_EN_RIESGO':
        seCumple = regla.condicion(materiasEnRiesgo);
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
export async function generarAlertasParaEstudiantes(
  estudiantes: Array<{ studentId: string; studentName: string; datos: DatosAlumno }>
): Promise<AlertaAutomatica[]> {
  const alertasPromises = estudiantes.map(({ studentName, datos }) => 
    generarAlertasAutomaticas(datos, studentName)
  );
  
  const alertasArrays = await Promise.all(alertasPromises);
  return alertasArrays.flat();
}

// Funciones auxiliares

function calcularPromedioActual(calificaciones: DatosAlumno['calificaciones']): number {
  if (!calificaciones?.length) return 0;
  
  const calificacionesValidas = calificaciones.filter(c => !c.ausente && c.valor > 0);
  if (!calificacionesValidas.length) return 0;
  
  const suma = calificacionesValidas.reduce((acc, cal) => acc + cal.valor, 0);
  return suma / calificacionesValidas.length;
}

function calcularPromedioAnterior(calificaciones: DatosAlumno['calificaciones'], periodoAnterior?: string): number {
  if (!periodoAnterior || !calificaciones?.length) return 0;
  
  // Esta es una implementación simplificada
  // En un caso real, filtrarías por el período anterior
  return 0;
}

function calcularAusencias(asistencias: DatosAlumno['asistencias']): number {
  if (!asistencias?.length) return 0;
  return asistencias.filter(a => !a.present).length;
}

function calcularPorcentajeAsistencia(asistencias: DatosAlumno['asistencias']): number {
  if (!asistencias?.length) return 100;
  
  const presentes = asistencias.filter(a => a.present).length;
  return (presentes / asistencias.length) * 100;
}

function obtenerMateriasEnRiesgo(calificaciones: DatosAlumno['calificaciones']): string[] {
  if (!calificaciones?.length) return [];
  
  // Agrupar por materia y calcular promedios
  const promediosPorMateria = new Map<string, number[]>();
  
  calificaciones.forEach(cal => {
    if (!cal.ausente && cal.valor > 0) {
      if (!promediosPorMateria.has(cal.subjectId)) {
        promediosPorMateria.set(cal.subjectId, []);
      }
      promediosPorMateria.get(cal.subjectId)!.push(cal.valor);
    }
  });
  
  const materiasEnRiesgo: string[] = [];
  
  promediosPorMateria.forEach((valores, subjectId) => {
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    if (promedio < 6) { // Usar umbral fijo aquí o se puede hacer configurable también
      materiasEnRiesgo.push(subjectId);
    }
  });
  
  return materiasEnRiesgo;
}

// Funciones de utilidad para filtrar alertas

export function filtrarAlertasCriticas(alertas: AlertaAutomatica[]): AlertaAutomatica[] {
  return alertas.filter(alerta => 
    alerta.prioridad === 'critica' || alerta.prioridad === 'alta'
  );
}

export function filtrarAlertasPorTipo(alertas: AlertaAutomatica[], tipo: AlertaAutomatica['tipo']): AlertaAutomatica[] {
  return alertas.filter(alerta => alerta.tipo === tipo);
}

export function filtrarAlertasPorEstudiante(alertas: AlertaAutomatica[], studentId: string): AlertaAutomatica[] {
  return alertas.filter(alerta => alerta.studentId === studentId);
}

export function marcarAlertaComoLeida(alerta: AlertaAutomatica): AlertaAutomatica {
  return { ...alerta, leida: true };
}