import './App.css'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GlobalErrorProvider } from './components/GlobalErrorProvider'

function App() {
  return (
    <ErrorBoundary>
      <GlobalErrorProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </GlobalErrorProvider>
    </ErrorBoundary>
  )
}

export default App
