#!/usr/bin/env node

/**
 * 🌱 Seed Core Relations (Client SDK)
 * - Crea estructura mínima y relaciones robustas desde 0
 * - Mantiene 'users' existentes; crea teachers/courses/subjects/students/attendances/calificaciones de ejemplo
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function main() {
  if (!firebaseConfig?.projectId) {
    console.error('❌ Falta configuración de Firebase (.env.local)');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // IDs determinísticos
  const teacherId = 't_demo_1';
  const courseId = 'c_demo_1';
  const subjectId = 's_demo_1';
  const studentId = 'st_demo_1';
  const attendanceId = 'a_demo_1';
  const gradeId = 'g_demo_1';

  console.log('🌱 Creando relaciones core...');

  // Teacher (si no existe users/teacher, se usa colección teachers)
  await setDoc(doc(db, 'teachers', teacherId), {
    nombre: 'Docente Demo',
    apellido: 'Uno',
    email: 'docente.demo@example.com',
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Course
  await setDoc(doc(db, 'courses', courseId), {
    nombre: 'Curso Demo',
    division: 'A',
    año: new Date().getFullYear(),
    nivel: 'secundaria',
    teacherId,
    modalidad: 'presencial',
    turno: 'mañana',
    maxStudents: 30,
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Subject
  await setDoc(doc(db, 'subjects', subjectId), {
    nombre: 'Matemática',
    cursoId: courseId,
    teacherId,
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Student
  await setDoc(doc(db, 'students', studentId), {
    nombre: 'Alumno',
    apellido: 'Demo',
    email: 'alumno.demo@example.com',
    cursoId: courseId,
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Attendance (relaciones explícitas)
  await setDoc(doc(db, 'attendances', attendanceId), {
    studentId,
    courseId,
    subjectId,
    subject: 'Matemática',
    fecha: new Date().toISOString().slice(0, 10),
    present: true,
    createdAt: serverTimestamp(),
  });

  // Grade (calificaciones)
  await setDoc(doc(db, 'calificaciones', gradeId), {
    studentId,
    subjectId,
    Actividad: 'Evaluación Inicial',
    valor: 8,
    ausente: false,
    fecha: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
  });

  // Anuncio base (opcional)
  const annRef = doc(collection(db, 'announcements'));
  await setDoc(annRef, {
    title: 'Estructura base creada',
    content: 'Se inicializaron cursos, materias, estudiantes y relaciones.',
    targetRole: 'all',
    createdAt: serverTimestamp(),
    createdBy: 'system',
  });

  console.log('✅ Relaciones creadas con éxito.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });


