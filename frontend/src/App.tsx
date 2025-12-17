import { ThemeProvider, CssBaseline } from '@mui/material'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import ToastProvider from './components/feedback/ToastProvider'
import ErrorBoundary from './components/feedback/ErrorBoundary'
import { lightTheme } from './theme/theme'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
