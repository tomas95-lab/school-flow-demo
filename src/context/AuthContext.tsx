import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

type Role = "admin" | "docente" | "alumno";

type AppUser = {
  uid: string;
  email: string | null;
  name: string | null;
  role: Role;
  teacherId: string;
  studentId: string;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;

        if (role) {
          // Registrar último acceso
          try {
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              lastLogin: new Date().toISOString()
            });
          } catch (error) {
            console.error("Error updating last login:", error);
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role,
            teacherId: userDoc.exists() ? userDoc.data().teacherId : "",
            studentId: userDoc.exists() ? userDoc.data().studentId : "",
            name: userDoc.exists() ? userDoc.data().name : null
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
