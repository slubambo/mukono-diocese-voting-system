/**
 * Utility to extract user-friendly error messages from axios errors
 * Handles various error response formats from the backend
 */
export const getErrorMessage = (error: unknown): string => {
  const err = error as Record<string, unknown>
  
  // Check for backend error response with message field (preferred format)
  if (err?.response && typeof err.response === 'object' && 'data' in err.response) {
    const data = (err.response as Record<string, unknown>).data as Record<string, unknown>
    if (data?.message && typeof data.message === 'string') {
      return data.message
    }
  }

  // Check for generic response error object with message
  if (err?.response && typeof err.response === 'object' && 'data' in err.response) {
    const data = (err.response as Record<string, unknown>).data as Record<string, unknown>
    if (data?.error && data?.message && typeof data.message === 'string') {
      return data.message
    }
  }

  // Fallback to axios error message
  if (err?.message && typeof err.message === 'string') {
    return err.message
  }

  // Generic fallback
  return 'An error occurred. Please try again.'
}

