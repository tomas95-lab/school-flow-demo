import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your_api_key_here",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your_app_id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuración adicional para producción
if (import.meta.env.PROD) {
  // Configuraciones específicas para producción
  console.log('Running in production mode');
}

// Configuración para desarrollo
if (import.meta.env.DEV) {
  // Configuraciones específicas para desarrollo
  console.log('Running in development mode');
}

export default app; 