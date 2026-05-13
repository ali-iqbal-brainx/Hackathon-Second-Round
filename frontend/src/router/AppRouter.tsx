import { Route, Routes } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { ROUTES } from '../config/routes'
import { ClarificationPage } from '../pages/ClarificationPage'
import { HistoryPage } from '../pages/HistoryPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { TicketsPage } from '../pages/TicketsPage'
import { UploadPage } from '../pages/UploadPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<UploadPage />} />
        <Route
          path="/clarification/:briefId"
          element={<ClarificationPage />}
        />
        <Route path="/tickets/:briefId" element={<TicketsPage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
