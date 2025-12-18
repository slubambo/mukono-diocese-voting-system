import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'

/**
 * Create axios instance with base URL from environment
 * Defaults to localhost:8080 if not configured
 */
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const axiosClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor
 * Add auth token to requests if available
 * Ready for implementation when authentication is wired
 */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (when auth is implemented)
    const token = localStorage.getItem('mdvs_token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * Handle common error scenarios globally
 * Ready for implementation as needed
 */
axiosClient.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth and redirect to login (when auth is implemented)
      localStorage.removeItem('mdvs_token')
      localStorage.removeItem('mdvs_user')
      // window.location.href = '/login'
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden', error.response.data)
    }

    return Promise.reject(error)
  }
)

export default axiosClient

/**
 * Export common HTTP methods for convenience
 * Usage: api.get('/endpoint'), api.post('/endpoint', data), etc.
 */
export const api = {
  get: <T = unknown>(url: string, config: AxiosRequestConfig = {}) =>
    axiosClient.get<T>(url, config).then(res => res.data),
  post: <T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) =>
    axiosClient.post<T>(url, data, config).then(res => res.data),
  put: <T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) =>
    axiosClient.put<T>(url, data, config).then(res => res.data),
  patch: <T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}) =>
    axiosClient.patch<T>(url, data, config).then(res => res.data),
  delete: <T = unknown>(url: string, config: AxiosRequestConfig = {}) =>
    axiosClient.delete<T>(url, config).then(res => res.data),
}
