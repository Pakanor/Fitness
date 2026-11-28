import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedLayout } from './components/ProtectedLayout'
import { AuthProvider } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import HomePage from './features/home/HomePage'
import PlansPage from './features/plans/PlansPage'
import AnalysisPage from './features/analysis/AnalysisPage'
import SettingsPage from './features/settings/SettingsPage'
import { TemplateList } from './features/templates/TemplateList'
import { TemplateEditor } from './features/templates/TemplateEditor'
import SessionPage from './features/session/SessionPage'
import AITrainerPage from './features/ai-trainer/AITrainerPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {}
        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/trening" element={<PlansPage />} />
            <Route path="/trening/szablony" element={<TemplateList />} />
            <Route path="/trening/szablony/nowy" element={<TemplateEditor />} />
            <Route path="/trening/szablony/:id" element={<TemplateEditor />} />
            <Route path="/trening/sesja/:id" element={<SessionPage />} />
            <Route path="/analiza" element={<AnalysisPage />} />
            <Route path="/ustawienia" element={<SettingsPage />} />
            <Route path="/ai-trainer" element={<AITrainerPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
