import { db } from '@/firebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, type QueryConstraint } from 'firebase/firestore';
import type { CollectionName, DocumentOf } from '@/types/schema';

export type FirestoreDoc<T> = T & { firestoreId: string };

export async function getCollection<C extends CollectionName>(
  name: C,
  constraints: QueryConstraint[] = []
): Promise<Array<FirestoreDoc<DocumentOf<C>>>> {
  const colRef = collection(db, name);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as DocumentOf<C>), firestoreId: d.id }));
}

export async function addDocument<C extends CollectionName>(
  name: C,
  data: Omit<DocumentOf<C>, 'firestoreId'>
): Promise<string> {
  const colRef = collection(db, name);
  const res = await addDoc(colRef, {
    ...(data as object),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return res.id;
}

export async function updateDocument<C extends CollectionName>(
  name: C,
  id: string,
  data: Partial<DocumentOf<C>>
): Promise<void> {
  const ref = doc(db, name, id);
  await updateDoc(ref, {
    ...(data as object),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument<C extends CollectionName>(name: C, id: string): Promise<void> {
  const ref = doc(db, name, id);
  await deleteDoc(ref);
}


