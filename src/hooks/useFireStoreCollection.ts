import { useEffect, useState } from "react";
import { collection, onSnapshot, getFirestore } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";

export function useFirestoreCollection<T extends DocumentData & { firestoreId?: string }>(path: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        firestoreId: doc.id,
      }));
      setData(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}
