/**
 * Pseudo-script de seed para demo.
 * Requiere: GOOGLE_APPLICATION_CREDENTIALS (service account JSON).
 * Ejecutar con ts-node o transpilar a JS. Alternativa: usar `scripts/seed-demo.js` existente.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.')
    process.exit(1)
  }

  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string) })
  const db = getFirestore()

  const batch = db.batch()

  const users = [
    { id: 'admin1', role: 'admin', name: 'Admin Uno', email: 'admin1@example.com', status: 'active' },
    { id: 'doc1', role: 'docente', name: 'Docente Uno', email: 'doc1@example.com', status: 'active' },
    { id: 'doc2', role: 'docente', name: 'Docente Dos', email: 'doc2@example.com', status: 'active' },
    { id: 'al1', role: 'alumno', name: 'Alumno Uno', email: 'al1@example.com', status: 'active' },
    { id: 'al2', role: 'alumno', name: 'Alumno Dos', email: 'al2@example.com', status: 'active' },
  ]
  users.forEach((u) => batch.set(db.collection('users').doc(u.id), u))

  const courses = [
    { id: 'c1', nombre: '1°A', division: 'A', año: 1, teacherId: 'doc1' },
    { id: 'c2', nombre: '1°B', division: 'B', año: 1, teacherId: 'doc2' },
  ]
  courses.forEach((c) => batch.set(db.collection('courses').doc(c.id), c))

  const subjects = [
    { id: 's1', nombre: 'Matemática', cursoId: 'c1', teacherId: 'doc1' },
    { id: 's2', nombre: 'Lengua', cursoId: 'c2', teacherId: 'doc2' },
  ]
  subjects.forEach((s) => batch.set(db.collection('subjects').doc(s.id), s))

  const students = [
    { id: 'st1', nombre: 'Ana', apellido: 'García', cursoId: 'c1', email: 'ana@example.com', status: 'active' },
    { id: 'st2', nombre: 'Luis', apellido: 'Pérez', cursoId: 'c1', email: 'luis@example.com', status: 'active' },
    { id: 'st3', nombre: 'María', apellido: 'López', cursoId: 'c2', email: 'maria@example.com', status: 'active' },
  ]
  students.forEach((s) => batch.set(db.collection('students').doc(s.id), s))

  await batch.commit()
  console.log('Seed demo data completed (TS)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


