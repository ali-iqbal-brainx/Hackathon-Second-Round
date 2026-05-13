interface ImportMetaEnv {
  /** Primary API root, e.g. `http://localhost:4000/api/v1` */
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
