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

function ProtectedLayout() {
  const onboarded = localStorage.getItem('xp_onboarded') === 'true'
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return (
    <>
      <Nav />
      <Outlet />
    </>
  )
}

function OnboardingRoute() {
  const onboarded = localStorage.getItem('xp_onboarded') === 'true'
  if (onboarded) return <Navigate to="/" replace />
  return <Onboarding />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedLayout />}>
          <Route path="/"               element={<Home />} />
          <Route path="/news"           element={<News />} />
          <Route path="/quiz"           element={<Quiz />} />
          <Route path="/design"         element={<Design />} />
          <Route path="/profile"        element={<Profile />} />
          <Route path="/leaderboard"    element={<Leaderboard />} />
          <Route path="/decision"       element={<Decision />} />
          <Route path="/path"           element={<Path />} />
          <Route path="/community"      element={<Community />} />
          <Route path="/community/:slug" element={<MemberProfile />} />
          <Route path="/admin"          element={<AdminPanel />} />
        </Route>
        <Route path="/onboarding" element={<OnboardingRoute />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
