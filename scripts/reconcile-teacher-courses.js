/* eslint-disable no-console */
import 'dotenv/config'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

async function ensureInitialized() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.')
    process.exit(1)
  }
  if (getApps().length === 0) {
    initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) })
  }
}

function normalizeId(id) {
  return typeof id === 'string' ? id.trim() : id
}

async function main() {
  await ensureInitialized()
  const db = getFirestore()

  const teacherIdFocus = process.env.TEACHER_ID || ''

  const teachersSnap = teacherIdFocus
    ? await db.collection('teachers').where('__name__', '==', teacherIdFocus).get()
    : await db.collection('teachers').get()

  const coursesSnap = await db.collection('courses').get()
  const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  let updates = 0
  for (const tDoc of teachersSnap.docs) {
    const tData = tDoc.data()
    const tId = tDoc.id
    const currentCursoId = Array.isArray(tData.cursoId)
      ? tData.cursoId.map(normalizeId)
      : (tData.cursoId ? [normalizeId(tData.cursoId)] : [])

    const ownedCourseIds = courses
      .filter(c => normalizeId(c.teacherId) === tId)
      .map(c => c.id)

    // Merge: prefer real ownership by teacherId; keep existing if valid
    const validExisting = currentCursoId.filter(id => courses.some(c => c.id === id))
    const merged = Array.from(new Set([...validExisting, ...ownedCourseIds]))

    // Only update if different
    const isDifferent = merged.length !== currentCursoId.length || merged.some((id, i) => id !== currentCursoId[i])

    if (isDifferent) {
      console.log(`Updating teacher ${tId} cursoId =>`, merged)
      await tDoc.ref.update({ cursoId: merged })
      updates++
    } else {
      console.log(`Teacher ${tId} already consistent.`)
    }
  }

  console.log(`Done. Teachers updated: ${updates}`)
}

main().catch((e) => { console.error(e); process.exit(1) })


