import { Link } from 'react-router-dom'
import { ROUTES } from '../../../config/routes'
import { APP_NAME } from '../../../config/constants'

export function Navbar() {
  return (
    <header className="navbar">
      <Link to={ROUTES.HOME} className="navbar__brand">
        {APP_NAME}
      </Link>
    </header>
  )
}
