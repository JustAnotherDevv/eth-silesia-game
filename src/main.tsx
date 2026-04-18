import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import News from './pages/News'
import Quiz from './pages/Quiz'
import Design from './pages/Design'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Decision from './pages/Decision'
import Path from './pages/Path'
import Onboarding from './pages/Onboarding'
import Community from './pages/Community'
import MemberProfile from './pages/MemberProfile'
import AdminPanel from './pages/AdminPanel'
import { Nav } from './components/Nav'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const ink = 'var(--rh-ink)'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--rh-paper)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: `4px solid ${ink}`, background: '#FFCD00',
        boxShadow: `4px 4px 0 ${ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
        animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>🎩</div>
      <p style={{
        marginTop: 16, fontFamily: "'Fredoka One', cursive",
        fontSize: '1rem', opacity: 0.45, color: ink,
      }}>Loading…</p>
    </div>
  )
}

function ProtectedLayout() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/onboarding" replace />
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

function OnboardingRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return <Onboarding />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/"                element={<Home />} />
            <Route path="/news"            element={<News />} />
            <Route path="/quiz"            element={<Quiz />} />
            <Route path="/design"          element={<Design />} />
            <Route path="/profile"         element={<Profile />} />
            <Route path="/leaderboard"     element={<Leaderboard />} />
            <Route path="/decision"        element={<Decision />} />
            <Route path="/path"            element={<Path />} />
            <Route path="/community"       element={<Community />} />
            <Route path="/community/:slug" element={<MemberProfile />} />
            <Route path="/admin"           element={<AdminPanel />} />
          </Route>
          <Route path="/onboarding" element={<OnboardingRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
