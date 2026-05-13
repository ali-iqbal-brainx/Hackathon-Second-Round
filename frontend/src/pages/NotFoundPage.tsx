import { Link } from 'react-router-dom'
import { ROUTES } from '../config/routes'

export function NotFoundPage() {
  return (
    <div className="layout">
      <main className="layout__main">
        <h1 className="page-title">404</h1>
        <p>Page not found.</p>
        <p>
          <Link to={ROUTES.HOME}>Go home</Link>
        </p>
      </main>
    </div>
  )
}
