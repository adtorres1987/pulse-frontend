import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

// Standalone client used only for the refresh call — bypasses the response
// interceptor to avoid triggering another refresh on a 401 from /auth/refresh.
const refreshClient = axios.create({ baseURL: BASE_URL, timeout: 10_000 })

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach token ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: handle 401 with token refresh ───────────────────────────────────
let isRefreshing = false
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void }
let queue: QueueEntry[] = []

function flushQueue(error: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  queue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Only handle 401; skip if already retried or no config present
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      // Park this request until the ongoing refresh finishes
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(axiosInstance(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const oldToken = localStorage.getItem('token')
      const res = await refreshClient.post<{ success: true; data: { token: string } }>(
        '/auth/refresh',
        {},
        { headers: { Authorization: `Bearer ${oldToken}` } },
      )
      const newToken = res.data.data.token
      localStorage.setItem('token', newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      flushQueue(null, newToken)
      return axiosInstance(original)
    } catch (refreshErr) {
      flushQueue(refreshErr, null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
