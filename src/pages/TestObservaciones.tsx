import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Trash2 } from 'lucide-react';
import { generarObservacionAutomatica, type DatosAlumno } from '@/utils/observacionesAutomaticas';
import ObservacionAutomatica from '@/components/ObservacionAutomatica';

export default function TestObservaciones() {
  const [datosPrueba, setDatosPrueba] = useState<DatosAlumno>({
    studentId: "alumno_test_001",
    calificaciones: [
      { valor: 7, fecha: "2025-01-15", subjectId: "matematica" },
      { valor: 8, fecha: "2025-01-20", subjectId: "matematica" },
      { valor: 6, fecha: "2025-01-25", subjectId: "lengua" },
      { valor: 9, fecha: "2025-01-30", subjectId: "lengua" }
    ],
    asistencias: [
      { present: true, fecha: "2025-01-15" },
      { present: false, fecha: "2025-01-16" },
      { present: true, fecha: "2025-01-17" },
      { present: true, fecha: "2025-01-18" }
    ],
    periodoActual: "2025-T1",
    periodoAnterior: "2024-T3"
  });

  const [observacionGenerada, setObservacionGenerada] = useState<any>(null);

  const generarObservacion = () => {
    try {
      const observacion = generarObservacionAutomatica(datosPrueba);
      setObservacionGenerada(observacion);
      console.log('✅ Observación generada:', observacion);
    } catch (error) {
      console.error('❌ Error generando observación:', error);
      alert('Error generando observación: ' + error);
    }
  };

  const agregarCalificacion = () => {
    setDatosPrueba(prev => ({
      ...prev,
      calificaciones: [
        ...prev.calificaciones,
        { valor: 7, fecha: "2025-02-01", subjectId: "nueva_materia" }
      ]
    }));
  };

  const agregarAsistencia = () => {
    setDatosPrueba(prev => ({
      ...prev,
      asistencias: [
        ...prev.asistencias,
        { present: true, fecha: "2025-02-01" }
      ]
    }));
  };

  const cambiarPromedio = (nuevoPromedio: number) => {
    setDatosPrueba(prev => ({
      ...prev,
      calificaciones: prev.calificaciones.map((cal, index) => ({
        ...cal,
        valor: nuevoPromedio
      }))
    }));
  };

  const cambiarAusencias = (nuevasAusencias: number) => {
    const nuevasAsistencias: Array<{ present: boolean; fecha: string }> = [];
    for (let i = 0; i < nuevasAusencias; i++) {
      nuevasAsistencias.push({ present: false, fecha: `2025-01-${20 + i}` });
    }
    for (let i = nuevasAusencias; i < 10; i++) {
      nuevasAsistencias.push({ present: true, fecha: `2025-01-${20 + i}` });
    }
    
    setDatosPrueba(prev => ({
      ...prev,
      asistencias: nuevasAsistencias
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Prueba del Sistema de Observaciones Automáticas
          </h1>
          <p className="text-gray-600">
            Prueba las diferentes reglas del sistema con datos simulados
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Panel de Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Promedio General</Label>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => cambiarPromedio(4)} variant="outline">
                    Bajo (4)
                  </Button>
                  <Button size="sm" onClick={() => cambiarPromedio(6)} variant="outline">
                    Medio (6)
                  </Button>
                  <Button size="sm" onClick={() => cambiarPromedio(8)} variant="outline">
                    Alto (8)
                  </Button>
                  <Button size="sm" onClick={() => cambiarPromedio(10)} variant="outline">
                    Excelente (10)
                  </Button>
                </div>
              </div>

              <div>
                <Label>Ausencias</Label>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => cambiarAusencias(0)} variant="outline">
                    Sin ausencias
                  </Button>
                  <Button size="sm" onClick={() => cambiarAusencias(3)} variant="outline">
                    3 ausencias
                  </Button>
                  <Button size="sm" onClick={() => cambiarAusencias(5)} variant="outline">
                    5 ausencias
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={agregarCalificacion} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Calificación
                </Button>
                <Button onClick={agregarAsistencia} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Asistencia
                </Button>
              </div>

              <Button onClick={generarObservacion} className="w-full">
                <Brain className="h-4 w-4 mr-2" />
                Generar Observación Automática
              </Button>
            </CardContent>
          </Card>

          {/* Datos Actuales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de Prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Calificaciones ({datosPrueba.calificaciones.length})</Label>
                <div className="mt-2 space-y-1">
                  {datosPrueba.calificaciones.map((cal, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>Calificación {index + 1}: {cal.valor}</span>
                      <span className="text-gray-500">{cal.fecha}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Asistencias ({datosPrueba.asistencias.length})</Label>
                <div className="mt-2 space-y-1">
                  {datosPrueba.asistencias.slice(0, 5).map((asist, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>Clase {index + 1}</span>
                      <Badge variant={asist.present ? "default" : "destructive"}>
                        {asist.present ? "Presente" : "Ausente"}
                      </Badge>
                    </div>
                  ))}
                  {datosPrueba.asistencias.length > 5 && (
                    <div className="text-sm text-gray-500 text-center">
                      ... y {datosPrueba.asistencias.length - 5} más
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Promedio Actual</Label>
                  <div className="font-semibold">
                    {(datosPrueba.calificaciones.reduce((sum, cal) => sum + cal.valor, 0) / datosPrueba.calificaciones.length).toFixed(1)}
                  </div>
                </div>
                <div>
                  <Label>Ausencias</Label>
                  <div className="font-semibold">
                    {datosPrueba.asistencias.filter(a => !a.present).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado */}
        {observacionGenerada && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Brain className="h-5 w-5" />
                Observación Generada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ObservacionAutomatica 
                observacion={observacionGenerada}
                showDetails={true}
              />
              
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h4 className="font-semibold mb-2">Datos de Soporte:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(observacionGenerada.datosSoporte, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Escenarios Predefinidos */}
        <Card>
          <CardHeader>
            <CardTitle>Escenarios de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_001",
                    calificaciones: [
                      { valor: 4, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 3, fecha: "2025-01-20", subjectId: "matematica" },
                      { valor: 5, fecha: "2025-01-25", subjectId: "lengua" }
                    ],
                    asistencias: [
                      { present: true, fecha: "2025-01-15" },
                      { present: false, fecha: "2025-01-16" },
                      { present: true, fecha: "2025-01-17" }
                    ],
                    periodoActual: "2025-T1",
                    periodoAnterior: "2024-T3"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                                 <div className="font-semibold">Rendimiento Insuficiente</div>
                 <div className="text-sm text-gray-600">Promedio &lt; 6</div>
              </Button>

              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_002",
                    calificaciones: [
                      { valor: 6, fecha: "2024-10-15", subjectId: "matematica" },
                      { valor: 5, fecha: "2024-10-20", subjectId: "matematica" },
                      { valor: 8, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 9, fecha: "2025-01-20", subjectId: "matematica" }
                    ],
                    asistencias: [
                      { present: true, fecha: "2025-01-15" },
                      { present: true, fecha: "2025-01-16" },
                      { present: true, fecha: "2025-01-17" }
                    ],
                    periodoActual: "2025-T1",
                    periodoAnterior: "2024-T3"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                                 <div className="font-semibold">Mejora Significativa</div>
                 <div className="text-sm text-gray-600">Mejora &gt; 1 punto</div>
              </Button>

              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_003",
                    calificaciones: [
                      { valor: 9, fecha: "2024-10-15", subjectId: "matematica" },
                      { valor: 8, fecha: "2024-10-20", subjectId: "matematica" },
                      { valor: 6, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 5, fecha: "2025-01-20", subjectId: "matematica" }
                    ],
                    asistencias: [
                      { present: true, fecha: "2025-01-15" },
                      { present: true, fecha: "2025-01-16" },
                      { present: true, fecha: "2025-01-17" }
                    ],
                    periodoActual: "2025-T1",
                    periodoAnterior: "2024-T3"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                                 <div className="font-semibold">Descenso en Rendimiento</div>
                 <div className="text-sm text-gray-600">Bajada &gt; 1 punto</div>
              </Button>

              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_004",
                    calificaciones: [
                      { valor: 7, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 8, fecha: "2025-01-20", subjectId: "matematica" }
                    ],
                    asistencias: [
                      { present: false, fecha: "2025-01-15" },
                      { present: false, fecha: "2025-01-16" },
                      { present: false, fecha: "2025-01-17" },
                      { present: false, fecha: "2025-01-18" },
                      { present: true, fecha: "2025-01-19" }
                    ],
                    periodoActual: "2025-T1"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                                 <div className="font-semibold">Ausencias Reiteradas</div>
                 <div className="text-sm text-gray-600">&gt; 3 ausencias</div>
              </Button>

              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_005",
                    calificaciones: [
                      { valor: 9, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 10, fecha: "2025-01-20", subjectId: "matematica" },
                      { valor: 9, fecha: "2025-01-25", subjectId: "lengua" },
                      { valor: 10, fecha: "2025-01-30", subjectId: "lengua" }
                    ],
                    asistencias: [
                      { present: true, fecha: "2025-01-15" },
                      { present: true, fecha: "2025-01-16" },
                      { present: true, fecha: "2025-01-17" },
                      { present: true, fecha: "2025-01-18" }
                    ],
                    periodoActual: "2025-T1"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                                 <div className="font-semibold">Excelente Desempeño</div>
                 <div className="text-sm text-gray-600">Promedio &gt; 8</div>
              </Button>

              <Button 
                onClick={() => {
                  setDatosPrueba({
                    studentId: "alumno_006",
                    calificaciones: [
                      { valor: 7, fecha: "2025-01-15", subjectId: "matematica" },
                      { valor: 7, fecha: "2025-01-20", subjectId: "matematica" }
                    ],
                    asistencias: [
                      { present: true, fecha: "2025-01-15" },
                      { present: true, fecha: "2025-01-16" },
                      { present: true, fecha: "2025-01-17" }
                    ],
                    periodoActual: "2025-T1"
                  });
                }}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-semibold">Observación Neutral</div>
                <div className="text-sm text-gray-600">Sin reglas específicas</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
