import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../config/constants'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractMessageFromBody(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined
  const msg = data.message
  if (typeof msg === 'string' && msg.trim()) return msg
  if (Array.isArray(msg) && msg.every((m) => typeof m === 'string')) {
    return msg.join(', ')
  }
  return undefined
}

export function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<unknown>
    const fromBody = extractMessageFromBody(ax.response?.data)
    if (fromBody) return fromBody
    if (ax.response?.statusText) return ax.response.statusText
    if (ax.message) return ax.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (
    config.method &&
    ['post', 'put', 'patch'].includes(config.method.toLowerCase()) &&
    config.data != null &&
    typeof config.data === 'object'
  ) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<unknown>) => {
    const message = getAxiosErrorMessage(error)
    toast.error('Something went wrong. Please try again.')
    return Promise.reject(new Error(message))
  },
)
