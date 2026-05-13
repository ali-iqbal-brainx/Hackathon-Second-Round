export const env = {
  apiBaseUrl:
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:4000/api/v1',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
