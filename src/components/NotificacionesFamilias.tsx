import { useState, useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { where } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { 
  Send, 
  Bell, 
  Users, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/dateUtils";

interface Notificacion {
  firestoreId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  targetType: 'all' | 'course' | 'student';
  targetId?: string;
  senderId: string;
  senderRole: string;
  createdAt: string;
  status: 'sent' | 'pending';
  readBy?: string[];
}

export default function NotificacionesFamilias() {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetType, setTargetType] = useState<'all' | 'course' | 'student'>('all');
  const [targetId, setTargetId] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: courses } = useFirestoreCollection("courses", {
    constraints: user?.role === 'docente' && user?.teacherId 
      ? [where('teacherId', '==', user.teacherId)] 
      : [],
    dependencies: [user?.teacherId]
  });

  const { data: students } = useFirestoreCollection("students", {
    enableCache: true
  });

  const { data: notificaciones } = useFirestoreCollection<Notificacion>("notificaciones_familias", {
    constraints: user?.role === 'docente' 
      ? [where('senderId', '==', user?.teacherId || '')] 
      : [],
    dependencies: [user?.teacherId, refreshKey],
    enableCache: true
  });

  const studentsWithCourses = useMemo(() => {
    if (!students || !courses) return [];
    
    if (user?.role === 'docente') {
      const teacherCourseIds = courses.map(c => c.firestoreId);
      return students.filter(s => teacherCourseIds.includes(s.cursoId));
    }
    
    return students;
  }, [students, courses, user?.role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Por favor completa el título y mensaje");
      return;
    }

    if (targetType !== 'all' && !targetId) {
      toast.error("Por favor selecciona un destinatario");
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, "notificaciones_familias"), {
        title: title.trim(),
        message: message.trim(),
        priority,
        targetType,
        targetId: targetType !== 'all' ? targetId : null,
        senderId: user?.teacherId || user?.uid || '',
        senderRole: user?.role || 'docente',
        createdAt: new Date().toISOString(),
        status: 'sent',
        readBy: []
      });

      toast.success("Notificación enviada exitosamente");
      setTitle("");
      setMessage("");
      setTargetType('all');
      setTargetId("");
      setPriority('medium');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Error al enviar la notificación");
    } finally {
      setSending(false);
    }
  };

  const priorityConfig = {
    low: { label: 'Baja', color: 'bg-blue-100 text-blue-800', icon: Info },
    medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    high: { label: 'Alta', color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

  const targetTypeConfig = {
    all: { label: 'Todas las familias', icon: Users },
    course: { label: 'Curso específico', icon: Users },
    student: { label: 'Estudiante específico', icon: Users }
  };

  const columns: ColumnDef<Notificacion>[] = [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title}</div>
      )
    },
    {
      accessorKey: "message",
      header: "Mensaje",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 truncate max-w-xs">
          {row.original.message}
        </div>
      )
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const config = priorityConfig[row.original.priority];
        const Icon = config.icon;
        return (
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      accessorKey: "targetType",
      header: "Destinatario",
      cell: ({ row }) => {
        const { targetType, targetId } = row.original;
        const config = targetTypeConfig[targetType];
        
        let label = config.label;
        if (targetType === 'course' && targetId) {
          const course = courses?.find(c => c.firestoreId === targetId);
          label = course ? `${course.nombre} - ${course.division}` : 'Curso';
        } else if (targetType === 'student' && targetId) {
          const student = students?.find(s => s.firestoreId === targetId);
          label = student ? `${student.nombre} ${student.apellido}` : 'Estudiante';
        }
        
        return <span className="text-sm">{label}</span>;
      }
    },
    {
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {formatDate(row.original.createdAt)}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: () => (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Enviada
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Enviar Nueva Notificación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Reunión de padres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetType">Destinatarios</Label>
                <Select value={targetType} onValueChange={(value: any) => setTargetType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las familias</SelectItem>
                    <SelectItem value="course">Curso específico</SelectItem>
                    <SelectItem value="student">Estudiante específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType === 'course' && (
                <div className="space-y-2">
                  <Label htmlFor="course">Seleccionar Curso</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.filter(course => course.firestoreId).map(course => (
                        <SelectItem key={course.firestoreId} value={course.firestoreId!}>
                          {course.nombre} - {course.division}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetType === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="student">Seleccionar Estudiante</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsWithCourses.filter(student => student.firestoreId).map(student => (
                        <SelectItem key={student.firestoreId} value={student.firestoreId!}>
                          {student.nombre} {student.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={sending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {sending ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Historial de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notificaciones && notificaciones.length > 0 ? (
            <DataTable
              columns={columns}
              data={notificaciones}
              placeholder="Buscar notificaciones..."
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No has enviado notificaciones aún</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

