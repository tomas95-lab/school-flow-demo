import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  limit
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

async function collectionExists(collectionName) {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    return false;
  }
}

async function initTareas() {
  console.log('📚 Inicializando colección: tareas...');
  
  const exists = await collectionExists('tareas');
  if (exists) {
    console.log('✓ La colección "tareas" ya existe, saltando...');
    return;
  }

  const tareas = [
    {
      title: "Trabajo Práctico N°1 - Matemáticas",
      description: "Resolver los ejercicios del capítulo 3: Ecuaciones lineales. Incluir desarrollo completo.",
      courseId: "demo-course-1",
      subjectId: "demo-subject-1",
      teacherId: "demo-teacher-1",
      studentIds: ["demo-student-1", "demo-student-2"],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      points: 100,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: "Ensayo sobre la Revolución Francesa",
      description: "Escribir un ensayo de 3 páginas sobre las causas y consecuencias de la Revolución Francesa.",
      courseId: "demo-course-1",
      subjectId: "demo-subject-2",
      teacherId: "demo-teacher-1",
      studentIds: ["demo-student-1", "demo-student-2"],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      points: 150,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    {
      title: "Experimento de Física - Movimiento",
      description: "Realizar el experimento de caída libre y presentar informe con gráficos.",
      courseId: "demo-course-1",
      subjectId: "demo-subject-3",
      teacherId: "demo-teacher-1",
      studentIds: ["demo-student-1", "demo-student-2"],
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      points: 120,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  ];

  for (const tarea of tareas) {
    await addDoc(collection(db, 'tareas'), tarea);
  }

  console.log(`✅ Creadas ${tareas.length} tareas de ejemplo`);
}

async function initConversacionesFamilias() {
  console.log('💬 Inicializando colección: conversaciones_familias...');
  
  const exists = await collectionExists('conversaciones_familias');
  if (exists) {
    console.log('✓ La colección "conversaciones_familias" ya existe, saltando...');
    return;
  }

  const conversaciones = [
    {
      familiarId: "demo-familiar-1",
      teacherId: "demo-teacher-1",
      studentId: "demo-student-1",
      asunto: "Consulta sobre rendimiento académico",
      ultimoMensaje: "Buenos días, quisiera hablar sobre las últimas calificaciones...",
      fecha: new Date().toISOString(),
      leido: false,
      prioridad: "media",
      status: "abierta",
      createdAt: serverTimestamp()
    },
    {
      familiarId: "demo-familiar-2",
      teacherId: "demo-teacher-1",
      studentId: "demo-student-2",
      asunto: "Seguimiento de asistencias",
      ultimoMensaje: "Hola, quería consultar sobre las inasistencias recientes...",
      fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      leido: true,
      prioridad: "alta",
      status: "abierta",
      createdAt: serverTimestamp()
    }
  ];

  for (const conv of conversaciones) {
    await addDoc(collection(db, 'conversaciones_familias'), conv);
  }

  console.log(`✅ Creadas ${conversaciones.length} conversaciones de ejemplo`);
}

async function initMensajesFamilias() {
  console.log('📩 Inicializando colección: mensajes_familias...');
  
  const exists = await collectionExists('mensajes_familias');
  if (exists) {
    console.log('✓ La colección "mensajes_familias" ya existe, saltando...');
    return;
  }

  const conversacionesSnapshot = await getDocs(collection(db, 'conversaciones_familias'));
  
  if (conversacionesSnapshot.empty) {
    console.log('⚠️  No hay conversaciones creadas aún. Se crearán mensajes sin conversación específica.');
    return;
  }

  const conversacionId = conversacionesSnapshot.docs[0].id;

  const mensajes = [
    {
      conversacionId: conversacionId,
      senderId: "demo-familiar-1",
      senderName: "María González",
      senderRole: "familiar",
      message: "Buenos días profesor, quisiera hablar sobre el rendimiento de mi hijo en matemáticas.",
      timestamp: serverTimestamp()
    },
    {
      conversacionId: conversacionId,
      senderId: "demo-teacher-1",
      senderName: "Prof. Juan Pérez",
      senderRole: "docente",
      message: "Buenos días María! Con gusto. Su hijo está progresando bien, aunque necesita reforzar algunos conceptos.",
      timestamp: serverTimestamp()
    },
    {
      conversacionId: conversacionId,
      senderId: "demo-familiar-1",
      senderName: "María González",
      senderRole: "familiar",
      message: "¿Hay algo específico en lo que pueda ayudarlo desde casa?",
      timestamp: serverTimestamp()
    }
  ];

  for (const mensaje of mensajes) {
    await addDoc(collection(db, 'mensajes_familias'), mensaje);
  }

  console.log(`✅ Creados ${mensajes.length} mensajes de ejemplo`);
}

async function initReunionesFamilias() {
  console.log('📅 Inicializando colección: reuniones_familias...');
  
  const exists = await collectionExists('reuniones_familias');
  if (exists) {
    console.log('✓ La colección "reuniones_familias" ya existe, saltando...');
    return;
  }

  const reuniones = [
    {
      teacherId: "demo-teacher-1",
      familiarId: "demo-familiar-1",
      studentId: "demo-student-1",
      fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      motivo: "Reunión de seguimiento académico del primer trimestre",
      status: "programada",
      notas: "",
      createdAt: serverTimestamp()
    },
    {
      teacherId: "demo-teacher-1",
      familiarId: "demo-familiar-2",
      studentId: "demo-student-2",
      fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      motivo: "Charla sobre comportamiento en clase",
      status: "programada",
      notas: "",
      createdAt: serverTimestamp()
    },
    {
      teacherId: "demo-teacher-1",
      familiarId: "demo-familiar-1",
      studentId: "demo-student-1",
      fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      motivo: "Reunión inicial del año lectivo",
      status: "realizada",
      notas: "Reunión exitosa. Se establecieron objetivos del año.",
      createdAt: serverTimestamp()
    }
  ];

  for (const reunion of reuniones) {
    await addDoc(collection(db, 'reuniones_familias'), reunion);
  }

  console.log(`✅ Creadas ${reuniones.length} reuniones de ejemplo`);
}

async function main() {
  console.log('\n🚀 Iniciando creación de colecciones en Firestore...\n');
  console.log('📍 Proyecto:', firebaseConfig.projectId);
  console.log('');

  try {
    await initTareas();
    await initConversacionesFamilias();
    await initMensajesFamilias();
    await initReunionesFamilias();

    console.log('\n✅ ¡Todas las colecciones se han inicializado correctamente!');
    console.log('\n📋 Resumen:');
    console.log('   - tareas');
    console.log('   - conversaciones_familias');
    console.log('   - mensajes_familias');
    console.log('   - reuniones_familias');
    console.log('\n🎉 Puedes ahora usar los módulos de Tareas y Comunicación con Familias.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error);
    process.exit(1);
  }
}

main();

