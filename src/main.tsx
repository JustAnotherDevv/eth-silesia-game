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
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
