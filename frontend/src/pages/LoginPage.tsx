import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useToast } from '../components/feedback/ToastProvider'
import { useAuth } from '../context/AuthContext'
import logoSrc from '../assets/COU-Logo-Boundary_Favicon.png'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const LoginPage = () => {
  const [tab, setTab] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const { loginSystem } = useAuth()
  const toast = useToast()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSystemLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Username and password are required')
      return
    }

    setLoading(true)
    try {
      await loginSystem({ username: username.trim(), password, remember })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVoterEntry = () => {
    // Navigate to voter login
    window.location.href = '/vote/login'
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Header with Logo */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #8F3493 0%, #0E61AD 100%)',
              color: 'white',
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              component="img"
              src={logoSrc}
              alt="Church of Uganda Logo"
              sx={{
                width: isMobile ? 40 : 56,
                height: isMobile ? 40 : 56,
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Mukono Diocese
              </Typography>
              <Typography variant="body2">Voting System</Typography>
            </Box>
          </Box>

          {/* Tab Navigation */}
          <Tabs
            value={tab}
            onChange={(_, newValue) => setTab(newValue)}
            aria-label="login tabs"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              width: '100%',
              '& .MuiTab-root': {
                flex: 1,
                minHeight: 56,
                py: 1.5,
                px: 2,
                textTransform: 'none',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 500,
                '&:first-of-type': {
                  borderRight: 1,
                  borderColor: 'divider',
                },
              },
            }}
          >
            <Tab
              icon={<HowToVoteIcon />}
              label={isMobile ? 'Vote' : 'Vote / Londa'}
              id="auth-tab-0"
            />
            <Tab
              icon={<LockIcon />}
              label={isMobile ? 'System' : 'System Access'}
              id="auth-tab-1"
            />
          </Tabs>

          {/* Voter Entry Tab */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
              <Card
                sx={{
                  p: 3,
                  bgcolor: 'background.default',
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  mb: 3,
                }}
              >
                <HowToVoteIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ready to Vote?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your voting code to access the ballot. Your code was provided by the Diocese.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleVoterEntry}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  Continue to Voter Login
                </Button>
              </Card>
            </Box>
          </TabPanel>

          {/* System Login Tab */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Admin and Diocesan Secretary login
              </Typography>

              <form onSubmit={handleSystemLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  margin="normal"
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  margin="normal"
                  required
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            tabIndex={-1}
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Remember me"
                  sx={{ my: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
