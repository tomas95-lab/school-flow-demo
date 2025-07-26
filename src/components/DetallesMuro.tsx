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
  User,
  Search,
  Filter,
  Eye,
  EyeOff,
  Share2,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Clock,
  Star,
  Download,
  Image,
  Paperclip,
  Smile,
  AtSign,
  Hash
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [showOnlyMyMessages, setShowOnlyMyMessages] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [showReadStatus, setShowReadStatus] = useState(false);
  const [readMessages, setReadMessages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState("");
  const [hashtagPosition, setHashtagPosition] = useState<{ start: number; end: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

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
      // Filtro por tipo de mensaje
      if (filterType !== "all" && m.messageType !== filterType) return false;
      
      // Filtro por búsqueda
      if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !m.authorName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Filtro por mensajes fijados
      if (showOnlyPinned && !m.isPinned) return false;
      
      // Filtro por mis mensajes
      if (showOnlyMyMessages && m.authorId !== uid) return false;
      

      
      return true;
    })
    .sort((a, b) => {
      // Los mensajes fijados van al final (para que con flex-reverse aparezcan primero visualmente)
      const aPinned = a.isPinned === true;
      const bPinned = b.isPinned === true;
      
      // Primero ordenar por pinned status (fijados van al final)
      if (aPinned && !bPinned) return 1;
      if (!aPinned && bPinned) return -1;
      
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
      // Procesar archivos adjuntos (simulado - en producción se subirían a Firebase Storage)
      const attachmentUrls: string[] = [];
      const newImageUrls = new Map(imageUrls);
      
      if (attachments.length > 0) {
        // Crear URLs de vista previa para las imágenes
        attachmentUrls.push(...attachments.map((file, index) => {
          if (isImageFile(file)) {
            // Para imágenes, crear una URL de vista previa y guardarla
            const imageUrl = createImagePreview(file);
            const attachmentId = `attachment_${Date.now()}_${index}`;
            newImageUrls.set(attachmentId, imageUrl);
            return attachmentId;
          } else {
            // Para otros archivos, usar nombre genérico
            return `attachment_${Date.now()}_${index}`;
          }
        }));
        
        setImageUrls(newImageUrls);
      }

      const messageData = {
        content: newMessage.trim(),
        authorId: uid,
        authorName: getAuthorName(uid ?? '', user.role),
        authorRole: user.role as 'admin' | 'docente' | 'alumno',
        courseId,
        messageType,
        priority,
        attachments: attachmentUrls,
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
      setAttachments([]);
      setShowMentionSuggestions(false);
      setShowHashtagSuggestions(false);
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

  // Marcar todos los mensajes como leídos
  const handleMarkAllAsRead = () => {
    const allMessageIds = courseMessages.map(m => m.firestoreId);
    setReadMessages(prev => [...new Set([...prev, ...allMessageIds])]);
    toast.success("Todos los mensajes marcados como leídos");
  };

  // Manejar archivos adjuntos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/*', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`El archivo ${file.name} es demasiado grande (máximo 10MB)`);
        return false;
      }
      if (!allowedTypes.some(type => file.type.match(type))) {
        toast.error(`El archivo ${file.name} no es un tipo válido`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    toast.success(`${validFiles.length} archivo(s) agregado(s)`);
  };

  // Verificar si un archivo es una imagen
  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
  };

  // Crear URL de vista previa para imágenes
  const createImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  // Eliminar archivo adjunto
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Obtener sugerencias de usuarios para menciones
  const getMentionSuggestions = () => {
    if (!mentionQuery) return [];
    
    const allUsers = [
      ...(students?.map(s => ({ id: s.firestoreId, name: `${s.nombre} ${s.apellido}`, role: 'alumno' })) || []),
      ...(teachers?.map(t => ({ id: t.firestoreId, name: `Prof. ${t.nombre} ${t.apellido}`, role: 'docente' })) || [])
    ];
    
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);
  };

  // Obtener hashtags existentes
  const getExistingHashtags = () => {
    const hashtags = new Set<string>();
    courseMessages.forEach(message => {
      const matches = message.content.match(/#(\w+)/g);
      if (matches) {
        matches.forEach(tag => hashtags.add(tag));
      }
    });
    return Array.from(hashtags).filter(tag => 
      tag.toLowerCase().includes(hashtagQuery.toLowerCase())
    ).slice(0, 5);
  };

  // Insertar mención
  const insertMention = (userName: string) => {
    if (!mentionPosition) return;
    
    const before = newMessage.slice(0, mentionPosition.start);
    const after = newMessage.slice(mentionPosition.end);
    const newText = before + `@${userName} ` + after;
    
    setNewMessage(newText);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    setMentionPosition(null);
  };

  // Insertar hashtag
  const insertHashtag = (hashtag: string) => {
    if (!hashtagPosition) return;
    
    const before = newMessage.slice(0, hashtagPosition.start);
    const after = newMessage.slice(hashtagPosition.end);
    const newText = before + hashtag + " " + after;
    
    setNewMessage(newText);
    setShowHashtagSuggestions(false);
    setHashtagQuery("");
    setHashtagPosition(null);
  };

  // Procesar texto para detectar menciones y hashtags
  const processTextInput = (text: string, cursorPosition: number) => {
    // Detectar menciones
    const beforeCursor = text.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setShowMentionSuggestions(true);
      setMentionQuery(mentionMatch[1]);
      setMentionPosition({
        start: beforeCursor.lastIndexOf('@'),
        end: cursorPosition
      });
    } else {
      setShowMentionSuggestions(false);
    }

    // Detectar hashtags
    const hashtagMatch = beforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch) {
      setShowHashtagSuggestions(true);
      setHashtagQuery(hashtagMatch[1]);
      setHashtagPosition({
        start: beforeCursor.lastIndexOf('#'),
        end: cursorPosition
      });
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  // Procesar contenido del mensaje para resaltar menciones y hashtags
  const processMessageContent = (content: string) => {
    // Reemplazar menciones con enlaces
    let processedContent = content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
    
    // Reemplazar hashtags con enlaces clickeables
    processedContent = processedContent.replace(/#(\w+)/g, '<span class="text-purple-600 font-medium cursor-pointer hover:underline" onclick="window.handleHashtagClick(\'$1\')">#$1</span>');
    
    return processedContent;
  };

  // Manejar clic en hashtag
  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(hashtag);
    toast.success(`Filtrando por hashtag: ${hashtag}`);
  };

  // Exponer la función globalmente para el onclick
  useEffect(() => {
    (window as any).handleHashtagClick = handleHashtagClick;
    return () => {
      delete (window as any).handleHashtagClick;
    };
  }, []);

  // Limpiar URLs de vista previa al desmontar
  useEffect(() => {
    return () => {
      // Limpiar URLs de archivos adjuntos actuales
      attachments.forEach(file => {
        if (isImageFile(file)) {
          URL.revokeObjectURL(createImagePreview(file));
        }
      });
      
      // Limpiar URLs guardadas
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [attachments, imageUrls]);

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

          {/* Estadísticas del muro */}
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
                  {showReadStatus && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.unreadMessages}</div>
                      <div className="text-sm text-red-700">No leídos</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros avanzados
            </Button>
          </div>

          {/* Filtros avanzados */}
          {showAdvancedFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showReadStatus"
                    checked={showReadStatus}
                    onChange={(e) => setShowReadStatus(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showReadStatus" className="text-sm">Mostrar estado de lectura</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showBookmarks"
                    checked={bookmarkedMessages.length > 0}
                    onChange={(e) => {
                      if (!e.target.checked) setBookmarkedMessages([]);
                    }}
                    className="rounded"
                  />
                  <label htmlFor="showBookmarks" className="text-sm">Solo marcados ({bookmarkedMessages.length})</label>
                </div>
                
                {showReadStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Marcar todos como leídos
                  </Button>
                )}
              </div>
            </div>
          )}
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
            <div className="flex gap-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                  <span>
                    <Paperclip className="h-4 w-4" />
                    Adjuntar
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                  <span>
                    <Image className="h-4 w-4" />
                    Imagen
                  </span>
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Archivos adjuntos */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Archivos adjuntos:</h4>
                <div className="space-y-3">
                  {attachments.map((file, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                      {isImageFile(file) ? (
                        // Vista previa de imagen
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="relative">
                            <img
                              src={createImagePreview(file)}
                              alt={file.name}
                              className="max-w-full h-32 object-cover rounded-lg border"
                            />
                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Archivo no-imagen
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                placeholder="¿Qué quieres compartir con el curso? Usa @ para mencionar usuarios o # para etiquetas..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  processTextInput(e.target.value, e.target.selectionStart || 0);
                }}
                onKeyUp={(e) => {
                  processTextInput(e.currentTarget.value, e.currentTarget.selectionStart || 0);
                }}
                className="min-h-[100px]"
              />
              
              {/* Sugerencias de menciones */}
              {showMentionSuggestions && (
                <div className="absolute bottom-full left-0 right-0 bg-white border rounded-lg shadow-lg mb-2 z-10">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2">Mencionar usuario:</div>
                    {getMentionSuggestions().map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => insertMention(user.name)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencias de hashtags */}
              {showHashtagSuggestions && (
                <div className="absolute bottom-full left-0 right-0 bg-white border rounded-lg shadow-lg mb-2 z-10">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2">Hashtags existentes:</div>
                    {getExistingHashtags().map((hashtag) => (
                      <div
                        key={hashtag}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => insertHashtag(hashtag)}
                      >
                        <Hash className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{hashtag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Alta prioridad
                            </Badge>
                          )}
                          {message.priority === 'low' && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Baja prioridad
                            </Badge>
                          )}

                          {showReadStatus && readMessages.includes(message.firestoreId) && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              <Eye className="h-3 w-3 mr-1" />
                              Leído
                            </Badge>
                          )}
                                                </div>
                        <div 
                          className="text-gray-900 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: processMessageContent(message.content) 
                          }}
                        />
                        
                        {/* Archivos adjuntos */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <h5 className="text-sm font-medium text-gray-700">Archivos adjuntos:</h5>
                            <div className="space-y-3">
                              {message.attachments.map((attachment, index) => {
                                // Obtener la URL real de la imagen si existe
                                const imageUrl = imageUrls.get(attachment);
                                const isImage = imageUrl || 
                                               attachment.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || 
                                               attachment.includes('image') ||
                                               attachment.startsWith('data:image') ||
                                               attachment.startsWith('blob:');
                                
                                return (
                                  <div key={index} className="bg-gray-50 rounded-lg p-3 border">
                                    {isImage ? (
                                      // Vista previa de imagen
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Image className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm text-gray-700">
                                              Imagen {index + 1}
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="relative">
                                          <img
                                            src={imageUrl || attachment}
                                            alt={`Imagen adjunta ${index + 1}`}
                                            className="max-w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setSelectedImage(imageUrl || attachment)}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      // Archivo no-imagen
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-gray-500" />
                                          <span className="text-sm text-gray-700">{attachment}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {message.replies && message.replies.length > 0 && (
                        <span>{message.replies.length} {message.replies.length === 1 ? 'respuesta' : 'respuestas'}</span>
                      )}
                      {showReadStatus && !readMessages.includes(message.firestoreId) && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Nuevo
                        </Badge>
                      )}
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

      {/* Modal para ver imagen en tamaño completo */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white hover:text-black z-10"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </Button>
            <img
              src={selectedImage}
              alt="Imagen en tamaño completo"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
        </div>
    );
}
