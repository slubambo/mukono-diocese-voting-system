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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8F3493 0%, #5D248C 25%, #0E61AD 75%, #084A87 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(14, 97, 173, 0.1) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(215, 177, 97, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper 
            elevation={8} 
            sx={{ 
              width: '100%', 
              overflow: 'hidden',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.98)',
            }}
          >
            {/* Header with Logo */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #8F3493 0%, #6B2670 50%, #0E61AD 100%)',
                color: 'white',
                p: { xs: 3, sm: 4 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Box
                component="img"
                src={logoSrc}
                alt="Church of Uganda Logo"
                sx={{
                  width: { xs: 56, sm: 72 },
                  height: { xs: 56, sm: 72 },
                  flexShrink: 0,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              />
              <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '0.5px' }}>
                  Mukono Diocese
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                  Voting System
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                  Secure • Transparent • Democratic
                </Typography>
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
            <Box sx={{ px: { xs: 2, sm: 4 }, textAlign: 'center' }}>
              {/* Welcome Section */}
              <Box sx={{ mb: 3, mt: 0 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 0.5,
                    color: 'primary.main',
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  }}
                >
                  Welcome, Voter!
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 0,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                  }}
                >
                  Your voice matters. Cast your vote securely and confidentially.
                </Typography>
              </Box>

              {/* Main Action Card */}
              <Card
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  background: 'linear-gradient(135deg, #F8F7FF 0%, #FFF9F5 100%)',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  mb: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(143, 52, 147, 0.15)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(143, 52, 147, 0.08) 0%, transparent 70%)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8F3493 0%, #6B2670 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                    boxShadow: '0 8px 16px rgba(143, 52, 147, 0.3)',
                  }}
                >
                  <HowToVoteIcon sx={{ fontSize: 44, color: 'white' }} />
                </Box>
                
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    color: 'primary.dark',
                    mb: 1.5,
                    fontSize: { xs: '1.4rem', sm: '1.5rem' },
                  }}
                >
                  Ready to Vote?
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2.5,
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    margin: '0 auto 20px',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  }}
                >
                  Enter your unique voting code to access your ballot. Your code was provided by the Diocese and is required to proceed.
                </Typography>
                
                {/* Info Box */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: 'rgba(14, 97, 173, 0.08)',
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    mb: 2.5,
                  }}
                >
                  <LockIcon sx={{ fontSize: 18, color: 'secondary.main', flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'secondary.dark', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                    Your vote is secure and anonymous
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleVoterEntry}
                  sx={{ 
                    py: 1.75, 
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(143, 52, 147, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(143, 52, 147, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Continue to Voter Login →
                </Button>
              </Card>

              {/* Help Text */}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                  💡 Don't have a voting code?
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                  Contact your polling officer or the Diocese office for assistance.
                </Typography>
              </Box>
            </Box>
          </TabPanel>

          {/* System Login Tab */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ px: { xs: 2, sm: 4 }, pb: 4 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(14, 97, 173, 0.05)',
                  borderRadius: 2,
                }}
              >
                <LockIcon sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.dark', mb: 0.5 }}>
                  System Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admin and Diocesan Secretary login
                </Typography>
              </Box>

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
                  sx={{ 
                    py: 1.75, 
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(14, 97, 173, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(14, 97, 173, 0.4)',
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Box>
          </TabPanel>
            </Paper>
          </Box>
        </Container>
      </Box>
    )
}

export default LoginPage
