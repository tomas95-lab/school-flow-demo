import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionsToInit = [
  { name: "tareas", icon: "📚" },
  { name: "conversaciones_familias", icon: "💬" },
  { name: "mensajes_familias", icon: "📩" },
  { name: "reuniones_familias", icon: "📅" }
];

async function initCollections() {
  console.log('\n🚀 Inicializando colecciones en Firestore...\n');

  for (const col of collectionsToInit) {
    try {
      await addDoc(collection(db, col.name), {
        _init: true,
        createdAt: serverTimestamp()
      });
      console.log(`${col.icon} ${col.name} ✅`);
    } catch (error) {
      console.error(`${col.icon} ${col.name} ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Proceso completado\n');
  process.exit(0);
}

initCollections();

