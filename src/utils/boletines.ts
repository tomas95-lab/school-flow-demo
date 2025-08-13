// Cache para cálculos pesados
const calculationCache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Importar sistema de observaciones automáticas
import { generarObservacionAutomatica, type DatosAlumno, type ObservacionLimpia } from './observacionesAutomaticas';

// Función para limpiar cache expirado
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of calculationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      calculationCache.delete(key);
    }
  }
}

// Función para obtener o calcular con cache
function getCachedOrCalculate<T>(key: string, calculateFn: () => T): T {
  cleanExpiredCache();
  
  if (calculationCache.has(key)) {
    const cached = calculationCache.get(key)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.value as T;
    }
  }
  
  const result = calculateFn();
  calculationCache.set(key, {
    value: result,
    timestamp: Date.now()
  });
  
  return result;
}

// Devuelve el periodo actual (trimestre)
export function getPeriodoActual(fecha = new Date()) {
  const year = fecha.getFullYear();
  const mes = fecha.getMonth();
  let trimestre;
  if (mes >= 3 && mes < 6) trimestre = 1;
  else if (mes >= 6 && mes < 9) trimestre = 2;
  else if (mes >= 9 && mes < 12) trimestre = 3;
  return `${year}-T${trimestre}`;
}

// Devuelve el inicio del trimestre actual
export function getInicioTrimestre(fecha = new Date()) {
  const mes = fecha.getMonth();
  const year = fecha.getFullYear();
  let mesInicio = 0;
  if (mes >= 3 && mes < 6) mesInicio = 3;
  else if (mes >= 6 && mes < 9) mesInicio = 6;
  else if (mes >= 9) mesInicio = 9;
  return new Date(year, mesInicio, 1);
}

// Calcula el promedio de un array de números (optimizado)
export function calcPromedio(arr: number[]) {
  if (!arr.length) return 0;
  
  // Usar reduce con acumulador numérico para mejor rendimiento
  const suma = arr.reduce((a, b) => a + b, 0);
  return Number((suma / arr.length).toFixed(2));
}

// Filtra calificaciones del trimestre actual (optimizado)
export function filtrarCalificacionesTrimestre(calificaciones: Array<{ fecha: string }>, fechaRef?: Date) {
  const cacheKey = `trimestre_${fechaRef?.getTime() || 'current'}_${calificaciones.length}`;
  
  return getCachedOrCalculate(cacheKey, () => {
    const inicioTrimestre = getInicioTrimestre(fechaRef);
    
    // Usar filter con early return para mejor rendimiento
    return calificaciones.filter((c) => {
      if (!c.fecha) return false;
      const fechaCalif = new Date(c.fecha);
      return fechaCalif >= inicioTrimestre;
    });
  });
}

// Función optimizada para obtener promedios por materia
export function getPromedioPorMateriaPorTrimestre(
  calificaciones: Array<{ studentId: string; valor: number; subjectId: string; fecha: string }>,
  subjects: Array<{ firestoreId: string; nombre: string }>,
  alumnoId: string
) {
  const cacheKey = `promedio_materia_${alumnoId}_${subjects.length}_${calificaciones.length}`;
  
  return getCachedOrCalculate(cacheKey, () => {
    // Crear map para búsqueda más rápida
    const califsMap = new Map<string, Array<{ studentId: string; valor: number; subjectId: string; fecha: string }>>();
    
    // Agrupar calificaciones por materia una sola vez
    calificaciones.forEach((c) => {
      if (c.studentId === alumnoId && typeof c.valor === "number") {
        const key = c.subjectId;
        if (!califsMap.has(key)) {
          califsMap.set(key, []);
        }
        califsMap.get(key)!.push(c);
      }
    });

    return subjects.map((materia) => {
      const califsMateria = califsMap.get(materia.firestoreId) || [];

      const trimestres: { T1: number[]; T2: number[]; T3: number[] } = {
        T1: [],
        T2: [],
        T3: [],
      };

      // Procesar calificaciones una sola vez
      califsMateria.forEach((c) => {
        const fecha = new Date(c.fecha);
        const mes = fecha.getMonth();

        if (mes >= 3 && mes < 6) trimestres.T1.push(c.valor);
        else if (mes >= 6 && mes < 9) trimestres.T2.push(c.valor);
        else if (mes >= 9 && mes < 12) trimestres.T3.push(c.valor);
      });

      return {
        nombre: materia.nombre,
        T1: calcPromedio(trimestres.T1),
        T2: calcPromedio(trimestres.T2),
        T3: calcPromedio(trimestres.T3),
      };
    });
  });
}

