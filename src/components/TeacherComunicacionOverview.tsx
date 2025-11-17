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
  Plus,
  Clock
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatRelativeTime } from "@/utils/dateUtils";
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

export default function TeacherComunicacionOverview() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { data: conversaciones } = useFirestoreCollection<Conversacion>("conversaciones_familias", {
    constraints: user?.teacherId 
      ? [where('teacherId', '==', user.teacherId)]
      : [],
    enableCache: true,
    dependencies: [user?.teacherId]
  });

  const { data: reuniones } = useFirestoreCollection("reuniones_familias", {
    constraints: user?.teacherId 
      ? [where('teacherId', '==', user.teacherId)]
      : [],
    enableCache: true,
    dependencies: [user?.teacherId]
  });

  const { data: students } = useFirestoreCollection("students", { enableCache: true });

  const stats = useMemo(() => {
    if (!conversaciones || !reuniones) return { 
      total: 0, 
      abiertas: 0, 
      noLeidas: 0, 
      reunionesProximas: 0
    };

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: conversaciones.length,
      abiertas: conversaciones.filter(c => c.status === 'abierta').length,
      noLeidas: conversaciones.filter(c => !c.leido).length,
      reunionesProximas: reuniones.filter((r: any) => {
        const fecha = new Date(r.fecha);
        return fecha > now && fecha < in7Days;
      }).length
    };
  }, [conversaciones, reuniones]);

  const columns: ColumnDef<Conversacion>[] = [
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
      accessorKey: "studentId",
      header: "Estudiante",
      cell: ({ row }) => {
        const student = students?.find(s => s.firestoreId === row.original.studentId);
        return (
          <Badge variant="outline" className="text-xs">
            {student ? `${student.nombre} ${student.apellido}` : 'N/A'}
          </Badge>
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
      accessorKey: "prioridad",
      header: "Prioridad",
      cell: ({ row }) => {
        const prioridad = row.original.prioridad || 'media';
        const config: Record<string, { label: string; color: string }> = {
          baja: { label: 'Baja', color: 'bg-gray-100 text-gray-700' },
          media: { label: 'Media', color: 'bg-amber-100 text-amber-700' },
          alta: { label: 'Alta', color: 'bg-red-100 text-red-700' }
        };
        const prioridadConfig = config[prioridad] || config.media;
        return (
          <Badge className={prioridadConfig.color}>
            {prioridadConfig.label}
          </Badge>
        );
      },
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

  if (!conversaciones || conversaciones.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No tienes conversaciones aún"
        description="Inicia una conversación con las familias de tus estudiantes"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Mis Conversaciones</CardTitle>
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
            <p className="text-xs text-purple-600 mt-1">Total de conversaciones</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700">Abiertas</CardTitle>
              <Bell className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{stats.abiertas}</div>
            <p className="text-xs text-emerald-600 mt-1">Activas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">No leídas</CardTitle>
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.noLeidas}</div>
            <p className="text-xs text-blue-600 mt-1">Mensajes pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700">Reuniones</CardTitle>
              <Video className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.reunionesProximas}</div>
            <p className="text-xs text-amber-600 mt-1">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      {stats.noLeidas > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Tienes {stats.noLeidas} mensaje{stats.noLeidas > 1 ? 's' : ''} sin leer</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Revisa tus conversaciones para mantener una buena comunicación con las familias.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversaciones</CardTitle>
              <CardDescription>Todas tus conversaciones con familias</CardDescription>
            </div>
            <Button onClick={() => navigate("/app/comunicacion-familias/nueva")}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={conversaciones} 
            placeholder="Buscar conversaciones..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
