export type ApiErrorBody = {
  message: string
  statusCode?: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
