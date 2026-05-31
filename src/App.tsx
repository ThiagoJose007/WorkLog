import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './app/router'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
