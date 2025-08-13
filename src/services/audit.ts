import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/firebaseConfig"

type AuditLog = {
  action: string
  entity: string
  entityId?: string
  details?: any
  userId?: string | null
  userEmail?: string | null
  createdAt: any
}

export async function logAudit(action: string, entity: string, entityId?: string, details?: any) {
  const user = auth.currentUser
  const payload: AuditLog = {
    action,
    entity,
    entityId,
    details: details ?? {},
    userId: user?.uid ?? null,
    userEmail: user?.email ?? null,
    createdAt: serverTimestamp(),
  }
  await addDoc(collection(db, 'auditLogs'), payload)
}


