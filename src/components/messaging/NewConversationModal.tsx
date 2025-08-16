import { useState, useContext } from "react";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { AuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import Combobox from "@/components/Combobox";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";

type NewConversationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
};

export default function NewConversationModal({ open, onOpenChange, onCreated }: NewConversationModalProps) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: users } = useFirestoreCollection("users", { enableCache: true });

  const handleCreate = async () => {
    if (!user) {
      toast.error("Inicia sesión para crear una conversación");
      return;
    }
    // Permisos: admin/docente/alumno pueden crear conversaciones directas
    if (!['admin', 'docente', 'alumno', 'familiar'].includes(user.role)) {
      toast.error("No tienes permisos para crear conversaciones");
      return;
    }
    if (!title.trim() || !recipientId.trim()) {
      toast.error("Completa el título y el destinatario");
      return;
    }
    setSubmitting(true);
    try {
      const convRef = await addDoc(collection(db, "conversations"), {
        title: title.trim(),
        members: [user.uid, recipientId.trim()],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      });
      if (firstMessage.trim()) {
        await addDoc(collection(db, `conversations/${convRef.id}/messages`), {
          text: firstMessage.trim(),
          senderId: user.uid,
          createdAt: serverTimestamp(),
          readBy: [user.uid],
        });
        try {
          await updateDoc(doc(db, "conversations", convRef.id), {
            lastMessageText: firstMessage.trim(),
            lastMessageSenderId: user.uid,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch {
          console.warn('Error actualizando lastMessage en conversaciones existentes')
        }
      }
      toast.success("Conversación creada");
      onOpenChange(false);
      setTitle("");
      setRecipientId("");
      setFirstMessage("");
      onCreated?.();
    } catch (e: any) {
      console.error("Create conversation error", e);
      const description = e?.code ? `${e.code}: ${e.message || ""}` : undefined;
      toast.error("No se pudo crear la conversación", { description });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReutilizableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva conversación"
      description="Inicia un chat directo con otro usuario ingresando su ID"
      content={
      <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Asunto del chat" />
          </div>
          <div>
          <label className="text-sm text-gray-700">Destinatario</label>
          <Combobox
            items={(users || [])
              .filter((u: any) => u.firestoreId !== user?.uid)
              .map((u: any) => ({ value: u.firestoreId, label: `${u.name || u.nombre || "Usuario"} (${u.email || "sin email"})` }))}
            value={recipientId}
            onChange={setRecipientId}
            placeholder="Selecciona un usuario"
            searchPlaceholder="Buscar usuario..."
            emptyText="Sin resultados"
          />
          </div>
          <div>
            <label className="text-sm text-gray-700">Primer mensaje (opcional)</label>
            <Textarea value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} placeholder="Escribe un mensaje" />
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={submitting || !title.trim() || !recipientId.trim()}>
            {submitting ? "Creando..." : "Crear"}
          </Button>
        </div>
      }
      background={false}
      small={false}
    />
  );
}


