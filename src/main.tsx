import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Swipe from './pages/Swipe'
import FraudSpotter from './pages/FraudSpotter'
import Community from './pages/Community'
import MemberProfile from './pages/MemberProfile'
import AdminPanel from './pages/AdminPanel'
import Episode from './pages/Episode'
import EpisodeNew from './pages/EpisodeNew'
import { Nav } from './components/Nav'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getSession } from './lib/session'

const ink = 'var(--rh-ink)'

function Layout({ children }: { children: React.ReactNode }) {
  return <>
    <Nav />
    {children}
  </>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session: authSession, loading } = useAuth()
  // Also check localStorage directly as a fallback (e.g., during post-registration navigation)
  const localSession = getSession()
  const hasSession = !!authSession || !!localSession

  if (loading && !localSession) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: 'var(--rh-surface)',
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', color: ink, opacity: 0.5 }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><Layout><News /></Layout></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Layout><Quiz /></Layout></ProtectedRoute>} />
          <Route path="/design" element={<ProtectedRoute><Layout><Design /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
          <Route path="/decision" element={<ProtectedRoute><Layout><Decision /></Layout></ProtectedRoute>} />
          <Route path="/path" element={<ProtectedRoute><Layout><Path /></Layout></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Layout><Community /></Layout></ProtectedRoute>} />
          <Route path="/community/:slug" element={<ProtectedRoute><Layout><MemberProfile /></Layout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          <Route path="/swipe" element={<ProtectedRoute><Layout><Swipe /></Layout></ProtectedRoute>} />
          <Route path="/fraud" element={<ProtectedRoute><Layout><FraudSpotter /></Layout></ProtectedRoute>} />
          <Route path="/episode/:id?" element={<ProtectedRoute><Episode /></ProtectedRoute>} />
          <Route path="/episode-new" element={<ProtectedRoute><EpisodeNew /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
