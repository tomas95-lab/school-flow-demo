/* eslint-disable no-console */
import fs from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

async function ensureInitialized() {
	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file.')
		process.exit(1)
	}
	let credentials
	try {
		const json = fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
		credentials = JSON.parse(json)
	} catch (e) {
		console.error('Failed to read service account file at GOOGLE_APPLICATION_CREDENTIALS')
		process.exit(1)
	}
	initializeApp({ credential: cert(credentials) })
}

async function upsertAuthUser(auth, { email, password, displayName }) {
	try {
		const existing = await auth.getUserByEmail(email)
		return existing.uid
	} catch {
		const created = await auth.createUser({ email, password, displayName, emailVerified: false, disabled: false })
		return created.uid
	}
}

async function main() {
	await ensureInitialized()
	const auth = getAuth()
	const db = getFirestore()

	const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'password123'

	// 1) Crear/asegurar usuarios de Auth y mapear sus UIDs
	const usersSpec = [
		{ key: 'admin1', role: 'admin', name: 'Admin Uno', email: 'admin1@example.com' },
		{ key: 'doc1', role: 'docente', name: 'Docente Uno', email: 'doc1@example.com' },
		{ key: 'doc2', role: 'docente', name: 'Docente Dos', email: 'doc2@example.com' },
		{ key: 'al1', role: 'alumno', name: 'Alumno Uno', email: 'al1@example.com' },
		{ key: 'al2', role: 'alumno', name: 'Alumno Dos', email: 'al2@example.com' },
		{ key: 'al3', role: 'alumno', name: 'Alumno Tres', email: 'al3@example.com' },
	]

	const labelToUid = new Map()
	for (const u of usersSpec) {
		const uid = await upsertAuthUser(auth, { email: u.email, password: DEMO_PASSWORD, displayName: u.name })
		labelToUid.set(u.key, uid)
	}

	// 2) Poblar Firestore coherente con UIDs reales
	const batch = db.batch()

	// users/{uid}
	for (const u of usersSpec) {
		const uid = labelToUid.get(u.key)
		const data = { role: u.role, name: u.name, email: u.email, status: 'active', lastLogin: null }
		batch.set(db.collection('users').doc(uid), data, { merge: true })
	}

	// teachers y students con id = uid correspondiente
	const teacherKeys = ['doc1', 'doc2']
	for (const t of teacherKeys) {
		const uid = labelToUid.get(t)
		if (uid) {
			batch.set(db.collection('teachers').doc(uid), { nombre: usersSpec.find(x => x.key === t)?.name || 'Docente', subjects: [] })
		}
	}
	const studentKeys = ['al1', 'al2', 'al3']
	for (const s of studentKeys) {
		const uid = labelToUid.get(s)
		if (uid) {
			batch.set(db.collection('students').doc(uid), { nombre: usersSpec.find(x => x.key === s)?.name || 'Alumno', cursoId: 'c1', email: usersSpec.find(x => x.key === s)?.email })
		}
	}

	// Enlazar teacherId/studentId en users
	for (const t of teacherKeys) {
		const uid = labelToUid.get(t)
		if (uid) batch.set(db.collection('users').doc(uid), { teacherId: uid }, { merge: true })
	}
	for (const s of studentKeys) {
		const uid = labelToUid.get(s)
		if (uid) batch.set(db.collection('users').doc(uid), { studentId: uid }, { merge: true })
	}

	// courses y subjects referencian teacherId con UIDs reales
	const c1 = { id: 'c1', nombre: '1°A', division: 'A', año: 1, teacherId: labelToUid.get('doc1') }
	const c2 = { id: 'c2', nombre: '1°B', division: 'B', año: 1, teacherId: labelToUid.get('doc2') }
	batch.set(db.collection('courses').doc(c1.id), c1)
	batch.set(db.collection('courses').doc(c2.id), c2)

	const s1 = { id: 's1', nombre: 'Matemática', cursoId: 'c1', teacherId: labelToUid.get('doc1') }
	const s2 = { id: 's2', nombre: 'Lengua', cursoId: 'c2', teacherId: labelToUid.get('doc2') }
	batch.set(db.collection('subjects').doc(s1.id), s1)
	batch.set(db.collection('subjects').doc(s2.id), s2)

	// conversations + messages demo (members = UIDs)
	const convRef = db.collection('conversations').doc('conv1')
	batch.set(convRef, { title: 'Demo Chat', members: [labelToUid.get('doc1'), labelToUid.get('al1')].filter(Boolean), createdBy: labelToUid.get('doc1'), createdAt: new Date() })
	batch.set(convRef.collection('messages').doc(), { text: 'Hola!', senderId: labelToUid.get('doc1'), createdAt: new Date() })

	// announcements (createdBy = admin UID)
	const announcements = [
		{ title: 'Bienvenida', content: 'Comenzamos el ciclo lectivo', targetRole: 'all', createdAt: new Date(), createdBy: labelToUid.get('admin1') },
		{ title: 'Reunión Docentes', content: 'Viernes 10hs', targetRole: 'docente', createdAt: new Date(), createdBy: labelToUid.get('admin1') },
	]
	announcements.forEach(a => batch.set(db.collection('announcements').doc(), a))

	await batch.commit()
	console.log('Seed demo data completed (Auth + Firestore aligned)')
}

main().catch((e) => { console.error(e); process.exit(1) })


