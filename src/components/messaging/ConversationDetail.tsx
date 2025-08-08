import { useEffect, useState, useContext, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { AuthContext } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, doc, getDoc, getDocs, where, documentId } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../ui/avatar";

type ConversationDetailProps = {
  conversationId: string;
  title?: string;
  onBack: () => void;
};

export default function ConversationDetail({ conversationId, title, onBack }: ConversationDetailProps) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; senderId: string; createdAt?: any }>>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [members, setMembers] = useState<Array<{ uid: string; name: string; email?: string; role?: string }>>([]);
  const [resolvedTitle, setResolvedTitle] = useState<string | undefined>(title);

  useEffect(() => {
    if (!conversationId) return;
    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q as any, (snap: any) => {
      setMessages((snap.docs as any[]).map((d: any) => ({ id: d.id, ...(d.data() || {}) })));
      // scroll bottom after slight delay
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [conversationId]);

  // Load members and optional conversation title
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const conv = await getDoc(doc(db, "conversations", conversationId));
        if (!conv.exists()) return;
        const data = conv.data() || {};
        const memberIds: string[] = Array.isArray(data.members) ? data.members : [];
        if (!resolvedTitle && typeof data.title === 'string') {
          setResolvedTitle(data.title);
        }
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
  }, [conversationId, resolvedTitle]);

  const handleSend = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        text: text.trim(),
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
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
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje"
            className="min-h-[44px] h-[44px] resize-none"
          />
          <Button onClick={handleSend} disabled={!text.trim() || sending} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


