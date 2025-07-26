import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { addDoc, collection, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import type { Message, MessageReply, Course, Subject } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Send, 
  ThumbsUp, 
  MessageSquare, 
  Pin, 
  Edit, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  FileText,
  Calendar,
  User
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Utilidad para obtener una fecha válida
function getValidDate(date: any): Date | null {
  if (!date) return null;
  if (typeof date === "string" || typeof date === "number") {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof date.toDate === "function") {
    // Firestore Timestamp
    return date.toDate();
  }
  return null;
}

export default function DetallesMuro() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('id');
  
  // Estados
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<"general" | "academic" | "announcement" | "reminder">("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostLiked">("newest");

  // Datos
  const { data: courses } = useFirestoreCollection<Course>("courses");
  const { data: subjects } = useFirestoreCollection<Subject>("subjects");
  const { data: messages } = useFirestoreCollection<Message>("messages", {
    orderBy: "createdAt",
    enableCache: false
  });
  const { data: students } = useFirestoreCollection("students");
  const { data: teachers } = useFirestoreCollection("teachers");

  // Obtener información del curso
  const course = courses?.find(c => c.firestoreId === courseId);
  const courseSubjects = subjects?.filter(s => {
    if (Array.isArray(s.cursoId)) {
      return s.cursoId.includes(courseId || '');
    }
    return s.cursoId === courseId;
  }) || [];

  // Filtrar mensajes del curso
  const courseMessages = messages?.filter(m => m.courseId === courseId && m.status === 'active') || [];

  // Debug: verificar todos los mensajes y sus propiedades
  console.log('All course messages:', courseMessages.map(m => ({
    id: m.firestoreId,
    content: m.content.substring(0, 30) + '...',
    pinned: m.isPinned,
    createdAt: m.createdAt,
    type: typeof m.isPinned
  })));

  // Filtrar y ordenar mensajes
  const filteredMessages = courseMessages
    .filter(m => {
      if (filterType === "all") return true;
      return m.messageType === filterType;
    })
    .sort((a, b) => {
      // Los mensajes fijados van al final (para que con flex-reverse aparezcan primero visualmente)
      const aPinned = a.isPinned === true;
      const bPinned = b.isPinned === true;
      
      // Debug: verificar el sorting
      console.log(`Comparing: ${a.firestoreId} (pinned: ${aPinned}, value: ${a.isPinned}) vs ${b.firestoreId} (pinned: ${bPinned}, value: ${b.isPinned})`);
      
      // Primero ordenar por pinned status (fijados van al final)
      if (aPinned && !bPinned) {
        console.log(`${a.firestoreId} goes last (pinned)`);
        return 1;
      }
      if (!aPinned && bPinned) {
        console.log(`${b.firestoreId} goes last (pinned)`);
        return -1;
      }
      
      // Si ambos están fijados o ambos no están fijados, ordenar por fecha (más nuevos primero)
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
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

  // Publicar mensaje
  const uid = user?.role === "docente" ? user.teacherId : user?.role === "alumno" ? user.studentId  : user?.uid;
  const handlePublishMessage = async () => {
    if (!newMessage.trim() || !courseId || !user) return;
    try {
      const messageData = {
        content: newMessage.trim(),
        authorId: uid,
        authorName: getAuthorName(uid ?? '', user.role),
        authorRole: user.role as 'admin' | 'docente' | 'alumno',
        courseId,
        messageType,
        priority,
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
    } catch (error) {
      console.error("Error al publicar mensaje:", error);
      toast.error("Error al publicar el mensaje");
    }
  };

  // Dar/quitar like
  const handleLike = async (messageId: string) => {
    if (!user) return;

    try {
      const messageRef = doc(db, "messages", messageId);
      
      // Leer el documento actual
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        toast.error("Mensaje no encontrado");
        return;
      }

      const currentMessage = messageDoc.data();
      const currentLikes = currentMessage.likes || [];
      
      let updatedLikes;
      if (currentLikes.includes(uid)) {
        // Quitar like
        updatedLikes = currentLikes.filter((id: string) => id !== uid);
      } else {
        // Agregar like
        updatedLikes = [...currentLikes, uid];
      }

      await updateDoc(messageRef, {
        likes: updatedLikes
      });
    } catch (error) {
      console.error("Error al actualizar like:", error);
      toast.error("Error al actualizar like");
    }
  };

  // Publicar respuesta
  const handlePublishReply = async (messageId: string) => {
    if (!replyContent.trim() || !user) return;

    try {
      const replyData = {
        content: replyContent.trim(),
        authorId: uid ?? '',
        authorName: getAuthorName(uid ?? '', user.role),
        authorRole: user.role as 'admin' | 'docente' | 'alumno',
        createdAt: new Date().toISOString(), // Usar ISO string en lugar de serverTimestamp
        isEdited: false,
        likes: []
      };

      const messageRef = doc(db, "messages", messageId);
      
      // Leer el documento actual
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        toast.error("Mensaje no encontrado");
        return;
      }

      const currentMessage = messageDoc.data();
      const currentReplies = currentMessage.replies || [];

      // Agregar la nueva respuesta
      const updatedReplies = [...currentReplies, replyData];

      // Actualizar todo el documento
      await updateDoc(messageRef, {
        replies: updatedReplies
      });

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Respuesta publicada");
    } catch (error) {
      console.error("Error al publicar respuesta:", error);
      toast.error("Error al publicar la respuesta");
    }
  };

  // Editar mensaje
  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const messageRef = doc(db, "messages", messageId);
      
      // Leer el documento actual
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        toast.error("Mensaje no encontrado");
        return;
      }
      
      await updateDoc(messageRef, {
        content: editContent.trim(),
        updatedAt: serverTimestamp(),
        isEdited: true
      });

      setEditingMessage(null);
      setEditContent("");
      toast.success("Mensaje actualizado");
    } catch (error) {
      console.error("Error al editar mensaje:", error);
      toast.error("Error al editar el mensaje");
    }
  };

  // Eliminar mensaje
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        status: 'deleted'
      });
      toast.success("Mensaje eliminado");
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
    } catch (error) {
      console.error("Error al pin/unpin mensaje:", error);
      toast.error("Error al actualizar el mensaje");
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Curso no encontrado</h2>
          <p className="text-gray-600">El curso especificado no existe o no tienes permisos para acceder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Muro de {course.nombre} - {course.division}
              </h1>
              <p className="text-gray-600 mt-1">
                {courseSubjects.length} materias • {filteredMessages.length} mensajes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Activo
              </Badge>
            </div>
          </div>

          {/* Filtros y ordenamiento */}
          <div className="flex flex-wrap gap-4">
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

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="mostLiked">Más populares</SelectItem>
              </SelectContent>
            </Select>
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
            />
            
            <div className="flex flex-wrap gap-4">
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
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

              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
                disabled={!newMessage.trim()}
                className="ml-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de mensajes */}
        <div className="space-y-4 flex flex-col-reverse">
          {filteredMessages.length === 0 ? (
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
                            Alta prioridad
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}

                  {/* Acciones del mensaje */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(message.firestoreId)}
                        className={message.likes.includes(uid ?? '') ? "text-blue-600" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {message.likes.length} {message.likes.length === 1 ? 'Me gusta' : 'Me gusta'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === message.firestoreId ? null : message.firestoreId)}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Responder
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                      {message.replies?.length || 0} {message.replies?.length === 1 ? 'respuesta' : 'respuestas'}
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
