import { db } from "./firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function seedFirestore() {
  const studentId = "exampleStudent";
  const courseId = "exampleCourse";
  const sectionId = "exampleSection";
  const conversationId = "exampleConversation";

  // users (admin, docente, familiar)
  await setDoc(doc(db, "users", "exampleAdmin"), {
    displayName: "Admin Ejemplo",
    role: "admin",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "exampleDocente"), {
    displayName: "Docente Ejemplo",
    role: "docente",
    assignedSectionIds: [],
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", "exampleFamiliar"), {
    displayName: "Familiar Ejemplo",
    role: "familiar",
    childrenIds: [studentId],
    createdAt: serverTimestamp(),
  });

  // students
  await setDoc(doc(db, "students", studentId), {
    firstName: "Juan",
    lastName: "Pérez",
    familyId: "exampleFamiliar",
    gradeLevel: "1°",
    createdAt: serverTimestamp(),
  });

  // subcolecciones: attendances, grades, alerts, reports
  await setDoc(doc(db, "students", studentId, "attendances", "a1"), {
    sectionId,
    date: serverTimestamp(),
    present: true,
    recordedBy: "exampleDocente",
  });

  await setDoc(doc(db, "students", studentId, "grades", "g1"), {
    subjectId: courseId,
    sectionId,
    period: "Q1",
    value: 8,
    recordedBy: "exampleDocente",
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "students", studentId, "alerts", "alert1"), {
    type: "ausencias",
    message: "Faltó 3 días seguidos",
    triggeredAt: serverTimestamp(),
    readByFamily: false,
    readByDocente: false,
  });

  await setDoc(doc(db, "students", studentId, "reports", "r1"), {
    type: "perfil",
    content: "Buen desempeño general.",
    generatedAt: serverTimestamp(),
    generatedBy: "IA",
  });

  // course + subcolección section
  await setDoc(doc(db, "courses", courseId), {
    name: "Matemáticas",
    gradingScale: { min: 0, max: 10 },
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "courses", courseId, "sections", sectionId), {
    name: "Sección A",
    teacherId: "exampleDocente",
    schedule: { days: ["Lunes", "Miércoles"], time: "08:00–10:00" },
    createdAt: serverTimestamp(),
  });

  // enrollment (opcional)
  await setDoc(doc(db, "courses", courseId, "sections", sectionId, "enrollments", "e1"), {
    studentId,
    enrolledAt: serverTimestamp(),
    status: "activo",
  });

  // conversation + messages
  await setDoc(doc(db, "conversations", conversationId), {
    memberIds: ["exampleDocente", "exampleFamiliar"],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });

  await setDoc(doc(db, "conversations", conversationId, "messages", "m1"), {
    senderId: "exampleDocente",
    text: "Hola, ¿cómo va Juan?",
    sentAt: serverTimestamp(),
  });

  // config global
  await setDoc(doc(db, "config", "global"), {
    attendanceThreshold: 3,
    gradeThreshold: 6,
    summaryPromptTemplate: "Resumí esta conversación de manera formal.",
    alertPromptTemplate: "Generá una alerta con este dato.",
    reportPromptTemplate: "Generá un reporte integral.",
    updatedAt: serverTimestamp(),
  });

  // notification (opcional)
  await setDoc(doc(db, "notifications", "n1"), {
    type: "alerta",
    recipientId: "exampleFamiliar",
    payload: { studentId, alertId: "alert1" },
    sentAt: serverTimestamp(),
    read: false,
  });

  console.log("✅ Firestore inicializado con datos de ejemplo.");
}

seedFirestore();
