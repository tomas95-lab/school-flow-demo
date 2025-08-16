import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/firebaseConfig";

export async function uploadFileAndGetUrl(path: string, file: File): Promise<string> {
  // Ensure Firebase app is initialized by importing db; then use default app instance
  void db;
  const storage = getStorage();
  const fileRef = ref(storage, path);
  const result = await uploadBytes(fileRef, file);
  const url = await getDownloadURL(result.ref);
  return url;
}

export function buildInscripcionFilePath(inscripcionId: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const timestamp = Date.now();
  return `inscripciones/${inscripcionId}/${timestamp}-${sanitized}`;
}


