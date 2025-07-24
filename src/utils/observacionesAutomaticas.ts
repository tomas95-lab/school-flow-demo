// Sistema de Observaciones Automáticas Basadas en Datos (Pseudo-IA)
// Analiza calificaciones, asistencias y tendencias para generar observaciones inteligentes

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

export interface ObservacionGenerada {
  texto: string;
  tipo: 'rendimiento' | 'tendencia' | 'asistencia' | 'excelencia' | 'neutral';
  prioridad: 'alta' | 'media' | 'baja';
  reglaAplicada: string;
  datosSoporte: {
    promedioActual: number;
    promedioAnterior?: number;
    ausencias: number;
    tendencia: 'mejora' | 'descenso' | 'estable' | 'sin_datos';
  };
}

// Tipo para observaciones limpias (sin valores undefined)
export interface ObservacionLimpia {
  texto: string;
  tipo: 'rendimiento' | 'tendencia' | 'asistencia' | 'excelencia' | 'neutral';
  prioridad: 'alta' | 'media' | 'baja';
  reglaAplicada: string;
  datosSoporte: {
    promedioActual: number;
    ausencias: number;
    tendencia: 'mejora' | 'descenso' | 'estable' | 'sin_datos';
    promedioAnterior?: number;
  };
}

// Reglas de observación
const REGLAS_OBSERVACION = {
  RENDIMIENTO_INSUFICIENTE: {
    condicion: (promedioActual: number) => promedioActual < 6,
    mensaje: "Rendimiento académico insuficiente. Se recomienda intervención pedagógica.",
    tipo: 'rendimiento' as const,
    prioridad: 'alta' as const
  },
  MEJORA_SIGNIFICATIVA: {
    condicion: (promedioActual: number, promedioAnterior?: number) => 
      promedioAnterior && (promedioActual - promedioAnterior) > 1,
    mensaje: "Mejora significativa observada. Seguir reforzando hábitos de estudio.",
    tipo: 'tendencia' as const,
    prioridad: 'media' as const
  },
  DESCENSO_RENDIMIENTO: {
    condicion: (promedioActual: number, promedioAnterior?: number) => 
      promedioAnterior && (promedioAnterior - promedioActual) > 1,
    mensaje: "Descenso en el rendimiento. Se recomienda revisar dificultades y reforzar acompañamiento.",
    tipo: 'tendencia' as const,
    prioridad: 'alta' as const
  },
  AUSENCIAS_REITERADAS: {
    condicion: (ausencias?: number) => 
      (ausencias || 0) > 3,
    mensaje: "Ausencias reiteradas detectadas. Sugerimos comunicación con la familia.",
    tipo: 'asistencia' as const,
    prioridad: 'media' as const
  },
  AUSENCIAS_CRITICAS: {
    condicion: (ausencias?: number) => 
      (ausencias || 0) > 5,
    mensaje: "Ausencias críticas detectadas. Se requiere intervención inmediata y comunicación urgente con la familia.",
    tipo: 'asistencia' as const,
    prioridad: 'alta' as const
  },
  ASISTENCIA_PERFECTA: {
    condicion: (datos: DatosAlumno, ausencias?: number) => 
      (ausencias || 0) === 0 && datos.asistencias.length > 0,
    mensaje: "Asistencia perfecta. Felicitaciones por el compromiso y responsabilidad demostrados.",
    tipo: 'asistencia' as const,
    prioridad: 'baja' as const
  },
  MEJORA_ASISTENCIA: {
    condicion: (datos: DatosAlumno, ausencias?: number) => {
      // Comparar ausencias del período actual vs anterior (simplificado)
      const ausenciasActuales = ausencias || 0;
      const totalAsistencias = datos.asistencias.length;
      const porcentajeAsistencia = totalAsistencias > 0 ? ((totalAsistencias - ausenciasActuales) / totalAsistencias) * 100 : 0;
      return porcentajeAsistencia >= 90 && ausenciasActuales <= 1;
    },
    mensaje: "Excelente mejora en la asistencia. Mantener esta actitud responsable.",
    tipo: 'asistencia' as const,
    prioridad: 'media' as const
  },
  EXCELENTE_DESEMPEÑO: {
    condicion: (promedioActual: number, promedioAnterior?: number) => 
      promedioActual > 8 && (!promedioAnterior || promedioActual >= promedioAnterior),
    mensaje: "Excelente desempeño académico. Felicitaciones por el esfuerzo sostenido.",
    tipo: 'excelencia' as const,
    prioridad: 'baja' as const
  }
};

