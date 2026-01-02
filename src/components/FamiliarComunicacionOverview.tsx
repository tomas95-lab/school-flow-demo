import { useContext, useMemo } from "react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { AuthContext } from "@/context/AuthContext";
import { where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Video, 
  Bell,
  Calendar,
  Clock,
  BookOpen,
  Award
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatRelativeTime, formatDate } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";

interface Conversacion {
  firestoreId: string;
  familiarId: string;
  teacherId: string;
  studentId: string;
  asunto: string;
  ultimoMensaje: string;
  fecha: string;
  leido: boolean;
  prioridad: 'baja' | 'media' | 'alta';
  status: 'abierta' | 'cerrada';
}

interface Reunion {
  firestoreId: string;
  familiarId: string;
  teacherId: string;
  studentId: string;
  fecha: string;
  motivo: string;
  status: 'programada' | 'realizada' | 'cancelada';
}

export default function FamiliarComunicacionOverview() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { data: conversaciones } = useFirestoreCollection<Conversacion>("conversaciones_familias", {
    constraints: user?.uid 
      ? [where('familiarId', '==', user.uid)]
      : [],
    enableCache: true,
    dependencies: [user?.uid]
  });

  const { data: reuniones } = useFirestoreCollection<Reunion>("reuniones_familias", {
    constraints: user?.uid 
      ? [where('familiarId', '==', user.uid)]
      : [],
    enableCache: true,
    dependencies: [user?.uid]
  });

  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true });

  const stats = useMemo(() => {
    if (!conversaciones || !reuniones) return { 
      total: 0, 
      noLeidas: 0, 
      reunionesPendientes: 0, 
      mensajesSinResponder: 0
    };

    const now = new Date();

    return {
      total: conversaciones.length,
      noLeidas: conversaciones.filter(c => !c.leido).length,
      reunionesPendientes: reuniones.filter(r => r.status === 'programada' && new Date(r.fecha) > now).length,
      mensajesSinResponder: conversaciones.filter(c => c.status === 'abierta').length
    };
  }, [conversaciones, reuniones]);

  const columnsConversaciones: ColumnDef<Conversacion>[] = [
    {
      accessorKey: "asunto",
      header: "Asunto",
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          {!row.original.leido && (
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium text-gray-900">{row.original.asunto}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.ultimoMensaje}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "teacherId",
      header: "Docente",
      cell: ({ row }) => {
        const teacher = teachers?.find(t => t.firestoreId === row.original.teacherId);
        return (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-700">
              {teacher ? `${teacher.nombre} ${teacher.apellido}` : 'N/A'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "fecha",
      header: "Última actividad",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">{formatRelativeTime(row.original.fecha)}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'abierta' ? 'default' : 'secondary'}>
          {row.original.status === 'abierta' ? 'Abierta' : 'Cerrada'}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/app/comunicacion-familias/${row.original.firestoreId}`)}
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Ver
        </Button>
      ),
    },
  ];

  const columnsReuniones: ColumnDef<Reunion>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha y Hora",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-900">{formatDate(row.original.fecha)}</span>
        </div>
      ),
    },
    {
      accessorKey: "teacherId",
      header: "Docente",
      cell: ({ row }) => {
        const teacher = teachers?.find(t => t.firestoreId === row.original.teacherId);
        return (
          <span className="text-sm text-gray-700">
            {teacher ? `${teacher.nombre} ${teacher.apellido}` : 'N/A'}
          </span>
        );
      },
    },
    {
      accessorKey: "motivo",
      header: "Motivo",
      cell: ({ row }) => (
        <p className="text-sm text-gray-700 truncate max-w-xs">{row.original.motivo}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = {
          programada: { label: 'Programada', variant: 'default' as const },
          realizada: { label: 'Realizada', variant: 'secondary' as const },
          cancelada: { label: 'Cancelada', variant: 'destructive' as const }
        };
        return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
      },
    },
  ];

  if ((!conversaciones || conversaciones.length === 0) && (!reuniones || reuniones.length === 0)) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Aún no tienes conversaciones"
        description="Cuando los docentes se comuniquen contigo, las conversaciones aparecerán aquí"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Conversaciones</CardTitle>
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
            <p className="text-xs text-purple-600 mt-1">Total de conversaciones</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">No leídas</CardTitle>
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.noLeidas}</div>
            <p className="text-xs text-blue-600 mt-1">Mensajes nuevos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Reuniones</CardTitle>
              <Video className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.reunionesPendientes}</div>
            <p className="text-xs text-green-600 mt-1">Pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">Abiertas</CardTitle>
              <MessageCircle className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.mensajesSinResponder}</div>
            <p className="text-xs text-amber-600 mt-1">En curso</p>
          </CardContent>
        </Card>
      </div>

      {stats.noLeidas > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Tienes {stats.noLeidas} mensaje{stats.noLeidas > 1 ? 's' : ''} nuevo{stats.noLeidas > 1 ? 's' : ''}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Revisa tus conversaciones para mantenerte informado sobre el progreso de tu hijo/a.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <CardTitle>Mis Conversaciones</CardTitle>
          <CardDescription>Conversaciones con los docentes de tu hijo/a</CardDescription>
        </CardHeader>
        <CardContent>
          {conversaciones && conversaciones.length > 0 ? (
            <DataTable 
              columns={columnsConversaciones} 
              data={conversaciones} 
              placeholder="Buscar conversaciones..."
            />
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No hay conversaciones"
              description="Aún no tienes conversaciones con los docentes"
            />
          )}
        </CardContent>
      </Card>

      {reuniones && reuniones.length > 0 && (
        <Card className="bg-white shadow-lg border-gray-200">
          <CardHeader>
            <CardTitle>Reuniones Programadas</CardTitle>
            <CardDescription>Tus reuniones con los docentes</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columnsReuniones} 
              data={reuniones} 
              placeholder="Buscar reuniones..."
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white shadow border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Información Importante</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Mantente en contacto regular con los docentes para estar al tanto del progreso académico y comportamiento de tu hijo/a.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Solicitar Reunión</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Si necesitas hablar con un docente, puedes solicitar una reunión virtual.
            </p>
            <Button size="sm" variant="outline">
              <Video className="w-4 h-4 mr-2" />
              Solicitar reunión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

