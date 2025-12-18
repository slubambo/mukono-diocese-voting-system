import { createTheme } from '@mui/material/styles'

/**
 * Brand Color Palette (Church of Uganda)
 * - Primary (Purple): #8F3493
 * - Secondary (Blue): #0E61AD
 * - Accent (Gold): #D7B161
 */

const COLORS = {
  primary: '#8F3493',
  secondary: '#0E61AD',
  accent: '#D7B161',
  backgroundDark: '#0B0F14',
  backgroundLight: '#F8F7F1',
  errorRed: '#E53935',
  successGreen: '#43A047',
  warningOrange: '#FB8C00',
  infoBlue: '#1E88E5',
}

// Light theme (default)
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: COLORS.primary, // #8F3493
      light: '#B159B8',
      dark: '#6B2670',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: COLORS.secondary, // #0E61AD
      light: '#4A8FDB',
      dark: '#0A4080',
      contrastText: '#FFFFFF',
    },
    info: {
      main: COLORS.secondary,
    },
    error: {
      main: COLORS.errorRed,
    },
    success: {
      main: COLORS.successGreen,
    },
    warning: {
      main: COLORS.warningOrange,
    },
    background: {
      default: COLORS.backgroundLight,
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#555555',
      disabled: '#BBBBBB',
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    // Headings
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.25px',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    // Body
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    // Subtitle
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    // Button
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
      letterSpacing: '0.5px',
    },
    // Caption
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    // Button
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          minHeight: '44px',
          padding: '10px 20px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          fontWeight: 600,
        },
        outlined: {
          fontWeight: 600,
          border: '2px solid',
        },
        text: {
          fontWeight: 600,
        },
        sizeSmall: {
          minHeight: '36px',
          padding: '6px 12px',
        },
        sizeLarge: {
          minHeight: '52px',
          padding: '12px 28px',
        },
      },
    },
    // TextField
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease',
            '&:hover fieldset': {
              borderColor: COLORS.primary,
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
              borderColor: COLORS.primary,
            },
          },
        },
      },
    },
    // Card / Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: COLORS.primary,
            color: '#FFFFFF',
          },
        },
      },
    },
    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: `1px solid #E0E0E0`,
        },
      },
    },
    // List
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: `rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.08)`,
          },
          '&.Mui-selected': {
            backgroundColor: `rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.12)`,
            borderLeft: `4px solid ${COLORS.primary}`,
            paddingLeft: '12px',
          },
        },
      },
    },
    // Menu
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    // Snackbar (for toasts)
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
        },
      },
    },
    // Skeleton
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
  },
})

// Dark theme (optional, ready for future use)
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.primary,
      light: '#B159B8',
      dark: '#6B2670',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: COLORS.secondary,
      light: '#4A8FDB',
      dark: '#0A4080',
      contrastText: '#FFFFFF',
    },
    info: {
      main: COLORS.secondary,
    },
    error: {
      main: '#FF6B6B',
    },
    success: {
      main: '#51CF66',
    },
    warning: {
      main: '#FFA94D',
    },
    background: {
      default: COLORS.backgroundDark,
      paper: '#1A1E2E',
    },
    text: {
      primary: '#F0F0F0',
      secondary: '#AAAAAA',
      disabled: '#555555',
    },
    divider: '#2C3142',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          minHeight: '44px',
          padding: '10px 20px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export { lightTheme, darkTheme }
export default lightTheme
