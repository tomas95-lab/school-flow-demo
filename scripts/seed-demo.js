/* eslint-disable no-console */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.')
    process.exit(1)
  }

  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  const db = getFirestore()

  const batch = db.batch()

  const users = [
    { id: 'admin1', role: 'admin', name: 'Admin Uno', email: 'admin1@example.com' },
    { id: 'doc1', role: 'docente', name: 'Docente Uno', email: 'doc1@example.com' },
    { id: 'doc2', role: 'docente', name: 'Docente Dos', email: 'doc2@example.com' },
    { id: 'al1', role: 'alumno', name: 'Alumno Uno', email: 'al1@example.com' },
    { id: 'al2', role: 'alumno', name: 'Alumno Dos', email: 'al2@example.com' },
    { id: 'al3', role: 'alumno', name: 'Alumno Tres', email: 'al3@example.com' },
  ]
  users.forEach(u => batch.set(db.collection('users').doc(u.id), u))

  const courses = [
    { id: 'c1', nombre: 'Matemática', division: '1A', teacherId: 'doc1' },
    { id: 'c2', nombre: 'Lengua', division: '1B', teacherId: 'doc2' },
  ]
  courses.forEach(c => batch.set(db.collection('courses').doc(c.id), c))

  const convRef = db.collection('conversations').doc('conv1')
  batch.set(convRef, { title: 'Demo Chat', members: ['doc1','al1'], createdBy: 'doc1', createdAt: new Date() })
  batch.set(convRef.collection('messages').doc(), { text: 'Hola!', senderId: 'doc1', createdAt: new Date() })

  const announcements = [
    { title: 'Bienvenida', content: 'Comenzamos el ciclo lectivo', targetRole: 'all', createdAt: new Date(), createdBy: 'admin1' },
    { title: 'Reunión Docentes', content: 'Viernes 10hs', targetRole: 'docente', createdAt: new Date(), createdBy: 'admin1' },
  ]
  announcements.forEach(a => batch.set(db.collection('announcements').doc(), a))

  await batch.commit()
  console.log('Seed demo data completed')
}

main().catch((e) => { console.error(e); process.exit(1) })