// Agrupa calificaciones por materia para un alumno dado (optimizado)
export function getPromedioPorMateria(
  calificaciones: Array<{ studentId: string; valor: number; subjectId: string }>,
  subjects: Array<{ firestoreId: string; nombre: string }>,
  alumnoId: string
) {
  const cacheKey = `promedio_simple_${alumnoId}_${subjects.length}_${calificaciones.length}`;
  
  return getCachedOrCalculate(cacheKey, () => {
    // Crear map para búsqueda más rápida
    const califsMap = new Map<string, number[]>();
    
    // Agrupar calificaciones por materia
    calificaciones.forEach((c) => {
      if (c.studentId === alumnoId && typeof c.valor === "number") {
        const key = c.subjectId;
        if (!califsMap.has(key)) {
          califsMap.set(key, []);
        }
        califsMap.get(key)!.push(c.valor);
      }
    });

    return subjects.map((materia) => {
      const califs = califsMap.get(materia.firestoreId) || [];
      const promedio = califs.length > 0
        ? califs.reduce((sum, valor) => sum + valor, 0) / califs.length
        : 0;
      
      return {
        nombre: materia.nombre,
        promedio: Number(promedio.toFixed(2)),
      };
    });
  });
}

const OBSERVACIONES = {
  muyMalo: [
    "El rendimiento ha sido muy bajo, necesita un cambio urgente en su actitud.",
    "Debe comprometerse mucho más.",
    "No alcanzó los objetivos mínimos, es fundamental mayor esfuerzo.",
    "Debe replantear su dedicación para avanzar."
  ],
  aMejorar: [
    "Hay dificultades importantes, pero puede revertir la situación con constancia.",
    "Debe mejorar la dedicación para lograr mejores resultados.",
    "Se observa poco compromiso, puede y debe superarse.",
    "Los resultados no son satisfactorios, se recomienda mayor esfuerzo."
  ],
  bien: [
    "Ha tenido un desempeño aceptable, aunque puede aspirar a más.",
    "Se nota progreso, pero aún puede superarse.",
    "Cumple con lo esperado, se recomienda seguir trabajando.",
    "Buena base, podría buscar la excelencia con más dedicación."
  ],
  excelente: [
    "Excelente desempeño, felicitaciones.",
    "Superó ampliamente los objetivos, siga así.",
    "Actitud destacada, esfuerzo ejemplar.",
    "Resultados sobresalientes, demuestra gran compromiso."
  ]
};

