import { Link } from 'react-router-dom'
import { ROUTES } from '../config/routes'

export function LoginPage() {
  return (
    <div className="layout">
      <main className="layout__main">
        <h1 className="page-title">Login</h1>
        <p>
          <Link to={ROUTES.HOME}>Back home</Link>
        </p>
      </main>
    </div>
  )
}