// Función principal para generar observaciones automáticas
export function generarObservacionAutomatica(datos: DatosAlumno): ObservacionGenerada {
  console.log(`🔍 Analizando datos para alumno ${datos.studentId}...`);
  
  // Calcular métricas básicas
  const promedioActual = calcularPromedioActual(datos.calificaciones);
  const promedioAnterior = calcularPromedioAnterior(datos.calificaciones, datos.periodoAnterior);
  const ausencias = contarAusencias(datos.asistencias);
  const tendencia = determinarTendencia(promedioActual, promedioAnterior);
  
  console.log(`📊 Métricas calculadas:`, {
    promedioActual,
    promedioAnterior,
    ausencias,
    tendencia
  });

  // Aplicar reglas en orden de prioridad
  const observacionesAplicables: Array<{
    regla: string;
    mensaje: string;
    tipo: ObservacionGenerada['tipo'];
    prioridad: ObservacionGenerada['prioridad'];
  }> = [];

  // Verificar cada regla
  Object.entries(REGLAS_OBSERVACION).forEach(([nombreRegla, regla]) => {
    let seCumple = false;
    
    switch (nombreRegla) {
      case 'RENDIMIENTO_INSUFICIENTE':
      case 'EXCELENTE_DESEMPEÑO':
        seCumple = (regla.condicion as any)(datos, promedioActual, promedioAnterior);
        break;
      case 'MEJORA_SIGNIFICATIVA':
        seCumple = (regla.condicion as any)(datos, promedioActual, promedioAnterior);
        break;
      case 'DESCENSO_RENDIMIENTO':
        seCumple = (regla.condicion as any)(promedioActual, promedioAnterior);
        break;
      case 'AUSENCIAS_REITERADAS':
      case 'AUSENCIAS_CRITICAS':
        seCumple = (regla.condicion as any)(ausencias);
        break;
      case 'ASISTENCIA_PERFECTA':
      case 'MEJORA_ASISTENCIA':
        seCumple = (regla.condicion as any)(datos, ausencias);
        break;
    }
    
    if (seCumple) {
      observacionesAplicables.push({
        regla: nombreRegla,
        mensaje: regla.mensaje,
        tipo: regla.tipo,
        prioridad: regla.prioridad
      });
      console.log(`✅ Regla aplicada: ${nombreRegla}`);
    }
  });

  // Seleccionar la observación más relevante (prioridad alta > media > baja)
  const prioridades = { alta: 3, media: 2, baja: 1 };
  const observacionSeleccionada = observacionesAplicables.sort((a, b) => 
    prioridades[b.prioridad] - prioridades[a.prioridad]
  )[0];

  if (observacionSeleccionada) {
    console.log(`🎯 Observación seleccionada: ${observacionSeleccionada.regla}`);
    
    return {
      texto: observacionSeleccionada.mensaje,
      tipo: observacionSeleccionada.tipo,
      prioridad: observacionSeleccionada.prioridad,
      reglaAplicada: observacionSeleccionada.regla,
      datosSoporte: {
        promedioActual,
        promedioAnterior,
        ausencias,
        tendencia
      }
    };
  }

  // Si no se cumple ninguna regla específica
  console.log(`ℹ️ No se aplicaron reglas específicas, usando observación neutral`);
  
  return {
    texto: "Sin observaciones relevantes en este período.",
    tipo: 'neutral',
    prioridad: 'baja',
    reglaAplicada: 'SIN_REGLAS_ESPECIFICAS',
    datosSoporte: {
      promedioActual,
      promedioAnterior,
      ausencias,
      tendencia
    }
  };
}

// Función para calcular el promedio actual
function calcularPromedioActual(calificaciones: DatosAlumno['calificaciones']): number {
  if (!calificaciones.length) return 0;
  
  const valores = calificaciones
    .filter(cal => typeof cal.valor === 'number' && cal.valor > 0)
    .map(cal => cal.valor);
  
  if (!valores.length) return 0;
  
  const promedio = valores.reduce((sum, valor) => sum + valor, 0) / valores.length;
  return Number(promedio.toFixed(2));
}

