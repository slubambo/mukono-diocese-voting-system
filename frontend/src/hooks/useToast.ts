import { useContext } from 'react'
import { ToastContext } from '@/components/feedback/ToastProvider'

export const useToast = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return {
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration?: number) => {
      context.addToast(message, type, duration)
    },
    success: context.success,
    error: context.error,
    info: context.info,
    warning: context.warning,
  }
}
