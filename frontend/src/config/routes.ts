export const ROUTES = {
  HOME: '/',
  CLARIFICATION: '/clarification',
  TICKETS: '/tickets',
  HISTORY: '/history',
} as const

export function clarificationPath(briefId: string): string {
  return `${ROUTES.CLARIFICATION}/${briefId}`
}

export function ticketsPath(briefId: string): string {
  return `${ROUTES.TICKETS}/${briefId}`
}
