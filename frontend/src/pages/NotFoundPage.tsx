import { Link } from 'react-router-dom'
import { ROUTES } from '../config/routes'

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-5xl text-slate-500"
        aria-hidden
      >
        ?
      </div>
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to={ROUTES.HOME}
        className="mt-10 inline-flex rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
      >
        Back to home
      </Link>
    </div>
  )
}
