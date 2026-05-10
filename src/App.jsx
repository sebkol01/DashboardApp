import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Health } from './pages/Health'
import { Goals } from './pages/Goals'
import { Thesis } from './pages/Thesis'
import { Sjomatradet } from './pages/Sjomatradet'
import { Elkjop } from './pages/Elkjop'
import { News } from './pages/News'
import { WeeklyReview } from './pages/WeeklyReview'
import { WhoopCallback } from './pages/WhoopCallback'

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { currentUser } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/whoop-callback" element={<WhoopCallback />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><Health /></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
      <Route path="/thesis" element={<ProtectedRoute><Thesis /></ProtectedRoute>} />
      <Route path="/sjomatradet" element={<ProtectedRoute><Sjomatradet /></ProtectedRoute>} />
      <Route path="/elkjop" element={<ProtectedRoute><Elkjop /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
      <Route path="/weekly-review" element={<ProtectedRoute><WeeklyReview /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
