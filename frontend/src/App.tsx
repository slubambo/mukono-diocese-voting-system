import { ThemeProvider, CssBaseline } from '@mui/material'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import theme from './theme/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
