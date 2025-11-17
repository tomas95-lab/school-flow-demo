import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Database, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InitCollectionsButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ name: string; success: boolean; message: string }[]>([]);

  if (user?.role !== 'admin') {
    return null;
  }

  const collectionsToInit = [
    { name: "tareas", icon: "📚" },
    { name: "conversaciones_familias", icon: "💬" },
    { name: "mensajes_familias", icon: "📩" },
    { name: "reuniones_familias", icon: "📅" }
  ];

  const initCollections = async () => {
    setLoading(true);
    setResults([]);
    const newResults: typeof results = [];

    for (const col of collectionsToInit) {
      try {
        await addDoc(collection(db, col.name), {
          _init: true,
          createdAt: serverTimestamp(),
          message: `Colección ${col.name} inicializada`
        });
        newResults.push({
          name: `${col.icon} ${col.name}`,
          success: true,
          message: 'Creada exitosamente'
        });
      } catch (error: any) {
        newResults.push({
          name: `${col.icon} ${col.name}`,
          success: false,
          message: error.message || 'Error desconocido'
        });
      }
      setResults([...newResults]);
    }

    setLoading(false);
  };

  const populateWithDemoData = async () => {
    setLoading(true);
    setResults([]);
    const newResults: typeof results = [];

    try {
      const tareas = [
        {
          title: "Trabajo Práctico N°1 - Matemáticas",
          description: "Resolver los ejercicios del capítulo 3: Ecuaciones lineales. Incluir desarrollo completo.",
          courseId: "demo-course-1",
          subjectId: "demo-subject-1",
          teacherId: "demo-teacher-1",
          studentIds: ["demo-student-1", "demo-student-2"],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          points: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Ensayo sobre la Revolución Francesa",
          description: "Escribir un ensayo de 3 páginas sobre las causas y consecuencias de la Revolución Francesa.",
          courseId: "demo-course-1",
          subjectId: "demo-subject-2",
          teacherId: "demo-teacher-1",
          studentIds: ["demo-student-1", "demo-student-2"],
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          points: 150,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Experimento de Física - Movimiento",
          description: "Realizar el experimento de caída libre y presentar informe con gráficos.",
          courseId: "demo-course-1",
          subjectId: "demo-subject-3",
          teacherId: "demo-teacher-1",
          studentIds: ["demo-student-1", "demo-student-2"],
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          points: 120,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Lectura comprensiva - El Quijote",
          description: "Leer los capítulos 1-5 y responder las preguntas del cuestionario.",
          courseId: "demo-course-1",
          subjectId: "demo-subject-2",
          teacherId: "demo-teacher-1",
          studentIds: ["demo-student-1", "demo-student-2"],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          points: 80,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Proyecto Ciencias Naturales",
          description: "Investigar sobre un ecosistema local y crear una presentación.",
          courseId: "demo-course-2",
          subjectId: "demo-subject-3",
          teacherId: "demo-teacher-2",
          studentIds: ["demo-student-3"],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          points: 200,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          title: "Ejercicios de Geometría",
          description: "Completar la guía de ejercicios sobre triángulos y ángulos.",
          courseId: "demo-course-1",
          subjectId: "demo-subject-1",
          teacherId: "demo-teacher-1",
          studentIds: ["demo-student-1", "demo-student-2"],
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "closed",
          points: 60,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const tarea of tareas) {
        await addDoc(collection(db, 'tareas'), tarea);
      }
      newResults.push({
        name: '📚 tareas',
        success: true,
        message: `${tareas.length} tareas creadas`
      });
      setResults([...newResults]);

      const conversaciones = [
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-1",
          status: "abierta",
          asunto: "Consulta sobre rendimiento académico",
          ultimoMensaje: "Buenos días, quisiera hablar sobre las últimas calificaciones...",
          fecha: new Date().toISOString(),
          leido: false,
          prioridad: "media",
          createdAt: new Date().toISOString()
        },
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-2",
          status: "abierta",
          asunto: "Seguimiento de asistencias",
          ultimoMensaje: "Hola, quería consultar sobre las inasistencias recientes...",
          fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          leido: true,
          prioridad: "alta",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-1",
          status: "abierta",
          asunto: "Dificultades con las tareas de matemáticas",
          ultimoMensaje: "Mi hijo necesita apoyo adicional en matemáticas...",
          fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          leido: true,
          prioridad: "alta",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          teacherId: "demo-teacher-2",
          familyId: "demo-parent-1",
          studentId: "demo-student-3",
          status: "cerrada",
          asunto: "Felicitaciones por el progreso",
          ultimoMensaje: "Gracias por el apoyo, veo mucha mejora en mi hijo",
          fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          leido: true,
          prioridad: "baja",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const conversacionIds: string[] = [];
      for (const conv of conversaciones) {
        const docRef = await addDoc(collection(db, 'conversaciones_familias'), conv);
        conversacionIds.push(docRef.id);
      }
      newResults.push({
        name: '💬 conversaciones_familias',
        success: true,
        message: `${conversaciones.length} conversaciones creadas`
      });
      setResults([...newResults]);

      if (conversacionIds.length > 0) {
        const mensajes = [
          {
            conversacionId: conversacionIds[0],
            senderId: "demo-parent-1",
            senderRole: "familiar",
            text: "Buenos días profesor, quisiera hablar sobre el rendimiento de mi hijo en matemáticas.",
            timestamp: serverTimestamp()
          },
          {
            conversacionId: conversacionIds[0],
            senderId: "demo-teacher-1",
            senderRole: "docente",
            text: "Buenos días! Con gusto. Su hijo está progresando bien, aunque necesita reforzar algunos conceptos.",
            timestamp: serverTimestamp()
          },
          {
            conversacionId: conversacionIds[0],
            senderId: "demo-parent-1",
            senderRole: "familiar",
            text: "¿Hay algo específico en lo que pueda ayudarlo desde casa?",
            timestamp: serverTimestamp()
          },
          {
            conversacionId: conversacionIds[0],
            senderId: "demo-teacher-1",
            senderRole: "docente",
            text: "Sí, estaría bien que practicaran juntos las ecuaciones lineales. Le enviaré una guía adicional.",
            timestamp: serverTimestamp()
          }
        ];

        for (const mensaje of mensajes) {
          await addDoc(collection(db, 'mensajes_familias'), mensaje);
        }
        newResults.push({
          name: '📩 mensajes_familias',
          success: true,
          message: `${mensajes.length} mensajes creados`
        });
        setResults([...newResults]);
      }

      const reuniones = [
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-1",
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          motivo: "Reunión de seguimiento académico del primer trimestre",
          notas: "",
          duracion: 30,
          modalidad: "presencial",
          createdAt: new Date().toISOString()
        },
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-2",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          motivo: "Charla sobre comportamiento en clase",
          notas: "",
          duracion: 45,
          modalidad: "virtual",
          createdAt: new Date().toISOString()
        },
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-1",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          motivo: "Reunión inicial del año lectivo",
          notas: "Reunión exitosa. Se establecieron objetivos del año.",
          duracion: 30,
          modalidad: "presencial",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          teacherId: "demo-teacher-2",
          familyId: "demo-parent-1",
          studentId: "demo-student-3",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          motivo: "Planificación de apoyo en ciencias",
          notas: "",
          duracion: 30,
          modalidad: "presencial",
          createdAt: new Date().toISOString()
        },
        {
          teacherId: "demo-teacher-1",
          familyId: "demo-parent-1",
          studentId: "demo-student-1",
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          motivo: "Revisión de progreso mensual",
          notas: "Se acordó trabajar más en lectura comprensiva.",
          duracion: 30,
          modalidad: "virtual",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const reunion of reuniones) {
        await addDoc(collection(db, 'reuniones_familias'), reunion);
      }
      newResults.push({
        name: '📅 reuniones_familias',
        success: true,
        message: `${reuniones.length} reuniones creadas`
      });
      setResults([...newResults]);

    } catch (error: any) {
      newResults.push({
        name: '❌ Error',
        success: false,
        message: error.message || 'Error al poblar datos'
      });
      setResults([...newResults]);
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="h-4 w-4 mr-2" />
          Inicializar Colecciones
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestionar Colecciones de Firestore</DialogTitle>
          <DialogDescription>
            Administra las colecciones de Tareas y Comunicación con Familias
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="init" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="init">
              <Database className="h-4 w-4 mr-2" />
              Inicializar
            </TabsTrigger>
            <TabsTrigger value="populate">
              <Sparkles className="h-4 w-4 mr-2" />
              Poblar con Datos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="init" className="space-y-4">
            <div className="text-sm text-gray-600">
              Crea las siguientes colecciones vacías:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {collectionsToInit.map(col => (
                  <li key={col.name}>{col.icon} {col.name}</li>
                ))}
              </ul>
            </div>
            
            {results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{result.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{result.message}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={initCollections} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Inicializar Colecciones
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="populate" className="space-y-4">
            <div className="text-sm text-gray-600">
              Llena las colecciones con datos de ejemplo realistas usando IDs existentes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>📚 6 tareas (5 activas, 1 cerrada) - 2 cursos, 2 docentes</li>
                <li>💬 4 conversaciones - 2 docentes, 3 estudiantes</li>
                <li>📩 4 mensajes en conversación real</li>
                <li>📅 5 reuniones (3 programadas, 2 completadas)</li>
              </ul>
              <p className="mt-2 text-xs text-amber-600">
                ✓ Usa solo datos existentes en Firestore
              </p>
            </div>
            
            {results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{result.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{result.message}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={populateWithDemoData} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Poblando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Poblar con Datos Demo
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

