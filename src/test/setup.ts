import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}))

// Mock react-firebase-hooks
vi.mock('react-firebase-hooks/firestore', () => ({
  useCollection: vi.fn(() => [null, false, null]),
  useDocument: vi.fn(() => [null, false, null]),
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
    `<a href="${to}">${children}</a>`,
}))

// Mock context - Fixed to export AuthContext
const mockAuthContext = {
  user: null,
  loading: false,
}

vi.mock('@/context/AuthContext', () => ({
  AuthContext: mockAuthContext,
  useAuth: () => mockAuthContext,
}))

// Mock useContext to return our mock context
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as any
  return {
    ...actual,
    useContext: vi.fn((context) => {
      if (context === mockAuthContext) {
        return mockAuthContext
      }
      return actual.useContext(context)
    })
  }
})

// Mock hooks
vi.mock('@/hooks/useFirestoreCollection', () => ({
  default: vi.fn(() => ({
    data: [],
    loading: false,
    error: null
  }))
}))

vi.mock('@/hooks/useTeacherCourses', () => ({
  default: vi.fn(() => ({
    courses: [],
    loading: false,
    error: null
  }))
}))

vi.mock('@/hooks/useTeacherStudents', () => ({
  default: vi.fn(() => ({
    students: [],
    loading: false,
    error: null
  }))
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) 