// Función para calcular el promedio del período anterior
function calcularPromedioAnterior(
  calificaciones: DatosAlumno['calificaciones'], 
  periodoAnterior?: string
): number | undefined {
  if (!periodoAnterior || !calificaciones.length) return undefined;
  
  // Filtrar calificaciones del período anterior
  const calificacionesAnteriores = calificaciones.filter(cal => {
    const fecha = new Date(cal.fecha);
    const periodoCal = obtenerPeriodo(fecha);
    return periodoCal === periodoAnterior;
  });
  
  if (!calificacionesAnteriores.length) return undefined;
  
  const valores = calificacionesAnteriores
    .filter(cal => typeof cal.valor === 'number' && cal.valor > 0)
    .map(cal => cal.valor);
  
  if (!valores.length) return undefined;
  
  const promedio = valores.reduce((sum, valor) => sum + valor, 0) / valores.length;
  return Number(promedio.toFixed(2));
}

// Función para contar ausencias
function contarAusencias(asistencias: DatosAlumno['asistencias']): number {
  return asistencias.filter(asist => !asist.present).length;
}

// Función para determinar la tendencia
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

// Función para obtener el período de una fecha
function obtenerPeriodo(fecha: Date): string {
  const year = fecha.getFullYear();
  const mes = fecha.getMonth();
  
  let trimestre;
  if (mes >= 3 && mes < 6) trimestre = 1;
  else if (mes >= 6 && mes < 9) trimestre = 2;
  else if (mes >= 9 && mes < 12) trimestre = 3;
  else trimestre = 1; // Enero-Febrero se considera T1 del año anterior
  
  return `${year}-T${trimestre}`;
}

// Función para generar observaciones específicas por materia
export function generarObservacionPorMateria(
  calificacionesMateria: Array<{ valor: number; fecha: string; subjectId?: string }>,
  nombreMateria: string
): string {
  if (!calificacionesMateria.length) {
    return "Sin calificaciones registradas en esta materia.";
  }
  
  const promedio = calcularPromedioActual(calificacionesMateria as Array<{ valor: number; fecha: string; subjectId: string }>);
  const cantidadNotas = calificacionesMateria.length;
  
  // Analizar tendencia en la materia
  const calificacionesOrdenadas = calificacionesMateria
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  
  const primeraMitad = calificacionesOrdenadas.slice(0, Math.ceil(cantidadNotas / 2));
  const segundaMitad = calificacionesOrdenadas.slice(Math.ceil(cantidadNotas / 2));
  
  const promedioPrimeraMitad = primeraMitad.length ? 
    primeraMitad.reduce((sum, cal) => sum + cal.valor, 0) / primeraMitad.length : 0;
  const promedioSegundaMitad = segundaMitad.length ? 
    segundaMitad.reduce((sum, cal) => sum + cal.valor, 0) / segundaMitad.length : 0;
  
  let observacion = `Promedio en ${nombreMateria}: ${promedio.toFixed(1)}. `;
  
  if (promedio < 6) {
    observacion += "Rendimiento insuficiente. Se requiere mayor esfuerzo y apoyo.";
  } else if (promedio < 7) {
    observacion += "Rendimiento a mejorar. Se recomienda reforzar contenidos.";
  } else if (promedio < 8) {
    observacion += "Buen rendimiento. Mantener el esfuerzo para mejorar.";
  } else if (promedio < 9) {
    observacion += "Excelente rendimiento. Felicitaciones por el trabajo realizado.";
  } else {
    observacion += "Rendimiento sobresaliente. Demuestra gran dominio de la materia.";
  }
  
  // Agregar información sobre tendencia si hay suficientes notas
  if (cantidadNotas >= 4 && primeraMitad.length > 0 && segundaMitad.length > 0) {
    const diferencia = promedioSegundaMitad - promedioPrimeraMitad;
    if (diferencia > 0.5) {
      observacion += " Se observa mejora en el rendimiento.";
    } else if (diferencia < -0.5) {
      observacion += " Se observa descenso en el rendimiento.";
    } else {
      observacion += " El rendimiento se mantiene estable.";
    }
  }
  
  return observacion;
}

