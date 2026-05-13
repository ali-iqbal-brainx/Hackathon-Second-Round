/** App display name in navbar */
export const APP_BRAND_NAME = 'BriefAI'

/**
 * Axios base URL — must include version prefix (matches Nest `setGlobalPrefix('api/v1')`).
 * Prefer `VITE_API_URL` in `.env`; `VITE_API_BASE_URL` is supported as a fallback.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000/api/v1'