function randomFrom(arr: string[]): string {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export function observacionPorPromedio(prom: number): string {
  if (prom > 0 && prom <= 3) {
    return randomFrom(OBSERVACIONES.muyMalo);
  } else if (prom > 3 && prom <= 6) {
    return randomFrom(OBSERVACIONES.aMejorar);
  } else if (prom > 6 && prom <= 8) {
    return randomFrom(OBSERVACIONES.bien);
  } else if (prom > 8 && prom <= 10) {
    return randomFrom(OBSERVACIONES.excelente);
  } else {
    return "Sin datos suficientes para generar una observación.";
  }
}

// Calcula el promedio total de un boletín (de un array de promedios por materia)
export function getPromedioTotal(materias: Array<{ T1?: number; T2?: number; T3?: number; promedio?: number }>) {
  let totalNotas = 0;
  let cantidadNotas = 0;

  materias.forEach((m) => {
    if (typeof m.T1 === "number") {
      totalNotas += m.T1;
      cantidadNotas++;
    }
    if (typeof m.T2 === "number") {
      totalNotas += m.T2;
      cantidadNotas++;
    }
    if (typeof m.T3 === "number") {
      totalNotas += m.T3;
      cantidadNotas++;
    }
  });

  return cantidadNotas > 0 ? Number((totalNotas / cantidadNotas).toFixed(2)) : 0;
}

// Función para generar observación automática para un boletín
export function generarObservacionAutomaticaBoletin(
  calificaciones: Array<{ valor?: number; fecha: string; subjectId: string }>,
  asistencias: Array<{ present: boolean; fecha?: string; date?: string }>,
  studentId: string,
  periodoActual: string,
  periodoAnterior?: string
): ObservacionLimpia {
  const datosAlumno: DatosAlumno = {
    studentId,
    calificaciones: calificaciones.map(cal => ({
      valor: cal.valor || 0,
      fecha: cal.fecha,
      subjectId: cal.subjectId
    })),
    asistencias: asistencias.map(asist => ({
      present: asist.present,
      fecha: asist.fecha || asist.date || new Date().toISOString()
    })),
    periodoActual,
    periodoAnterior
  };

  const observacion = generarObservacionAutomatica(datosAlumno);
  
  // Limpiar valores undefined para Firebase
  const observacionLimpia = {
    texto: observacion.texto,
    tipo: observacion.tipo,
    prioridad: observacion.prioridad,
    reglaAplicada: observacion.reglaAplicada,
    datosSoporte: {
      promedioActual: observacion.datosSoporte.promedioActual,
      ausencias: observacion.datosSoporte.ausencias,
      tendencia: observacion.datosSoporte.tendencia,
      ...(observacion.datosSoporte.promedioAnterior !== undefined && {
        promedioAnterior: observacion.datosSoporte.promedioAnterior
      })
    }
  };

  return observacionLimpia;
}

// Función para generar y descargar el PDF del boletín
type BoletinRow = {
  periodo?: string;
  Nombre?: string;
  promediototal?: number;
  estado?: string;
  alertas?: number;
  asistencia?: { porcentaje?: number; presentes?: number; total?: number };
  materias?: Array<{ nombre?: string; t1?: number; T1?: number; t2?: number; T2?: number; t3?: number; T3?: number; promedio?: number }>;
  comentario?: string;
};

export async function generarPDFBoletin(row: BoletinRow) {
  try {
    // Verificar que row tenga datos válidos
    if (!row) {
      throw new Error('No hay datos del boletín para generar el PDF');
    }

    // Importar dinámicamente las librerías
    let jsPDF, autoTable;
    
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default || jsPDFModule;
    } catch (error) {
      console.error('Error al importar jsPDF:', error);
      throw new Error('Error al cargar la librería de PDF. Inténtalo de nuevo.');
    }

    try {
      const autoTableModule = await import('jspdf-autotable');
      autoTable = autoTableModule.default || autoTableModule;
    } catch (error) {
      console.error('Error al importar jspdf-autotable:', error);
      throw new Error('Error al cargar la librería de tablas PDF. Inténtalo de nuevo.');
    }

    // Verificar que las librerías estén disponibles
    if (typeof jsPDF === 'undefined') {
      throw new Error('La librería jsPDF no está disponible');
    }

    if (typeof autoTable === 'undefined') {
      throw new Error('La librería autoTable no está disponible');
    }

  const doc = new jsPDF();
  
  // Configuración de fuentes y colores
  const primaryColor: [number, number, number] = [75, 85, 99]; // slate-600
  const secondaryColor: [number, number, number] = [156, 163, 175]; // gray-400

  // Título principal
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('BOLETÍN DE CALIFICACIONES', 105, 25, { align: 'center' });

  // Subtítulo
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${row.periodo || 'Académico'}`, 105, 35, { align: 'center' });

  // Información del estudiante
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL ESTUDIANTE', 20, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${row.Nombre || 'N/A'}`, 20, 65);
    doc.text(`Promedio General: ${(row.promediototal || 0).toFixed(1)}`, 20, 75);
  doc.text(`Estado: ${row.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}`, 20, 85);
    doc.text(`Alertas: ${row.alertas || 0}`, 20, 95);

  // Datos de asistencia si están disponibles
    if (row.asistencia && row.asistencia.porcentaje !== undefined) {
    doc.text(`Asistencia: ${row.asistencia.porcentaje}%`, 20, 105);
      doc.text(`Clases: ${row.asistencia.presentes || 0}/${row.asistencia.total || 0}`, 20, 115);
  }

  // Estadísticas
    const materias = row.materias || [];
  const stats = {
      totalMaterias: materias.length,
      materiasAprobadas: materias.filter((m: { t1?: number; T1?: number; t2?: number; T2?: number; t3?: number; T3?: number; promedio?: number }) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
      return promedio >= 7.0;
      }).length,
      materiasDestacadas: materias.filter((m: { t1?: number; T1?: number; t2?: number; T2?: number; t3?: number; T3?: number; promedio?: number }) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
      return promedio >= 9.0;
      }).length,
      materiasEnRiesgo: materias.filter((m: { t1?: number; T1?: number; t2?: number; T2?: number; t3?: number; T3?: number; promedio?: number }) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
      return promedio < 7.0;
      }).length
  };

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADÍSTICAS GENERALES', 20, 135);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Materias: ${stats.totalMaterias}`, 20, 145);
  doc.text(`Aprobadas: ${stats.materiasAprobadas}`, 20, 155);
  doc.text(`Destacadas: ${stats.materiasDestacadas}`, 20, 165);
  doc.text(`En Riesgo: ${stats.materiasEnRiesgo}`, 20, 175);

  // Tabla de calificaciones
    if (materias.length > 0) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIFICACIONES POR MATERIA', 20, 195);

  // Preparar datos para la tabla
      const tableData = materias.map((materia: { nombre?: string; t1?: number; T1?: number; t2?: number; T2?: number; t3?: number; T3?: number; promedio?: number }) => {
        // Manejar tanto T1/T2/T3 como t1/t2/t3
        const t1 = materia.t1 || materia.T1 || 0;
        const t2 = materia.t2 || materia.T2 || 0;
        const t3 = materia.t3 || materia.T3 || 0;
        const promedio = materia.promedio || (t1 + t2 + t3) / 3;
        
    return [
          materia.nombre || 'N/A',
          t1.toFixed(1),
          t2.toFixed(1),
          t3.toFixed(1),
      promedio.toFixed(1),
      promedio >= 7.0 ? 'Aprobada' : 'Reprobada'
    ];
      });

  // Generar tabla
  autoTable(doc, {
    head: [['Materia', 'T1', 'T2', 'T3', 'Promedio', 'Estado']],
    body: tableData,
    startY: 205,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 30 }
    }
  });

  // Comentario general si existe
  if (row.comentario) {
        const finalY = (doc as any).lastAutoTable?.finalY || 250;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
        doc.text('COMENTARIO GENERAL', 20, finalY + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Dividir el comentario en líneas si es muy largo
    const maxWidth = 170;
    const lines = doc.splitTextToSize(String(row.comentario), maxWidth);
        doc.text(lines, 20, finalY + 20);
      }
    } else {
      // Si no hay materias, mostrar mensaje
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CALIFICACIONES POR MATERIA', 20, 195);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No hay calificaciones disponibles para este período.', 20, 205);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento generado automáticamente - Sistema de Gestión Escolar', 105, pageHeight - 20, { align: 'center' });
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 105, pageHeight - 15, { align: 'center' });

  // Descargar el PDF
    const fileName = `Boletin_${(row.Nombre || 'Estudiante').replace(/\s+/g, '_')}_${row.periodo || 'Academico'}.pdf`;
  doc.save(fileName);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el PDF. Verifica que los datos del boletín sean válidos.');
  }
}

