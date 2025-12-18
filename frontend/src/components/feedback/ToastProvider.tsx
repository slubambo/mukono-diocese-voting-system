import React, { createContext, useContext, useCallback, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'
import type { AlertColor } from '@mui/material'

export interface Toast {
  id: string
  message: string
  type: AlertColor
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: AlertColor, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: AlertColor = 'info', duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`
      const newToast: Toast = { id, message, type, duration }

      setToasts(prev => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration || 7000)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, 'warning', duration)
  }, [addToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
      }}
    >
      {children}

      {/* Toast display stack */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {toasts.map(toast => (
          <Snackbar
            key={toast.id}
            open={true}
            autoHideDuration={toast.duration}
            onClose={() => removeToast(toast.id)}
            sx={{ mb: 1, display: 'flex' }}
          >
            <Alert
              onClose={() => removeToast(toast.id)}
              severity={toast.type}
              sx={{ width: 'auto', minWidth: 300 }}
              variant="filled"
            >
              {toast.message}
            </Alert>
          </Snackbar>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Hook to use toast notifications
 * @example
 * const toast = useToast()
 * toast.success('Operation completed')
 * toast.error('Something went wrong')
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export default ToastProvider
