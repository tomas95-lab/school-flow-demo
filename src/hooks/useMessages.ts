import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Message {
  id: string;
  conversacionId: string;
  senderId: string;
  senderRole: string;
  text: string;
  createdAt: string;
  readBy?: string[];
}

export function useMessages(conversacionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversacionId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    
    try {
      const messagesRef = collection(db, "mensajes_familias");
      const q = query(
        messagesRef,
        where("conversacionId", "==", conversacionId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          
          msgs.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
          });
          
          setMessages(msgs);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching messages:", error);
          setMessages([]);
          setLoading(false);
        }
      );

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up message listener:", error);
      setLoading(false);
    }
  }, [conversacionId]);

  return { messages, loading };
}

