import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar/Navbar'

export function MainLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
