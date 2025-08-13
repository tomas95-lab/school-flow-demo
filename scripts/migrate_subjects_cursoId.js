// Normaliza subjects.cursoId para que siempre sea string (firestoreId de course)
// Uso: node scripts/migrate_subjects_cursoId.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const subsSnap = await getDocs(collection(db, 'subjects'));

  let fixed = 0;
  for (const d of subsSnap.docs) {
    const data = d.data();
    const raw = data.cursoId;
    let normalized = undefined;
    if (Array.isArray(raw)) {
      normalized = raw.find((x) => typeof x === 'string' && x.trim()) || null;
    } else if (typeof raw === 'string') {
      normalized = raw.trim();
    }
    if (normalized && normalized !== raw) {
      await updateDoc(doc(db, 'subjects', d.id), { cursoId: normalized });
      fixed++;
      console.log(`Updated subject ${d.id} -> cursoId=${normalized}`);
    }
  }
  console.log(`Done. Updated ${fixed} subjects.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


