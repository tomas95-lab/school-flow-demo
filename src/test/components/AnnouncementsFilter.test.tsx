import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import AnnouncementsView from '../../components/messaging/AnnouncementsView'
import { AuthContext } from '../../context/AuthContext'

vi.mock('firebase/firestore', async () => {
  const mod: any = {}
  mod.getFirestore = () => ({})
  mod.collection = () => ({})
  mod.query = () => ({})
  mod.orderBy = () => ({})
  mod.where = () => ({})
  mod.onSnapshot = (_q: any, cb: any) => {
    const docs = [
      { id: 'a1', data: () => ({ title: 'All', content: 'A', targetRole: 'all' }) },
      { id: 'a2', data: () => ({ title: 'Docentes', content: 'B', targetRole: 'docente' }) },
      { id: 'a3', data: () => ({ title: 'Alumnos', content: 'C', targetRole: 'alumno' }) },
    ]
    cb({ docs })
    return () => {}
  }
  return mod
})

describe('AnnouncementsView filter', () => {
  it('shows only allowed announcements for docente', () => {
    const { queryByText } = render(
      <AuthContext.Provider value={{ user: { uid: 't1', role: 'docente' } } as any}>
        <AnnouncementsView />
      </AuthContext.Provider>
    )
    expect(queryByText('All')).toBeTruthy()
    expect(queryByText('Docentes')).toBeTruthy()
    expect(queryByText('Alumnos')).toBeNull()
  })
})


