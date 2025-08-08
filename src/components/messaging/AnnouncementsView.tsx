import { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Megaphone, Bell, Calendar, Settings, GitBranch, AlertTriangle, Users, FileText, Star } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { AuthContext } from "@/context/AuthContext";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
// import { createNotification } from "@/utils/notifications";

export default function AnnouncementsView() {
  const { user } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<'all' | 'admin' | 'docente' | 'alumno'>("all");
  const [targetCourseId, setTargetCourseId] = useState<string>("");
  const { data: courses } = useFirestoreCollection("courses", { enableCache: true });

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q as any, (snap: any) => {
      setAnnouncements((snap.docs as any[]).map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    await addDoc(collection(db, "announcements"), {
      title: title.trim(),
      content: content.trim(),
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      targetRole,
      targetCourseId: targetCourseId || null,
    });
    // Emitir notificaciones básicas por rol (admin/docente/alumno) — se puede optimizar por curso
    // Para MVP: solo si targetRole != 'all', notificar por rol (requeriría query a users)
    setTitle("");
    setContent("");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Anuncios</h2>
          <p className="text-gray-600 text-sm sm:text-base">Comunicaciones generales del sistema educativo</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role !== "alumno" && (
            <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
              Nuevo anuncio
            </Button>
          )}
        </div>
      </div>

      {announcements.filter((a) => a.targetRole === 'all' || a.targetRole === user?.role).length === 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No hay anuncios todavía.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Megaphone className="h-5 w-5" />
              Anuncios Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements
                .filter((a) => a.targetRole === 'all' || a.targetRole === user?.role)
                .slice(0,6)
                .map((a) => (
                <div key={a.id} className="border rounded-md p-3">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Sistema de Alertas</h3>
              <p className="text-gray-500 text-sm mb-4">
                Recibe notificaciones de anuncios importantes
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-5 w-5" />
              Programación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Anuncios Programados</h3>
              <p className="text-gray-500 text-sm mb-4">
                Programa anuncios para fechas específicas
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Funcionalidades Planificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Gestión de Anuncios</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Crear y editar anuncios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Programar publicaciones
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Categorizar por tipo
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Control de permisos por rol
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Características Avanzadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Funcionalidades Avanzadas</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Notificaciones push
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Plantillas de anuncios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Estadísticas de lectura
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Archivo de anuncios
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Tipos de Anuncios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Institucionales</h4>
              <p className="text-xs text-gray-500">Anuncios oficiales</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Eventos</h4>
              <p className="text-xs text-gray-500">Actividades y eventos</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Urgentes</h4>
              <p className="text-xs text-gray-500">Comunicaciones urgentes</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Académicos</h4>
              <p className="text-xs text-gray-500">Información académica</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReutilizableDialog
        open={open}
        onOpenChange={setOpen}
        title="Nuevo anuncio"
        description="Publica un anuncio para todos o para un grupo"
        content={
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Título</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Contenido</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Audiencia</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={targetRole} onChange={(e) => setTargetRole(e.target.value as any)}>
                  <option value="all">Todos</option>
                  <option value="admin">Administradores</option>
                  <option value="docente">Docentes</option>
                  <option value="alumno">Estudiantes</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-700">Curso (opcional)</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={targetCourseId} onChange={(e) => setTargetCourseId(e.target.value)}>
                  <option value="">Todos</option>
                  {(courses || []).map((c: any) => (
                    <option key={c.firestoreId} value={c.firestoreId}>{c.nombre} - {c.division}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>Publicar</Button>
          </div>
        }
        background={false}
        small={false}
      />
    </div>
  );
} 