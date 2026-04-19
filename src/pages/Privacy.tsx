import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { exportMyData, deleteMyAccount } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '../lib/responsive'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'
const card    = 'var(--rh-card)'

type Consent = {
  analytics: boolean
  sounds: boolean
  marketing: boolean
}

const CONSENT_STORAGE_KEY = 'knowly_consent'

function loadConsent(): Consent {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw) return { analytics: false, sounds: true, marketing: false, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { analytics: false, sounds: true, marketing: false }
}

function saveConsent(c: Consent) {
  try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(c)) } catch { /* ignore */ }
}

export default function Privacy() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { signOut } = useAuth()

  const [consent, setConsent] = useState<Consent>(() => loadConsent())
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [deleteTyped, setDeleteTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string | null>(null)

  useEffect(() => { saveConsent(consent) }, [consent])

  async function handleExport() {
    setExporting(true)
    setExportMsg(null)
    try {
      const blob = await exportMyData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `knowly-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setExportMsg('✓ Download started — everything we hold on you is in that file.')
    } catch (e) {
      setExportMsg(`⚠ Export failed: ${e instanceof Error ? e.message : 'unknown'}`)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (deleteTyped !== 'DELETE') {
      setDeleteErr('Type DELETE exactly to confirm.')
      return
    }
    setDeleting(true)
    setDeleteErr(null)
    try {
      await deleteMyAccount()
      try { await signOut() } catch { /* ignore */ }
      try {
        localStorage.removeItem('knowly_active_org')
        localStorage.removeItem(CONSENT_STORAGE_KEY)
      } catch { /* ignore */ }
      navigate('/onboarding', { replace: true })
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'unknown error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: surface,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      padding: isMobile ? '16px 12px 64px' : '32px 24px 64px',
    }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        <Link to="/profile" style={{ display: 'inline-block', marginBottom: '16px', textDecoration: 'none', color: ink, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65 }}>
          ← Back to Profile
        </Link>

        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '1.8rem 2rem 1.8rem 2.1rem',
          boxShadow: `8px 8px 0 ${ink}`,
          padding: isMobile ? '20px' : '32px',
          marginBottom: '24px',
        }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '6px' }}>
            GDPR · Your Data · Your Control
          </div>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.05, margin: 0 }}>
            Privacy Dashboard
          </h1>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.6, opacity: 0.78, marginTop: '10px', marginBottom: 0 }}>
            Knowly stores only what it needs to run. You can see exactly what we hold, export it all at once, or permanently erase everything — at any time, without giving a reason.
          </p>
        </div>

        <Section title="Data We Hold">
          <ul style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.65, margin: 0, paddingLeft: '20px' }}>
            <li><strong>Account</strong> — email (via Supabase Auth), username, display name, avatar emoji, goals.</li>
            <li><strong>Activity</strong> — XP totals, streak count, last active date, games played (type, score, XP, timestamp).</li>
            <li><strong>Progression</strong> — completed learning-path nodes and awarded badges.</li>
            <li><strong>Community</strong> — which organizations/spaces you've joined.</li>
            <li><strong>On your device</strong> — active-space selection, consent preferences, Supabase session tokens.</li>
          </ul>
          <div style={{ marginTop: '12px', padding: '10px 14px', border: `2px dashed ${ink}`, borderRadius: '0.9rem', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.8 }}>
            <strong>We do not collect:</strong> IP logs beyond what Supabase retains for auth, device fingerprints, behavioral trackers, or marketing cookies. No data is shared with third parties.
          </div>
        </Section>

        <Section title="Where Your Data Lives">
          <DataMapRow label="Supabase PostgreSQL (EU region)" detail="Account, activity, badges, path progress, org memberships. Encrypted at rest." />
          <DataMapRow label="Supabase Auth (EU region)" detail="Email + hashed password. Managed by Supabase; we never see the password." />
          <DataMapRow label="Hono API" detail="Stateless — processes your requests but stores nothing itself. Rate-limit counters are in memory only." />
          <DataMapRow label="Your browser (localStorage)" detail="Active-space id, consent toggles, auth session. Cleared when you sign out or erase your account." />
        </Section>

        <Section title="Export Your Data">
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 14px', opacity: 0.8 }}>
            GDPR Article 15 — <strong>Right of Access</strong>. One click, a single JSON file with every row we hold on you.
          </p>
          <button onClick={handleExport} disabled={exporting}
            style={btnStyle('#FFCD00', exporting)}>
            {exporting ? 'Preparing…' : 'Download My Data (.json) →'}
          </button>
          {exportMsg && (
            <div style={{ marginTop: '10px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', opacity: 0.8 }}>
              {exportMsg}
            </div>
          )}
        </Section>

        <Section title="Consent Preferences">
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 14px', opacity: 0.8 }}>
            Fine-grained, reversible. These apply only on this device.
          </p>
          <ConsentToggle
            label="In-app sound effects"
            desc="Play XP pings, correct/incorrect chimes, and transition sounds."
            checked={consent.sounds}
            onChange={v => setConsent(c => ({ ...c, sounds: v }))}
          />
          <ConsentToggle
            label="Product analytics"
            desc="Anonymous aggregate usage stats to improve the platform. Not yet enabled — toggling here sets your preference in advance."
            checked={consent.analytics}
            onChange={v => setConsent(c => ({ ...c, analytics: v }))}
          />
          <ConsentToggle
            label="Marketing communications"
            desc="Opt-in to occasional product updates. Currently we send nothing — this is purely forward-consent."
            checked={consent.marketing}
            onChange={v => setConsent(c => ({ ...c, marketing: v }))}
          />
        </Section>

        <Section title="Erase Your Account" destructive>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 14px', opacity: 0.8 }}>
            GDPR Article 17 — <strong>Right to Erasure</strong>. Permanently deletes your user row, game history, badges, path progress, org memberships, and authentication record. This cannot be undone.
          </p>
          {deleteStep === 0 && (
            <button onClick={() => setDeleteStep(1)} style={btnStyle('#E63946', false, '#FEF9EE')}>
              Delete My Account →
            </button>
          )}
          {deleteStep >= 1 && (
            <div style={{ border: `2.5px solid #E63946`, borderRadius: '1rem', padding: '14px', background: card }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', marginBottom: '8px' }}>
                Are you sure?
              </div>
              <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.55, opacity: 0.8, margin: '0 0 12px' }}>
                Type <strong>DELETE</strong> below to confirm. Your account, XP, badges, and all associated data will be removed from Supabase immediately.
              </p>
              <input
                value={deleteTyped}
                onChange={e => { setDeleteTyped(e.target.value); setDeleteErr(null) }}
                placeholder="Type DELETE"
                autoFocus
                style={{
                  width: '100%', padding: '9px 14px', fontFamily: "'Fredoka Variable', sans-serif",
                  fontWeight: 600, fontSize: '0.9rem', borderRadius: '0.7rem',
                  border: `2px solid ${ink}`, background: paper, color: ink, marginBottom: '12px',
                  boxShadow: `2px 2px 0 ${ink}`,
                }}
              />
              {deleteErr && (
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', color: '#E63946', marginBottom: '10px' }}>
                  {deleteErr}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={handleDelete} disabled={deleting || deleteTyped !== 'DELETE'}
                  style={btnStyle('#E63946', deleting || deleteTyped !== 'DELETE', '#FEF9EE')}>
                  {deleting ? 'Erasing…' : 'Erase Permanently'}
                </button>
                <button onClick={() => { setDeleteStep(0); setDeleteTyped(''); setDeleteErr(null) }}
                  disabled={deleting} style={btnStyle(surface, deleting)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        <div style={{ marginTop: '28px', padding: '14px 18px', background: paper, border: `2px solid ${ink}`, borderRadius: '1rem', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.78rem', lineHeight: 1.55, opacity: 0.7 }}>
          Questions? In the EU you can complain to your local Data Protection Authority (in Poland: <strong>UODO</strong>). For financial disputes on partner services, contact the <strong>Rzecznik Finansowy</strong>. Consumer-protection issues at scale go through <strong>UOKiK</strong>.
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, destructive }: { title: string; children: React.ReactNode; destructive?: boolean }) {
  return (
    <div style={{
      background: paper, border: `3px solid ${destructive ? '#E63946' : ink}`,
      borderRadius: '1.4rem 1.6rem 1.4rem 1.5rem',
      boxShadow: `6px 6px 0 ${destructive ? '#E63946' : ink}`,
      padding: '20px', marginBottom: '20px',
    }}>
      <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.15rem', lineHeight: 1.15, margin: '0 0 12px', color: destructive ? '#E63946' : ink }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function DataMapRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: `1.5px dashed ${ink}`, opacity: 0.9 }}>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.75 }}>{detail}</div>
    </div>
  )
}

function ConsentToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: `1.5px dashed ${ink}`, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#FFCD00', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', marginBottom: '3px' }}>{label}</div>
        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.7 }}>{desc}</div>
      </div>
    </label>
  )
}

function btnStyle(bg: string, disabled: boolean, color: string = '#1A0800'): React.CSSProperties {
  return {
    fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', letterSpacing: '0.06em',
    padding: '8px 18px', borderRadius: '9999px',
    border: `2.5px solid ${ink}`, background: bg, color,
    boxShadow: disabled ? 'none' : `3px 3px 0 ${ink}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'transform 0.1s, box-shadow 0.1s',
  }
}
