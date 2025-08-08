import { useEffect, useState, useContext, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { AuthContext } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base sm:text-lg">{title || "Conversación"}</CardTitle>
        </div>
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


