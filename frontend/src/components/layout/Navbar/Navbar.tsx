import { NavLink } from 'react-router-dom'
import { APP_BRAND_NAME } from '../../../config/constants'
import { ROUTES } from '../../../config/routes'

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  )
}

const navLinkClass = ({
  isActive,
}: {
  isActive: boolean
}): string =>
  [
    'text-sm font-medium transition-colors rounded-md px-3 py-1.5',
    isActive
      ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/80',
  ].join(' ')

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md shadow-sm shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <NavLink
          to={ROUTES.HOME}
          end
          className={({ isActive }) =>
            [
              'flex items-center gap-2 text-lg font-semibold tracking-tight transition-colors',
              isActive ? 'text-cyan-300' : 'text-white hover:text-cyan-300',
            ].join(' ')
          }
        >
          <BoltIcon className="text-cyan-400 shrink-0" />
          {APP_BRAND_NAME}
        </NavLink>
        <nav className="flex items-center gap-1">
          <NavLink to={ROUTES.HISTORY} className={navLinkClass}>
            History
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
