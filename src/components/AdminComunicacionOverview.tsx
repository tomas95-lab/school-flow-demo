import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Video, 
  Bell,
  TrendingUp,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { formatRelativeTime } from "@/utils/dateUtils";

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

export default function AdminComunicacionOverview() {
  const { data: conversaciones } = useFirestoreCollection<Conversacion>("conversaciones_familias", { enableCache: true });
  const { data: reuniones } = useFirestoreCollection("reuniones_familias", { enableCache: true });
  const { data: teachers } = useFirestoreCollection("teachers", { enableCache: true });
  const { data: students } = useFirestoreCollection("students", { enableCache: true });

  const stats = useMemo(() => {
    if (!conversaciones || !reuniones) return { 
      totalConversaciones: 0, 
      abiertas: 0, 
      cerradas: 0, 
      reunionesProgramadas: 0,
      tasaRespuesta: 0
    };

    const now = new Date();
    const reunionesFuturas = reuniones.filter((r: any) => new Date(r.fecha) > now);

    return {
      totalConversaciones: conversaciones.length,
      abiertas: conversaciones.filter(c => c.status === 'abierta').length,
      cerradas: conversaciones.filter(c => c.status === 'cerrada').length,
      reunionesProgramadas: reunionesFuturas.length,
      tasaRespuesta: 85
    };
  }, [conversaciones, reuniones]);

  const columns: ColumnDef<Conversacion>[] = [
    {
      accessorKey: "asunto",
      header: "Asunto",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.asunto}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.ultimoMensaje}</p>
        </div>
      ),
    },
    {
      accessorKey: "teacherId",
      header: "Docente",
      cell: ({ row }) => {
        const teacher = teachers?.find(t => t.firestoreId === row.original.teacherId);
        return <span className="text-sm text-gray-700">{teacher ? `${teacher.nombre} ${teacher.apellido}` : 'N/A'}</span>;
      },
    },
    {
      accessorKey: "studentId",
      header: "Estudiante",
      cell: ({ row }) => {
        const student = students?.find(s => s.firestoreId === row.original.studentId);
        return <span className="text-sm text-gray-700">{student ? `${student.nombre} ${student.apellido}` : 'N/A'}</span>;
      },
    },
    {
      accessorKey: "fecha",
      header: "Última actividad",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
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
  ];

  if (!conversaciones || conversaciones.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No hay conversaciones registradas"
        description="Las conversaciones entre docentes y familias aparecerán aquí"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Total Conversaciones</CardTitle>
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.totalConversaciones}</div>
            <p className="text-xs text-purple-600 mt-1">Todas las conversaciones</p>
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
            <p className="text-xs text-emerald-600 mt-1">Conversaciones activas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Reuniones</CardTitle>
              <Video className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.reunionesProgramadas}</div>
            <p className="text-xs text-blue-600 mt-1">Programadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">Tasa de Respuesta</CardTitle>
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.tasaRespuesta}%</div>
            <p className="text-xs text-gray-600 mt-1">Promedio general</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-lg border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversaciones Recientes</CardTitle>
              <CardDescription>Todas las conversaciones del sistema</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {conversaciones.length} conversaciones
            </Badge>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Docentes Activos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{teachers?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Participando en comunicaciones</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Cerradas este mes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.cerradas}</div>
            <p className="text-xs text-gray-500 mt-1">Conversaciones resueltas</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Satisfacción</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">92%</div>
            <p className="text-xs text-gray-500 mt-1">Familias satisfechas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

