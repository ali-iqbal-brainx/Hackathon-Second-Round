import { ErrorBoundary } from './components/ErrorBoundary'
import { AppRouter } from './router/AppRouter'

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}
