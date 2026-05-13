import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'

export function HomePage() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">
        <h1 className="page-title">Hello World</h1>
        <p>Welcome to the app.</p>
      </main>
      <Footer />
    </div>
  )
}
