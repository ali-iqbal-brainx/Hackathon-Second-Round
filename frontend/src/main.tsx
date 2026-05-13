import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { queryClient } from './lib/queryClient'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            className:
              '!bg-slate-900 !text-slate-100 !border !border-slate-700 !text-sm !shadow-xl',
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
