import { useState, useContext, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendario.css";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Filter, BookCheck, Users2, Calendar as CalendarLucide, AlertCircle, Edit, Trash2, X } from "lucide-react";
import type { EventoCalendario } from "@/types/calendario";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseFirestoreDate } from "@/utils/dateUtils";
import CreateEventoModal from "@/components/CreateEventoModal";
import EditEventoModal from "@/components/EditEventoModal";
import DeleteEventoModal from "@/components/DeleteEventoModal";
import CreateReunionModal from "@/components/CreateReunionModal";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (total: number) => `+ Ver más (${total})`
};

const eventStyleGetter = (event: EventoCalendario) => {
  const colors: Record<string, { backgroundColor: string; borderColor: string }> = {
    tarea: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    reunion: { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' },
    evento: { backgroundColor: '#10b981', borderColor: '#059669' },
    examen: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  };

  const style = colors[event.tipo] || { backgroundColor: '#6b7280', borderColor: '#4b5563' };

  return {
    style: {
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: '6px',
      color: 'white',
      padding: '2px 6px',
      fontSize: '0.875rem',
    }
  };
};

export default function CalendarioAcademico() {
  const { user } = useContext(AuthContext);

  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>('all');
  
  // Estados para los modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createReunionModalOpen, setCreateReunionModalOpen] = useState(false);
  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(null);
  const [selectedEventoData, setSelectedEventoData] = useState<any>(null);

  const { data: tareas } = useFirestoreCollection("tareas", {
    constraints: user?.role === 'alumno' && user?.uid
      ? [where('studentIds', 'array-contains', user.uid)]
      : user?.role === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    enableCache: true,
    dependencies: [user?.role, user?.uid, user?.teacherId]
  });

  const { data: reuniones } = useFirestoreCollection("reuniones_familias", {
    constraints: user?.role === 'familiar' && user?.uid
      ? [where('familyId', '==', user.uid)]
      : user?.role === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : [],
    enableCache: true,
    dependencies: [user?.role, user?.uid, user?.teacherId]
  });

  const { data: eventosEscolares } = useFirestoreCollection("eventos_escolares", {
    enableCache: true,
  });

  const eventos = useMemo(() => {
    const allEvents: EventoCalendario[] = [];

    if (tareas) {
      tareas.forEach((tarea: any) => {
        if (tarea.dueDate) {
          const dueDate = parseFirestoreDate(tarea.dueDate);
          if (dueDate) {
            allEvents.push({
              id: `tarea-${tarea.firestoreId}`,
              title: `[TAREA] ${tarea.title}`,
              start: dueDate,
              end: dueDate,
              tipo: 'tarea',
              descripcion: tarea.description,
              allDay: true,
              metadata: {
                tareaId: tarea.firestoreId,
                courseId: tarea.courseId,
                subjectId: tarea.subjectId,
                status: tarea.status,
              }
            });
          }
        }
      });
    }

    if (reuniones) {
      reuniones.forEach((reunion: any) => {
        if (reunion.date) {
          const reunionDate = parseFirestoreDate(reunion.date);
          if (reunionDate) {
            const endDate = new Date(reunionDate);
            endDate.setMinutes(endDate.getMinutes() + (reunion.duracion || 30));

            allEvents.push({
              id: `reunion-${reunion.firestoreId}`,
              title: `[REUNION] ${reunion.motivo?.substring(0, 30) || 'Reunión'}`,
              start: reunionDate,
              end: endDate,
              tipo: 'reunion',
              descripcion: reunion.motivo,
              allDay: false,
              metadata: {
                reunionId: reunion.firestoreId,
                studentId: reunion.studentId,
                status: reunion.status,
              }
            });
          }
        }
      });
    }

    if (eventosEscolares) {
      eventosEscolares.forEach((evento: any) => {
        if (evento.fecha) {
          const startDate = parseFirestoreDate(evento.fecha);
          if (startDate) {
            const endDate = evento.fechaFin ? parseFirestoreDate(evento.fechaFin) : startDate;
            
            allEvents.push({
              id: `evento-${evento.firestoreId}`,
              title: `[${evento.tipo === 'examen' ? 'EXAMEN' : 'EVENTO'}] ${evento.title}`,
              start: startDate,
              end: endDate || startDate,
              tipo: evento.tipo === 'examen' ? 'examen' : 'evento',
              descripcion: evento.descripcion,
              allDay: evento.allDay,
              metadata: {
                eventoId: evento.firestoreId,
                courseId: evento.courseId,
                subjectId: evento.subjectId,
              }
            });
          }
        }
      });
    }

    return allEvents;
  }, [tareas, reuniones, eventosEscolares]);

  const eventosFiltrados = useMemo(() => {
    if (filterTipo === 'all') return eventos;
    return eventos.filter((e: EventoCalendario) => e.tipo === filterTipo);
  }, [eventos, filterTipo]);

  const handleSelectEvent = useCallback((event: EventoCalendario) => {
    setSelectedEvent(event);
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const estadisticas = useMemo(() => {
    const stats = {
      totalEventos: eventos.length,
      tareas: eventos.filter((e: EventoCalendario) => e.tipo === 'tarea').length,
      reuniones: eventos.filter((e: EventoCalendario) => e.tipo === 'reunion').length,
      eventos: eventos.filter((e: EventoCalendario) => e.tipo === 'evento').length,
      examenes: eventos.filter((e: EventoCalendario) => e.tipo === 'examen').length,
    };
    return stats;
  }, [eventos]);

  const handleEditEvento = (evento: EventoCalendario) => {
    if (evento.metadata?.eventoId) {
      const eventoOriginal = eventosEscolares?.find(e => e.firestoreId === evento.metadata?.eventoId);
      setSelectedEventoId(evento.metadata.eventoId);
      setSelectedEventoData(eventoOriginal);
      setEditModalOpen(true);
    }
  };

  const handleDeleteEvento = (evento: EventoCalendario) => {
    if (evento.metadata?.eventoId) {
      setSelectedEventoId(evento.metadata.eventoId);
      setSelectedEventoData({ title: evento.title });
      setDeleteModalOpen(true);
    }
  };

  const handleModalSuccess = () => {
    // Los hooks se actualizarán automáticamente gracias a Firestore
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario Académico</h1>
            <p className="text-sm text-gray-600">
              Visualiza todas tus actividades escolares
            </p>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'docente') && (
          <div className="flex gap-2">
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Evento
            </Button>
            <Button onClick={() => setCreateReunionModalOpen(true)} variant="outline">
              <Users2 className="w-4 h-4 mr-2" />
              Nueva Reunión
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalEventos}</p>
              </div>
              <CalendarLucide className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tareas</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.tareas}</p>
              </div>
              <BookCheck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reuniones</p>
                <p className="text-2xl font-bold text-purple-600">{estadisticas.reuniones}</p>
              </div>
              <Users2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Exámenes</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.examenes}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendario</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="tarea">Tareas</SelectItem>
                  <SelectItem value="reunion">Reuniones</SelectItem>
                  <SelectItem value="evento">Eventos</SelectItem>
                  <SelectItem value="examen">Exámenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <span className="w-3 h-3 rounded-full bg-blue-600 mr-1"></span>
              Tareas
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <span className="w-3 h-3 rounded-full bg-purple-600 mr-1"></span>
              Reuniones
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <span className="w-3 h-3 rounded-full bg-green-600 mr-1"></span>
              Eventos
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <span className="w-3 h-3 rounded-full bg-red-600 mr-1"></span>
              Exámenes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={eventosFiltrados}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              messages={messages}
              culture="es"
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalles del Evento</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Título</p>
                <p className="font-medium text-gray-900">{selectedEvent.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <Badge>
                  {selectedEvent.tipo === 'tarea' && '📚 Tarea'}
                  {selectedEvent.tipo === 'reunion' && '👥 Reunión'}
                  {selectedEvent.tipo === 'evento' && '📅 Evento'}
                  {selectedEvent.tipo === 'examen' && '📝 Examen'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium text-gray-900">
                  {format(selectedEvent.start, "PPP 'a las' p", { locale: es })}
                </p>
              </div>
              {selectedEvent.descripcion && (
                <div>
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="text-gray-900">{selectedEvent.descripcion}</p>
                </div>
              )}
              
              {(selectedEvent.tipo === 'evento' || selectedEvent.tipo === 'examen') && 
               (user?.role === 'admin' || user?.role === 'docente') && (
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleEditEvento(selectedEvent)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteEvento(selectedEvent)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              )}
              
              {(selectedEvent.tipo === 'tarea' || selectedEvent.tipo === 'reunion') && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                  className="w-full"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <CreateEventoModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleModalSuccess}
      />
      
      <EditEventoModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleModalSuccess}
        eventoId={selectedEventoId}
        eventoData={selectedEventoData}
      />
      
      <DeleteEventoModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onSuccess={handleModalSuccess}
        eventoId={selectedEventoId}
        eventoTitle={selectedEventoData?.title}
      />

      <CreateReunionModal
        open={createReunionModalOpen}
        onOpenChange={setCreateReunionModalOpen}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

