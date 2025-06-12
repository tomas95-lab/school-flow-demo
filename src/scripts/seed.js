import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export async function createCourse(nombre, division, año) {
  try {
    const docRef = await addDoc(collection(db, "courses"), {
      nombre,
      division,
      año,
      creadoEn: serverTimestamp(),
    });
    console.log("✅ Curso creado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error al crear el curso:", error);
  }
}

