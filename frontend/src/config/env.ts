export const API_ENV = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  API_V1: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1`,
} as const
