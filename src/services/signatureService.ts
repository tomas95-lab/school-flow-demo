import { db } from '@/firebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';

export type SignatureRole = 'director' | 'vicedirector' | 'secretaria' | 'tutor';

export interface DigitalSignature {
  id?: string;
  boletinId: string; // `${alumnoId}_${periodo}`
  signerUserId: string; // uid
  signerName: string;
  role: SignatureRole;
  signedAt: string; // ISO
  signatureImageUrl?: string; // opcional (firma dibujada/escaneada)
}

export interface SignaturePolicy {
  enabled: boolean;
  requiredRoles: SignatureRole[]; // para que quede "completo" el boletín
  allowParentSignature: boolean; // permite firma del tutor
}

const defaultPolicy: SignaturePolicy = {
  enabled: false,
  requiredRoles: ['director'],
  allowParentSignature: true,
};

export async function getSignaturePolicy(): Promise<SignaturePolicy> {
  try {
    const ref = doc(db, 'configuracion', 'signaturePolicy');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...defaultPolicy, ...(snap.data() as Partial<SignaturePolicy>) };
    }
  } catch {
    // ignore
  }
  return defaultPolicy;
}

export async function saveSignaturePolicy(policy: SignaturePolicy): Promise<void> {
  await setDoc(doc(db, 'configuracion', 'signaturePolicy'), policy, { merge: true });
}

export async function addSignature(sig: Omit<DigitalSignature, 'id' | 'signedAt'>): Promise<string> {
  const payload: Omit<DigitalSignature, 'id'> = {
    ...sig,
    signedAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'boletinesFirmas'), payload);
  return ref.id;
}

export async function removeSignature(signatureId: string): Promise<void> {
  await deleteDoc(doc(db, 'boletinesFirmas', signatureId));
}

export async function markBoletinSignedStatus(boletinDocId: string, isFullySigned: boolean): Promise<void> {
  await updateDoc(doc(db, 'boletines', boletinDocId), {
    fullySigned: isFullySigned,
    lastSignatureAt: new Date().toISOString(),
  });
}

export async function getSignaturesFor(boletinId: string): Promise<DigitalSignature[]> {
  const q = query(collection(db, 'boletinesFirmas'), where('boletinId', '==', boletinId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<DigitalSignature, 'id'>) }));
}


