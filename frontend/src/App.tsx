import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedLayout } from './components/ProtectedLayout'
import { AuthProvider } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import HomePage from './features/home/HomePage'
import PlansPage from './features/plans/PlansPage'
import AnalysisPage from './features/analysis/AnalysisPage'
import SettingsPage from './features/settings/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected app shell (UI-SPEC 2.1: 4 routes) */}
        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/trening" element={<PlansPage />} />
            <Route path="/analiza" element={<AnalysisPage />} />
            <Route path="/ustawienia" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
