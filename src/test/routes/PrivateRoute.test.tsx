import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrivateRoute } from '../../routes/PrivateRoute'
import { AuthContext } from '../../context/AuthContext'

function renderWithAuth(ui: React.ReactNode, value: any) {
  return render(
    <AuthContext.Provider value={value as any}>
      {ui}
    </AuthContext.Provider>
  )
}

describe('PrivateRoute', () => {
  it('renders spinner while loading', () => {
    const { getByText } = renderWithAuth(
      <PrivateRoute><div>Child</div></PrivateRoute>,
      { user: null, loading: true, initialized: false }
    )
    expect(getByText(/Cargando contenido/i)).toBeTruthy()
  })

  it('redirects when no user', () => {
    const { container } = renderWithAuth(
      <PrivateRoute><div>Child</div></PrivateRoute>,
      { user: null, loading: false, initialized: true }
    )
    // Navigate renders nothing in this shallow context; ensure child not present
    expect(container.textContent).not.toContain('Child')
  })

  it('renders children when user exists', () => {
    const { getByText } = renderWithAuth(
      <PrivateRoute><div>Child</div></PrivateRoute>,
      { user: { uid: 'u1', role: 'admin' }, loading: false, initialized: true }
    )
    expect(getByText('Child')).toBeTruthy()
  })
})


