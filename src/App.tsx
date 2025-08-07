import './App.css'
// Optional Sentry loader (can be injected via script tag in index.html)
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalErrorProvider } from './components/GlobalErrorProvider'
import { Toaster } from './components/ui/sonner'
// import { AuthDebugger } from './components/AuthDebugger'

function App() {
  return (
    <ErrorBoundary>
      <GlobalErrorProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
          {/* <AuthDebugger /> */}
        </AuthProvider>
      </GlobalErrorProvider>
    </ErrorBoundary>
  )
}

export default App