// Función para generar resumen de observaciones múltiples
export function generarResumenObservaciones(observaciones: ObservacionGenerada[]): string {
  if (!observaciones.length) {
    return "Sin observaciones disponibles.";
  }
  
  const observacionesPorTipo = observaciones.reduce((acc, obs) => {
    if (!acc[obs.tipo]) acc[obs.tipo] = [];
    acc[obs.tipo].push(obs);
    return acc;
  }, {} as Record<string, ObservacionGenerada[]>);
  
  let resumen = "Resumen de observaciones:\n\n";
  
  // Priorizar observaciones de alta prioridad
  const observacionesAltaPrioridad = observaciones.filter(obs => obs.prioridad === 'alta');
  if (observacionesAltaPrioridad.length > 0) {
    resumen += "⚠️ ATENCIÓN REQUERIDA:\n";
    observacionesAltaPrioridad.forEach(obs => {
      resumen += `• ${obs.texto}\n`;
    });
    resumen += "\n";
  }
  
  // Observaciones de rendimiento
  if (observacionesPorTipo.rendimiento?.length) {
    resumen += "📊 RENDIMIENTO ACADÉMICO:\n";
    observacionesPorTipo.rendimiento.forEach(obs => {
      resumen += `• ${obs.texto}\n`;
    });
    resumen += "\n";
  }
  
  // Observaciones de tendencia
  if (observacionesPorTipo.tendencia?.length) {
    resumen += "📈 TENDENCIAS:\n";
    observacionesPorTipo.tendencia.forEach(obs => {
      resumen += `• ${obs.texto}\n`;
    });
    resumen += "\n";
  }
  
  // Observaciones de asistencia
  if (observacionesPorTipo.asistencia?.length) {
    resumen += "📅 ASISTENCIA:\n";
    observacionesPorTipo.asistencia.forEach(obs => {
      resumen += `• ${obs.texto}\n`;
    });
    resumen += "\n";
  }
  
  // Observaciones de excelencia
  if (observacionesPorTipo.excelencia?.length) {
    resumen += "🏆 LOGROS:\n";
    observacionesPorTipo.excelencia.forEach(obs => {
      resumen += `• ${obs.texto}\n`;
    });
    resumen += "\n";
  }
  
  return resumen.trim();
}

// Función para validar datos de entrada
export function validarDatosAlumno(datos: unknown): datos is DatosAlumno {
  return Boolean(
    datos &&
    typeof datos === 'object' &&
    datos !== null &&
    'studentId' in datos &&
    typeof (datos as any).studentId === 'string' &&
    'calificaciones' in datos &&
    Array.isArray((datos as any).calificaciones) &&
    'asistencias' in datos &&
    Array.isArray((datos as any).asistencias) &&
    'periodoActual' in datos &&
    typeof (datos as any).periodoActual === 'string'
  );
}

// Función para obtener estadísticas detalladas
export function obtenerEstadisticasDetalladas(datos: DatosAlumno) {
  const promedioActual = calcularPromedioActual(datos.calificaciones);
  const promedioAnterior = calcularPromedioAnterior(datos.calificaciones, datos.periodoAnterior);
  const ausencias = contarAusencias(datos.asistencias);
  const tendencia = determinarTendencia(promedioActual, promedioAnterior);
  
  // Calcular estadísticas adicionales
  const calificacionesValidas = datos.calificaciones.filter(cal => typeof cal.valor === 'number' && cal.valor > 0);
  const aprobadas = calificacionesValidas.filter(cal => cal.valor >= 7).length;
  const reprobadas = calificacionesValidas.length - aprobadas;
  const porcentajeAprobacion = calificacionesValidas.length > 0 ? 
    (aprobadas / calificacionesValidas.length) * 100 : 0;
  
  const totalAsistencias = datos.asistencias.length;
  const presentes = datos.asistencias.filter(asist => asist.present).length;
  const porcentajeAsistencia = totalAsistencias > 0 ? 
    (presentes / totalAsistencias) * 100 : 0;
  
  return {
    promedioActual,
    promedioAnterior,
    tendencia,
    ausencias,
    totalAsistencias,
    presentes,
    porcentajeAsistencia,
    totalCalificaciones: calificacionesValidas.length,
    aprobadas,
    reprobadas,
    porcentajeAprobacion,
    calificacionesRecientes: calificacionesValidas.slice(-5).map(cal => cal.valor)
  };
} 
