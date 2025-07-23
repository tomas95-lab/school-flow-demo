import './App.css'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalErrorProvider } from './components/GlobalErrorProvider'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <ErrorBoundary>
      <GlobalErrorProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </GlobalErrorProvider>
    </ErrorBoundary>
  )
}

export default App