// Genera el PDF con el mismo diseño pero lo devuelve como Blob para poder abrir e imprimir
export async function generarPDFBoletinBlob(row: BoletinRow): Promise<{ blob: Blob; fileName: string }> {
  try {
    if (!row) {
      throw new Error('No hay datos del boletín para generar el PDF');
    }

    let jsPDF, autoTable;
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.default || jsPDFModule;
    } catch (error) {
      console.error('Error al importar jsPDF:', error);
      throw new Error('Error al cargar la librería de PDF. Inténtalo de nuevo.');
    }

    try {
      const autoTableModule = await import('jspdf-autotable');
      autoTable = autoTableModule.default || autoTableModule;
    } catch (error) {
      console.error('Error al importar jspdf-autotable:', error);
      throw new Error('Error al cargar la librería de tablas PDF. Inténtalo de nuevo.');
    }

    if (typeof jsPDF === 'undefined') {
      throw new Error('La librería jsPDF no está disponible');
    }
    if (typeof autoTable === 'undefined') {
      throw new Error('La librería autoTable no está disponible');
    }

    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [75, 85, 99];
    const secondaryColor: [number, number, number] = [156, 163, 175];

    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETÍN DE CALIFICACIONES', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${row.periodo || 'Académico'}`, 105, 35, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL ESTUDIANTE', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${row.Nombre || 'N/A'}`, 20, 65);
    doc.text(`Promedio General: ${(row.promediototal || 0).toFixed(1)}`, 20, 75);
    doc.text(`Estado: ${row.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}`, 20, 85);
    doc.text(`Alertas: ${row.alertas || 0}`, 20, 95);

    if (row.asistencia && row.asistencia.porcentaje !== undefined) {
      doc.text(`Asistencia: ${row.asistencia.porcentaje}%`, 20, 105);
      doc.text(`Clases: ${row.asistencia.presentes || 0}/${row.asistencia.total || 0}`, 20, 115);
    }

    const materias = row.materias || [];
    const stats = {
      totalMaterias: materias.length,
      materiasAprobadas: materias.filter((m: any) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
        return promedio >= 7.0;
      }).length,
      materiasDestacadas: materias.filter((m: any) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
        return promedio >= 9.0;
      }).length,
      materiasEnRiesgo: materias.filter((m: any) => {
        const t1 = m.t1 || m.T1 || 0;
        const t2 = m.t2 || m.T2 || 0;
        const t3 = m.t3 || m.T3 || 0;
        const promedio = m.promedio || (t1 + t2 + t3) / 3;
        return promedio < 7.0;
      }).length,
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADÍSTICAS GENERALES', 20, 135);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Materias: ${stats.totalMaterias}`, 20, 145);
    doc.text(`Aprobadas: ${stats.materiasAprobadas}`, 20, 155);
    doc.text(`Destacadas: ${stats.materiasDestacadas}`, 20, 165);
    doc.text(`En Riesgo: ${stats.materiasEnRiesgo}`, 20, 175);

    if (materias.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CALIFICACIONES POR MATERIA', 20, 195);

      const tableData = materias.map((materia: any) => {
        const t1 = materia.t1 || materia.T1 || 0;
        const t2 = materia.t2 || materia.T2 || 0;
        const t3 = materia.t3 || materia.T3 || 0;
        const promedio = materia.promedio || (t1 + t2 + t3) / 3;
        return [
          materia.nombre || 'N/A',
          t1.toFixed(1),
          t2.toFixed(1),
          t3.toFixed(1),
          promedio.toFixed(1),
          promedio >= 7.0 ? 'Aprobada' : 'Reprobada',
        ];
      });

      autoTable(doc, {
        head: [['Materia', 'T1', 'T2', 'T3', 'Promedio', 'Estado']],
        body: tableData,
        startY: 205,
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 30 },
        },
      });

      if (row.comentario) {
        const finalY = (doc as any).lastAutoTable?.finalY || 250;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('COMENTARIO GENERAL', 20, finalY + 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const maxWidth = 170;
        const lines = doc.splitTextToSize(String(row.comentario), maxWidth);
        doc.text(lines, 20, finalY + 20);
      }
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CALIFICACIONES POR MATERIA', 20, 195);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No hay calificaciones disponibles para este período.', 20, 205);
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento generado automáticamente - Sistema de Gestión Escolar', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 105, pageHeight - 15, { align: 'center' });

    const fileName = `Boletin_${(row.Nombre || 'Estudiante').replace(/\s+/g, '_')}_${row.periodo || 'Academico'}.pdf`;
    const blob = doc.output('blob') as Blob;
    return { blob, fileName };
  } catch (error) {
    console.error('Error al generar PDF (blob):', error);
    throw new Error('Error al generar el PDF para imprimir.');
  }
}