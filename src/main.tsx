import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function Layout({ children }: { children: React.ReactNode }) {
  return <>
    <Nav />
    {children}
  </>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/news" element={<Layout><News /></Layout>} />
        <Route path="/quiz" element={<Layout><Quiz /></Layout>} />
        <Route path="/design" element={<Layout><Design /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
        <Route path="/decision" element={<Layout><Decision /></Layout>} />
        <Route path="/path" element={<Layout><Path /></Layout>} />
        <Route path="/community" element={<Layout><Community /></Layout>} />
        <Route path="/community/:slug" element={<Layout><MemberProfile /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
        <Route path="/swipe" element={<Layout><Swipe /></Layout>} />
        <Route path="/fraud" element={<Layout><FraudSpotter /></Layout>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/episode/:id?" element={<Episode />} />
        <Route path="/episode-new" element={<EpisodeNew />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
