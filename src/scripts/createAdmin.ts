import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

async function createAdminUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "director@gmail.com",
      "administrador"
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "admin",
    });

    console.log("Usuario admin creado con éxito");
  } catch (error) {
    console.error("Error al crear el usuario:", error);
  }
}

createAdminUser();
