import { useEffect } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { VoterAuthProvider } from './context/VoterAuthContext'
import ToastProvider from './components/feedback/ToastProvider'
import ErrorBoundary from './components/feedback/ErrorBoundary'
import { lightTheme } from './theme/theme'
import logoSrc from './assets/COU-Logo-Boundary_Favicon.png'
import { SYSTEM_PRODUCT_NAME } from './config/constants'

function App() {
  useEffect(() => {
    // Set page title
    document.title = SYSTEM_PRODUCT_NAME

    // Set favicon
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }
    favicon.href = logoSrc
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <ToastProvider>
          <AuthProvider>
            <VoterAuthProvider>
              <AppRoutes />
            </VoterAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
