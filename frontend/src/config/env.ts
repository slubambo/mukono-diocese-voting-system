export const API_ENV = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_V1: `${import.meta.env.VITE_API_BASE_URL}/api/v1`,
} as const
