import type { ReactNode } from 'react'

type PrivateRouteProps = { children: ReactNode }

/** Wire auth check when you add login */
export function PrivateRoute({ children }: PrivateRouteProps) {
  return children
}
