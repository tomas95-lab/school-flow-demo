import { useEffect, useState, useContext, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { AuthContext } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc, getDocs, where, documentId, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ConversationDetailProps = {
  conversationId: string;
  title?: string;
  onBack: () => void;
};

export default function ConversationDetail({ conversationId, title, onBack }: ConversationDetailProps) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; senderId: string; createdAt?: any; readBy?: string[] }>>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [members, setMembers] = useState<Array<{ uid: string; name: string; email?: string; role?: string }>>([]);
  const [resolvedTitle, setResolvedTitle] = useState<string | undefined>(title);
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const typingTimerRef = useRef<any>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  // Validate membership and preload conversation meta
  useEffect(() => {
    const checkMembership = async () => {
      if (!conversationId || !user) return;
      try {
        const conv = await getDoc(doc(db, "conversations", conversationId));
        if (!conv.exists()) {
          setIsMember(false);
          return;
        }
        const data = conv.data() || {};
        const memberIds: string[] = Array.isArray(data.members) ? data.members : [];
        setIsMember(memberIds.includes(user.uid));
        if (!resolvedTitle && typeof data.title === 'string') {
          setResolvedTitle(data.title);
        }
      } catch {
        setIsMember(false);
      }
    };
    checkMembership();
  }, [conversationId, user?.uid]);

  useEffect(() => {
    if (!conversationId || !isMember) return;
    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q as any, (snap: any) => {
      setMessages((snap.docs as any[]).map((d: any) => ({ id: d.id, ...(d.data() || {}) })));
      // scroll bottom after slight delay
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [conversationId, isMember]);

  // Load members and optional conversation title
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const conv = await getDoc(doc(db, "conversations", conversationId));
        if (!conv.exists()) return;
        const data = conv.data() || {};
        const memberIds: string[] = Array.isArray(data.members) ? data.members : [];
        if (memberIds.length === 0) {
          setMembers([]);
          return;
        }
        let users: Array<{ uid: string; name: string; email?: string; role?: string }> = [];
        if (memberIds.length <= 10) {
          const qs = query(collection(db, "users"), where(documentId(), "in", memberIds));
          const snap = await getDocs(qs as any);
          users = snap.docs.map((d: any) => ({
            uid: d.id,
            name: (d.data()?.name || d.data()?.nombre || "Usuario") as string,
            email: d.data()?.email,
            role: d.data()?.role,
          }));
        } else {
          // fallback for >10 members
          const results = await Promise.all(memberIds.map(async (id) => {
            const u = await getDoc(doc(db, "users", id));
            return u.exists() ? {
              uid: u.id,
              name: (u.data()?.name || u.data()?.nombre || "Usuario") as string,
              email: u.data()?.email,
              role: u.data()?.role,
            } : null;
          }));
          users = results.filter(Boolean) as any;
        }
        setMembers(users);
      } catch (e) {
        // noop
      }
    };
    loadMembers();
  }, [conversationId]);

  // Subscribe to typing indicators from other members
  useEffect(() => {
    if (!conversationId || !user || !isMember) return;
    const typingCol = collection(db, `conversations/${conversationId}/typing`);
    const unsub = onSnapshot(typingCol as any, (snap: any) => {
      const now = Date.now();
      const active = (snap.docs as any[])
        .map((d: any) => ({ id: d.id, ...(d.data() || {}) }))
        .filter((t: any) => t.id !== user.uid)
        .filter((t: any) => {
          const ts = t.updatedAt?.toDate ? t.updatedAt.toDate().getTime() : (typeof t.updatedAt === 'number' ? t.updatedAt : 0);
          return now - ts < 5000; // last 5s
        })
        .map((t: any) => t.name || "Usuario");
      setOthersTyping(active);
    });
    return () => unsub();
  }, [conversationId, user?.uid, isMember]);

  // Mark messages as read when they appear
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || messages.length === 0 || !isMember) return;
      const myId = user.uid;
      const toMark = messages.filter(m => m.senderId !== myId && !(m.readBy || []).includes(myId));
      // Limit to avoid excessive writes
      const latestToMark = toMark.slice(-20);
      await Promise.all(latestToMark.map(async (m) => {
        try {
          await updateDoc(doc(db, `conversations/${conversationId}/messages`, m.id), {
            readBy: arrayUnion(myId)
          });
        } catch {
          // ignore
        }
      }));
      try {
        await updateDoc(doc(db, "conversations", conversationId), {
          ["reads." + myId]: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    };
    markAsRead();
  }, [messages, conversationId, user?.uid]);

  const emitTyping = async () => {
    if (!user || !isMember) return;
    try {
      await setDoc(doc(db, `conversations/${conversationId}/typing`, user.uid), {
        updatedAt: serverTimestamp(),
        name: user.name || user.email || "Usuario"
      }, { merge: true });
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    if (!isMember) {
      toast.error("No tienes acceso a esta conversación");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        text: text.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });
      try {
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessageText: text.trim(),
          lastMessageSenderId: user.uid,
          lastMessageAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
      setText("");
    } catch (e) {
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Card className="border">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center gap-2 justify-between">
          <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base sm:text-lg truncate">{resolvedTitle || "Conversación"}</CardTitle>
        </div>
        {members.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {members.map((m) => (
              <div key={m.uid} className="flex items-center gap-2 bg-gray-50 border rounded-full px-2 py-1 whitespace-nowrap">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{(m.name || "U").split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-700">{m.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[45vh] sm:h-[50vh] md:h-[60vh] overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md">
          {messages.map((m) => {
            const mine = m.senderId === user?.uid;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className={`mt-1 text-[10px] opacity-80 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                    {m.createdAt?.toDate ? format(m.createdAt.toDate(), "dd MMM HH:mm", { locale: es }) : 'Enviando...'}
                    {mine && (
                      <>
                        {' '}
                        {(() => {
                          const others = (m.readBy || []).filter(uid => uid !== user?.uid);
                          if (others.length > 0) return '• Leído';
                          return '• Enviado';
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        {othersTyping.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {othersTyping.join(', ')} está escribiendo...
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              emitTyping();
              typingTimerRef.current = setTimeout(() => {
                // typing timeout; no-op, indicator handled by time checks
              }, 1500);
            }}
            placeholder="Escribe un mensaje"
            className="min-h-[44px] h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!text.trim() || sending} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


