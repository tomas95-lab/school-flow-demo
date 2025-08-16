import { useState, useContext, } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useTeacherCourses } from "@/hooks/useTeacherCourses";
import { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc, where, documentId } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { 
  Send, 
  ThumbsUp, 
  MessageSquare, 
  Pin, 
  Edit, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  Calendar,
  User,
  Search,
  Share2,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface Message {
  firestoreId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  courseId: string;
  messageType: 'general' | 'academic' | 'announcement' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  attachments: string[];
  createdAt: unknown;
  updatedAt?: string;
  isEdited: boolean;
  isPinned?: boolean;
  likes: string[];
  replies?: MessageReply[];
  status: 'active' | 'archived' | 'deleted';
}

interface MessageReply {
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: unknown;
  isEdited: boolean;
  likes: string[];
}

interface Course {
  firestoreId: string;
  nombre: string;
  division: string;
}

// Utilidad para obtener una fecha válida
function getValidDate(date: unknown): Date | null {
  if (!date) return null;
  if (typeof date === "string" || typeof date === "number") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof date === "object" && date !== null && typeof (date as { toDate?: unknown }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  return null;
}

export default function WallView() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('id');
  
  // Estados mejorados
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<"general" | "academic" | "announcement" | "reminder">("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [showOnlyMyMessages, setShowOnlyMyMessages] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<string[]>([]);
  const [readMessages, setReadMessages] = useState<string[]>([]);
  
  // Estados de UI
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Datos
  const { teacherCourses } = useTeacherCourses(user?.teacherId);
  const teacherCourseIds = (teacherCourses || []).map(c => c.firestoreId).filter(Boolean) as string[];

  // Alumno: obtener su propio curso para filtrar
  const { data: myStudentArr } = useFirestoreCollection("students", {
    constraints: user?.role === 'alumno' && user?.studentId ? [where(documentId(), '==', user.studentId)] : [],
    dependencies: [user?.role, user?.studentId]
  });
  const studentCourseId = Array.isArray(myStudentArr) && myStudentArr.length > 0
    ? (myStudentArr[0]?.cursoId || myStudentArr[0]?.courseId)
    : undefined;

  const { data: courses, loading: coursesLoading, error: coursesError } = useFirestoreCollection<Course>("courses", {
    constraints:
      user?.role === 'docente' && user?.teacherId
        ? [where('teacherId', '==', user.teacherId)]
        : user?.role === 'alumno' && studentCourseId
          ? [where(documentId(), '==', String(studentCourseId))]
          : [],
    dependencies: [user?.role, user?.teacherId, String(studentCourseId || '')]
  });

  const { data: messages, loading: messagesLoading, error: messagesError, refetch: refetchMessages } = useFirestoreCollection<Message>("messages", {
    orderBy: "createdAt",
    enableCache: false,
    constraints:
      user?.role === 'docente' && teacherCourseIds.length > 0
        ? [where('courseId', 'in', teacherCourseIds.slice(0, 10))]
        : user?.role === 'alumno' && studentCourseId
          ? [where('courseId', '==', String(studentCourseId))]
          : [],
    dependencies: [user?.role, teacherCourseIds.join(','), String(studentCourseId || '')]
  });
  const { data: students, loading: studentsLoading } = useFirestoreCollection("students");
  const { data: teachers, loading: teachersLoading } = useFirestoreCollection("teachers");

  // Obtener información del curso
  const course = courses?.find(c => c.firestoreId === courseId);

  // Filtrar mensajes del curso
  const courseMessages = messages?.filter(m => m.courseId === courseId && m.status === 'active') || [];

  const uid = user?.role === "docente" ? user.teacherId : user?.role === "alumno" ? user.studentId : user?.uid;

  // Filtrar y ordenar mensajes
  const filteredMessages = courseMessages
    .filter(m => {
      if (filterType !== "all" && m.messageType !== filterType) return false;
      
      if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !m.authorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      if (showOnlyPinned && !m.isPinned) return false;
      
      if (showOnlyMyMessages && m.authorId !== uid) return false;
      
      return true;
    })
    .sort((a, b) => {
      const aPinned = a.isPinned === true;
      const bPinned = b.isPinned === true;
      
      if (aPinned && !bPinned) return 1;
      if (!aPinned && bPinned) return -1;

      const aTime = new Date(typeof a.createdAt === "string" || typeof a.createdAt === "number" || a.createdAt instanceof Date ? a.createdAt : 0).getTime();
      const bTime = new Date(typeof b.createdAt === "string" || typeof b.createdAt === "number" || b.createdAt instanceof Date ? b.createdAt : 0).getTime();
      return bTime - aTime;
    });

  // Función para obtener nombre del autor
  const getAuthorName = (authorId: string, authorRole: string) => {
    if (authorRole === 'alumno') {
      const student = students?.find(s => s.firestoreId === authorId);
      return student ? `${student.nombre} ${student.apellido}` : 'Estudiante';
    } else if (authorRole === 'docente') {
      const teacher = teachers?.find(t => t.firestoreId === authorId);
      return teacher ? `Prof. ${teacher.nombre} ${teacher.apellido}` : 'Docente';
    } else {
      return 'Administrador';
    }
  };

  // Función para obtener iniciales del autor
  const getAuthorInitials = (authorName: string) => {
    return authorName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Publicar mensaje con mejor manejo de errores
  const handlePublishMessage = async () => {
    if (!newMessage.trim() || !courseId || !user) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      const messageData = {
        content: newMessage.trim(),
        authorId: uid,
        authorName: getAuthorName(uid ?? '', user.role),
        authorRole: user.role as 'admin' | 'docente' | 'alumno',
        courseId,
        messageType,
        priority,
        attachments: [],
        createdAt: serverTimestamp(),
        isPinned: false,
        isEdited: false,
        likes: [],
        status: 'active' as const
      };

      await addDoc(collection(db, "messages"), messageData);
      setNewMessage("");
      setMessageType("general");
      setPriority("medium");
      toast.success("Mensaje publicado exitosamente");
      
      // Refrescar mensajes
      await refetchMessages();
    } catch (error) {
      console.error("Error al publicar mensaje:", error);
      toast.error("Error al publicar el mensaje");
    } finally {
      setIsPublishing(false);
    }
  };

  // Dar/quitar like con mejor manejo de errores
  const handleLike = async (messageId: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para interactuar");
      return;
    }

    try {
      const messageRef = doc(db, "messages", messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        toast.error("Mensaje no encontrado");
        return;
      }

      const currentMessage = messageDoc.data();
      const currentLikes = currentMessage.likes || [];
      
      let updatedLikes;
      if (currentLikes.includes(uid)) {
        updatedLikes = currentLikes.filter((id: string) => id !== uid);
      } else {
        updatedLikes = [...currentLikes, uid];
      }

      await updateDoc(messageRef, {
        likes: updatedLikes
      });
      
      toast.success(currentLikes.includes(uid) ? "Like removido" : "Like agregado");
    } catch (error) {
      console.error("Error al actualizar like:", error);
      toast.error("Error al actualizar like");
    }
  };

  // Publicar respuesta con mejor manejo de errores
  const handlePublishReply = async (messageId: string) => {
    if (!replyContent.trim() || !user) {
      toast.error("Por favor escribe una respuesta");
      return;
    }

    try {
      const replyData = {
        content: replyContent.trim(),
        authorId: uid ?? '',
        authorName: getAuthorName(uid ?? '', user.role),
        authorRole: user.role as 'admin' | 'docente' | 'alumno',
        createdAt: new Date().toISOString(),
        isEdited: false,
        likes: []
      };

      const messageRef = doc(db, "messages", messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        toast.error("Mensaje no encontrado");
        return;
      }

      const currentMessage = messageDoc.data();
      const currentReplies = currentMessage.replies || [];
      const updatedReplies = [...currentReplies, replyData];

      await updateDoc(messageRef, {
        replies: updatedReplies
      });

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Respuesta publicada");
      
      // Refrescar mensajes
      await refetchMessages();
    } catch (error) {
      console.error("Error al publicar respuesta:", error);
      toast.error("Error al publicar la respuesta");
    }
  };

  // Editar mensaje con mejor manejo de errores
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }

    try {
      const messageRef = doc(db, "messages", messageId);
      
      await updateDoc(messageRef, {
        content: editContent.trim(),
        updatedAt: serverTimestamp(),
        isEdited: true
      });

      setEditingMessage(null);
      setEditContent("");
      toast.success("Mensaje actualizado");
      
      // Refrescar mensajes
      await refetchMessages();
    } catch (error) {
      console.error("Error al editar mensaje:", error);
      toast.error("Error al editar el mensaje");
    }
  };

  // Eliminar mensaje con confirmación
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este mensaje?")) {
      return;
    }

    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        status: 'deleted'
      });
      toast.success("Mensaje eliminado");
      
      // Refrescar mensajes
      await refetchMessages();
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      toast.error("Error al eliminar el mensaje");
    }
  };

  // Pin/Unpin mensaje
  const handlePinMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      const message = courseMessages.find(m => m.firestoreId === messageId);
      const newPinnedStatus = !message?.isPinned;
      
      await updateDoc(messageRef, {
        isPinned: newPinnedStatus
      });
      
      toast.success(newPinnedStatus ? "Mensaje fijado" : "Mensaje desfijado");
      
      // Refrescar mensajes
      await refetchMessages();
    } catch (error) {
      console.error("Error al pin/unpin mensaje:", error);
      toast.error("Error al actualizar el mensaje");
    }
  };

  // Marcar/desmarcar mensaje como favorito
  const handleBookmarkMessage = (messageId: string) => {
    setBookmarkedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
    toast.success(bookmarkedMessages.includes(messageId) ? "Marcador removido" : "Mensaje marcado");
  };

  // Marcar mensaje como leído
  const handleMarkAsRead = (messageId: string) => {
    setReadMessages(prev => 
      prev.includes(messageId) ? prev : [...prev, messageId]
    );
  };

  // Compartir mensaje
  const handleShareMessage = async (message: Message) => {
    try {
      const shareText = `${message.authorName}: ${message.content}`;
      const shareUrl = `${window.location.origin}/muro?id=${courseId}&message=${message.firestoreId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Mensaje de ${course?.nombre}`,
          text: shareText,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (error) {
      console.error("Error al compartir:", error);
      toast.error("Error al compartir el mensaje");
    }
  };

  // Refrescar datos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchMessages();
      toast.success("Datos actualizados");
    } catch {
      toast.error("Error al actualizar los datos");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Obtener estadísticas del muro
  const getWallStats = () => {
    const totalMessages = courseMessages.length;
    const pinnedMessages = courseMessages.filter(m => m.isPinned).length;
    const myMessages = courseMessages.filter(m => m.authorId === uid).length;
    const totalLikes = courseMessages.reduce((sum, m) => sum + m.likes.length, 0);
    const totalReplies = courseMessages.reduce((sum, m) => sum + (m.replies?.length || 0), 0);
    const unreadMessages = courseMessages.filter(m => !readMessages.includes(m.firestoreId)).length;
    
    return { totalMessages, pinnedMessages, myMessages, totalLikes, totalReplies, unreadMessages };
  };

  // Estados de carga
  const isLoadingData = coursesLoading || messagesLoading || studentsLoading || teachersLoading;
  const hasError = coursesError || messagesError;

  // Vista de selección de curso
  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Muros de Cursos</h1>
                <p className="text-gray-600 mt-2">Selecciona un curso para ver su muro de mensajes</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/mensajes')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Panel
              </Button>
            </div>
          </div>

          {/* Filtros de búsqueda */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar cursos..."
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por división" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las divisiones</SelectItem>
                  <SelectItem value="primaria">Primaria</SelectItem>
                  <SelectItem value="secundaria">Secundaria</SelectItem>
                  <SelectItem value="superior">Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de cursos */}
          {isLoadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const courseMessages = messages?.filter(m => m.courseId === course.firestoreId && m.status === 'active') || [];
                const recentMessages = courseMessages.slice(0, 3);
                
                return (
                  <Card key={course.firestoreId} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {course.nombre}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{course.division}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Mensajes</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {courseMessages.length}
                          </Badge>
                        </div>
                        
                        {recentMessages.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500">Mensajes recientes:</p>
                            {recentMessages.map((message, index) => (
                              <div key={index} className="text-xs text-gray-600 truncate">
                                <span className="font-medium">{message.authorName}:</span> {message.content}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No hay mensajes aún</p>
                        )}
                        
                        <Button 
                          className="w-full mt-4"
                          onClick={() => setSearchParams({ tab: 'wall', id: course.firestoreId })}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ver Muro
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {courses?.length === 0 && !isLoadingData && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos disponibles</h3>
                <p className="text-gray-600">No se encontraron cursos para mostrar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Curso no encontrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              El curso especificado no existe o no tienes permisos para acceder.
            </p>
            <Button onClick={() => navigate('/mensajes')} className="w-full">
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error de conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error al cargar los datos. Verifica tu conexión e inténtalo de nuevo.
            </p>
            <div className="space-y-2">
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button variant="outline" onClick={() => navigate('/mensajes')} className="w-full">
                Volver al panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParams({ tab: 'wall' })}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Seleccionar Curso
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Muro de {course.nombre} - {course.division}
                </h1>
                <p className="text-gray-600 mt-1">
                  {filteredMessages.length} mensajes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            </div>
          </div>

          {/* Estadísticas del muro */}
          {!isLoadingData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {(() => {
                const stats = getWallStats();
                return (
                  <>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                      <div className="text-sm text-blue-700">Mensajes</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pinnedMessages}</div>
                      <div className="text-sm text-yellow-700">Fijados</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.myMessages}</div>
                      <div className="text-sm text-green-700">Mis mensajes</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalLikes}</div>
                      <div className="text-sm text-purple-700">Me gusta</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalReplies}</div>
                      <div className="text-sm text-orange-700">Respuestas</div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Barra de búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar mensajes o autores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros y ordenamiento */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de mensaje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="academic">Académico</SelectItem>
                <SelectItem value="announcement">Anuncio</SelectItem>
                <SelectItem value="reminder">Recordatorio</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showOnlyPinned ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyPinned(!showOnlyPinned)}
              className="flex items-center gap-2"
            >
              <Pin className="h-4 w-4" />
              Solo fijados
            </Button>

            <Button
              variant={showOnlyMyMessages ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyMyMessages(!showOnlyMyMessages)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Mis mensajes
            </Button>
          </div>
        </div>

        {/* Formulario de nuevo mensaje */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nuevo mensaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="¿Qué quieres compartir con el curso?"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[100px]"
              disabled={isPublishing}
            />
            
            <div className="flex flex-wrap gap-4">
              <Select
                value={messageType}
                onValueChange={(value) =>
                  setMessageType(value as "general" | "academic" | "announcement" | "reminder")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="academic">Académico</SelectItem>
                  <SelectItem value="announcement">Anuncio</SelectItem>
                  <SelectItem value="reminder">Recordatorio</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as "low" | "medium" | "high")
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handlePublishMessage}
                disabled={!newMessage.trim() || isPublishing}
                className="ml-auto"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de mensajes */}
        <div className="space-y-4 flex flex-col-reverse">
          {isLoadingData ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes aún</h3>
                <p className="text-gray-600">Sé el primero en compartir algo con el curso.</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card key={message.firestoreId} className={message.isPinned ? "border-2 border-yellow-200 bg-yellow-50 my-4" : "my-4"}>
                <CardContent className="p-6">
                  {/* Header del mensaje */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                          {getAuthorInitials(message.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{message.authorName}</h4>
                          {message.isPinned && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Pin className="h-3 w-3 mr-1" />
                              Fijado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {(() => {
                            const createdAtDate = getValidDate(message.createdAt);
                            return createdAtDate ? format(createdAtDate, "dd 'de' MMMM 'a las' HH:mm", { locale: es }) : "Fecha inválida";
                          })()}
                          {message.isEdited && <span>• Editado</span>}
                        </div>
                      </div>
                    </div>

                    {/* Acciones del mensaje */}
                    {(uid === message.authorId || user?.role === 'admin') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePinMessage(message.firestoreId)}>
                            <Pin className="h-4 w-4 mr-2" />
                            {message.isPinned ? 'Desfijar' : 'Fijar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingMessage(message.firestoreId);
                            setEditContent(message.content);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.firestoreId)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Contenido del mensaje */}
                  {editingMessage === message.firestoreId ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleEditMessage(message.firestoreId)}
                        >
                          Guardar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingMessage(null);
                            setEditContent("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {message.messageType}
                        </Badge>
                        {message.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Alta prioridad
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}

                  {/* Acciones del mensaje */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleLike(message.firestoreId);
                          handleMarkAsRead(message.firestoreId);
                        }}
                        className={message.likes.includes(uid ?? '') ? "text-blue-600" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {message.likes.length}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === message.firestoreId ? null : message.firestoreId)}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        {message.replies?.length || 0}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmarkMessage(message.firestoreId)}
                        className={bookmarkedMessages.includes(message.firestoreId) ? "text-yellow-600" : ""}
                      >
                        {bookmarkedMessages.includes(message.firestoreId) ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareMessage(message)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Formulario de respuesta */}
                  {replyingTo === message.firestoreId && (
                    <div className="mt-4 pt-4 border-t">
                      <Textarea
                        placeholder="Escribe tu respuesta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="mb-3"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handlePublishReply(message.firestoreId)}
                          disabled={!replyContent.trim()}
                        >
                          Responder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Respuestas */}
                  {message.replies && message.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.replies.map((reply, index) => (
                        <div key={index} className="ml-8 pl-4 border-l-2 border-gray-200">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {getAuthorInitials(reply.authorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-gray-900">{reply.authorName}</span>
                                <span className="text-xs text-gray-500">
                                  {(() => {
                                    const replyDate = getValidDate(reply.createdAt);
                                    return replyDate ? format(replyDate, "dd/MM HH:mm") : "Fecha inválida";
                                  })()}
                                </span>
                                {reply.isEdited && <span className="text-xs text-gray-500">• Editado</span>}
                              </div>
                              <p className="text-sm text-gray-700">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 