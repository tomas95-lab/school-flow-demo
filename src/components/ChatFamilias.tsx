import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { useMessages } from "@/hooks/useMessages";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { where as whereFirestore } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, User } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

interface Conversacion {
  firestoreId: string;
  familiarId: string;
  teacherId: string;
  studentId: string;
  asunto: string;
  ultimoMensaje: string;
  fecha: string;
  leido: boolean;
  status: 'abierta' | 'cerrada';
}

export default function ChatFamilias() {
  const { user } = useContext(AuthContext);
  const [selectedConversacion, setSelectedConversacion] = useState<Conversacion | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversaciones } = useFirestoreCollection<Conversacion>("conversaciones_familias", {
    constraints: user?.role === 'familiar'
      ? [whereFirestore('familiarId', '==', user?.uid || '')]
      : user?.role === 'docente' && user?.teacherId
        ? [whereFirestore('teacherId', '==', user.teacherId)]
        : [],
    enableCache: true,
    dependencies: [user?.role, user?.uid, user?.teacherId]
  });

  const { data: students } = useFirestoreCollection("students", { enableCache: true });
  
  const { messages } = useMessages(selectedConversacion?.firestoreId || null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversacion) return;

    try {
      await addDoc(collection(db, "mensajes_familias"), {
        conversacionId: selectedConversacion.firestoreId,
        senderId: user?.uid || "",
        senderName: user?.name || "Usuario",
        senderRole: user?.role || "",
        message: newMessage,
        timestamp: serverTimestamp()
      });

      setNewMessage("");
      toast.success("Mensaje enviado");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje");
    }
  };

  if (!conversaciones || conversaciones.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No hay conversaciones"
        description="Aún no tienes conversaciones activas"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Conversaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 p-4">
              {conversaciones.map((conv) => {
                const student = students?.find(s => s.firestoreId === conv.studentId);
                return (
                  <button
                    key={conv.firestoreId}
                    onClick={() => setSelectedConversacion(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversacion?.firestoreId === conv.firestoreId
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.asunto}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {student ? `${student.nombre} ${student.apellido}` : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{conv.ultimoMensaje}</p>
                      </div>
                      {!conv.leido && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        {selectedConversacion ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedConversacion.asunto}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {students?.find(s => s.firestoreId === selectedConversacion.studentId)?.nombre}
                  </p>
                </div>
                <Badge variant={selectedConversacion.status === 'abierta' ? 'default' : 'secondary'}>
                  {selectedConversacion.status === 'abierta' ? 'Abierta' : 'Cerrada'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwnMessage = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                            {msg.timestamp?.toDate?.()?.toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) || 'Enviando...'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={selectedConversacion.status === 'cerrada'}
                  />
                  <Button type="submit" size="icon" disabled={selectedConversacion.status === 'cerrada'}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="Selecciona una conversación"
              description="Elige una conversación de la lista para comenzar a chatear"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

