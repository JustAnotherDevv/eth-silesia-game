import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getAdminFlags, setAdminFlag, getAdminStats, getAdminMembers, deleteAdminMember,
  patchAdminMember, getAdminCodes, createAdminCode, patchAdminCode,
  getAdminNews, createAdminNews, patchAdminNews, deleteAdminNews,
  invalidateFlagCache,
  type FeatureFlag, type AdminStats, type AdminMember, type AdminInviteCode, type AdminNewsItem,
} from '../lib/featureFlags'
import { getSession } from '../lib/session'
import { useAuth } from '../contexts/AuthContext'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

const btnBase: React.CSSProperties = {
  fontFamily: "'Fredoka One', cursive",
  border: `2.5px solid ${ink}`,
  cursor: 'pointer',
  transition: 'transform 0.1s, box-shadow 0.1s',
}

function lift(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLElement
  el.style.transform = 'translate(-2px,-2px)'
  el.style.boxShadow = `5px 5px 0 ${ink}`
}
function unlift(e: React.MouseEvent<HTMLElement>, base = '3px 3px 0') {
  const el = e.currentTarget as HTMLElement
  el.style.transform = ''
  el.style.boxShadow = `${base} ${ink}`
}

function copyText(text: string, setCopied: (s: string) => void) {
  navigator.clipboard?.writeText(text).catch(() => {})
  setCopied(text)
  setTimeout(() => setCopied(''), 1800)
}

function Toggle({ enabled, onToggle, loading }: { enabled: boolean; onToggle: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      style={{
        width: '52px', height: '28px', borderRadius: '14px',
        border: `2.5px solid ${ink}`, flexShrink: 0,
        background: enabled ? '#2D9A4E' : surface,
        cursor: loading ? 'wait' : 'pointer',
        position: 'relative',
        boxShadow: `2px 2px 0 ${ink}`, transition: 'background 0.2s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: enabled ? '24px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: 'white', border: `1.5px solid ${ink}`,
        transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}/>
    </button>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────

function TabOverview({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  const statItems = [
    { label: 'Total Members',  value: stats?.totalUsers ?? '–',  color: '#1565C0', icon: '👥' },
    { label: 'Active Today',   value: stats?.activeToday ?? '–', color: '#2D9A4E', icon: '🟢' },
    { label: 'Total XP Earned', value: stats ? stats.totalXp.toLocaleString() : '–', color: '#FF7B25', icon: '⚡' },
    { label: 'Games Played',   value: stats?.totalGames ?? '–',  color: '#7B2D8B', icon: '🎮' },
    { label: 'Badges Awarded', value: stats?.totalBadges ?? '–', color: '#E63946', icon: '🏅' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
      }}>
        {statItems.map(s => (
          <div key={s.label} style={{
            background: paper, border: `3px solid ${ink}`,
            borderRadius: '16px', padding: '16px',
            boxShadow: `4px 4px 0 ${ink}`,
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.6rem', color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.72rem', opacity: 0.5, marginTop: '4px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '16px', padding: '20px', boxShadow: `4px 4px 0 ${ink}`,
      }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Admin Tips
        </div>
        <ul style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.83rem', opacity: 0.65, margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>Use <strong>Feature Flags</strong> to enable/disable pages and minigames instantly — no deploy needed</li>
          <li>Enable <strong>Maintenance Mode</strong> to lock out regular users while you make changes</li>
          <li>Invite codes are linked to orgs — create an org first if you don't have one</li>
          <li>Promoting a member to admin grants full panel access</li>
        </ul>
      </div>
    </div>
  )
}

// ── Feature Flags Tab ────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  games:    { label: 'Minigames',     color: '#7B2D8B', icon: '🎮' },
  pages:    { label: 'Pages',         color: '#1565C0', icon: '📄' },
  platform: { label: 'Platform',      color: '#E63946', icon: '⚙️' },
  general:  { label: 'General',       color: '#2D9A4E', icon: '🌐' },
}

function TabFlags() {
  const [flags,    setFlags]   = useState<FeatureFlag[]>([])
  const [loading,  setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error,    setError]   = useState<string | null>(null)

  useEffect(() => {
    getAdminFlags()
      .then(setFlags)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: string, current: boolean) => {
    setToggling(key)
    try {
      const updated = await setAdminFlag(key, !current)
      setFlags(fs => fs.map(f => f.key === key ? { ...f, enabled: updated.enabled } : f))
      invalidateFlagCache()
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4, fontFamily: "'Fredoka One', cursive" }}>Loading…</div>

  const grouped = flags.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    ;(acc[f.category] ??= []).push(f)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && (
        <div style={{ background: '#FFF3F3', border: `2px solid #E63946`, borderRadius: '12px', padding: '12px 16px', color: '#E63946', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {Object.entries(grouped).map(([cat, catFlags]) => {
        const meta = CATEGORY_LABELS[cat] ?? { label: cat, color: '#888', icon: '🔧' }
        return (
          <div key={cat} style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '16px', boxShadow: `4px 4px 0 ${ink}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: meta.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {meta.label}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {catFlags.map(f => (
                <div key={f.key} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '12px',
                  border: `2px solid ${f.enabled ? ink : 'rgba(26,8,0,0.25)'}`,
                  background: f.enabled ? surface : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', opacity: f.enabled ? 1 : 0.45 }}>
                      {f.label}
                    </div>
                    <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.45, marginTop: '2px' }}>
                      {f.description} · key: <code style={{ fontFamily: 'monospace' }}>{f.key}</code>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                    padding: '3px 9px', borderRadius: '9999px',
                    background: f.enabled ? 'rgba(45,154,78,0.12)' : 'rgba(230,57,70,0.1)',
                    color: f.enabled ? '#2D9A4E' : '#E63946',
                    border: `1.5px solid ${f.enabled ? '#2D9A4E' : '#E63946'}`,
                  }}>
                    {f.enabled ? 'ON' : 'OFF'}
                  </span>
                  <Toggle
                    enabled={f.enabled}
                    loading={toggling === f.key}
                    onToggle={() => toggle(f.key, f.enabled)}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Members Tab ──────────────────────────────────────────────────

function xpLevel(xp: number) {
  if (xp >= 5000) return { label: 'Legend', color: '#FFCD00' }
  if (xp >= 2000) return { label: 'Expert', color: '#7B2D8B' }
  if (xp >= 500)  return { label: 'Pro',    color: '#1565C0' }
  return { label: 'Rookie', color: '#2D9A4E' }
}

function TabMembers() {
  const [members, setMembers]   = useState<AdminMember[]>([])
  const [search,  setSearch]    = useState('')
  const [loading, setLoading]   = useState(true)
  const [confirm, setConfirm]   = useState<string | null>(null)
  const [error,   setError]     = useState<string | null>(null)
  const session = getSession()

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const data = await getAdminMembers(q)
      setMembers(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 350)
    return () => clearTimeout(t)
  }, [search, load])

  async function removeMember(id: string) {
    try {
      await deleteAdminMember(id)
      setMembers(ms => ms.filter(m => m.id !== id))
      setConfirm(null)
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  async function toggleAdmin(m: AdminMember) {
    try {
      const updated = await patchAdminMember(m.id, { is_platform_admin: !m.is_platform_admin })
      setMembers(ms => ms.map(x => x.id === m.id ? { ...x, is_platform_admin: updated.is_platform_admin } : x))
      // Update local admin flag for current user
      if (m.id === session?.id) {
        localStorage.setItem(`xp_admin_${m.id}`, String(updated.is_platform_admin))
      }
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ background: '#FFF3F3', border: `2px solid #E63946`, borderRadius: '12px', padding: '12px 16px', color: '#E63946', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem' }}>⚠️ {error}</div>}

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by username or name…"
        style={{
          width: '100%', padding: '12px 16px', boxSizing: 'border-box',
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem',
          background: paper, border: `3px solid ${ink}`, borderRadius: '14px',
          boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
        }}
      />

      {loading && <div style={{ textAlign: 'center', padding: '24px', opacity: 0.4, fontFamily: "'Fredoka One', cursive" }}>Loading…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {members.map((m, i) => {
          const lvl = xpLevel(m.xp)
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '14px',
              border: `2px solid ${ink}`, background: paper,
              boxShadow: `3px 3px 0 ${ink}`,
              animation: 'rh-animate-bounce-in 0.3s ease both',
              animationDelay: `${i * 0.03}s`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: lvl.color, border: `2px solid ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>{m.avatar}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem' }}>{m.display_name}</span>
                  <span style={{
                    fontFamily: "'Fredoka One', cursive", fontSize: '0.55rem',
                    padding: '1px 7px', borderRadius: '9999px',
                    background: lvl.color, border: `1.5px solid ${ink}`,
                    color: lvl.label === 'Legend' ? '#1A0800' : 'white',
                  }}>{lvl.label}</span>
                  {m.is_platform_admin && (
                    <span style={{
                      fontFamily: "'Fredoka One', cursive", fontSize: '0.55rem',
                      padding: '1px 7px', borderRadius: '9999px',
                      background: '#7B2D8B', border: `1.5px solid ${ink}`, color: 'white',
                    }}>👑 ADMIN</span>
                  )}
                </div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.45, marginTop: '2px' }}>
                  @{m.username} · {m.xp.toLocaleString()} XP · streak {m.streak}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={() => toggleAdmin(m)}
                  title={m.is_platform_admin ? 'Revoke admin' : 'Make admin'}
                  style={{
                    ...btnBase, fontSize: '0.68rem', padding: '5px 10px',
                    borderRadius: '9999px',
                    background: m.is_platform_admin ? '#7B2D8B' : surface,
                    color: m.is_platform_admin ? 'white' : ink,
                    boxShadow: `2px 2px 0 ${ink}`,
                  }}
                >👑</button>
                <Link to={`/community/${m.username}`} style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem',
                  padding: '6px 12px', borderRadius: '9999px',
                  border: `2px solid ${ink}`, background: surface, color: ink,
                  textDecoration: 'none', boxShadow: `2px 2px 0 ${ink}`,
                  display: 'inline-block',
                }}>View</Link>
                {m.id !== session?.id && (
                  <button
                    onClick={() => setConfirm(m.id)}
                    style={{
                      ...btnBase, fontSize: '0.68rem', padding: '6px 12px',
                      borderRadius: '9999px', background: '#E63946', color: 'white',
                      boxShadow: `2px 2px 0 ${ink}`,
                    }}
                  >Remove</button>
                )}
              </div>
            </div>
          )
        })}

        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem', opacity: 0.4 }}>
            No members found.
          </div>
        )}
      </div>

      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(26,8,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: paper, border: `4px solid #E63946`, borderRadius: '20px',
            boxShadow: `8px 8px 0 ${ink}`, padding: '28px',
            maxWidth: 360, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', marginBottom: '8px' }}>Remove from orgs?</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.55, marginBottom: '20px' }}>
              {members.find(m => m.id === confirm)?.display_name} will lose access to all organizations.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} style={{ ...btnBase, fontSize: '0.9rem', padding: '11px 24px', borderRadius: '9999px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}>Cancel</button>
              <button onClick={() => removeMember(confirm!)} style={{ ...btnBase, fontSize: '0.9rem', padding: '11px 24px', borderRadius: '9999px', background: '#E63946', color: 'white', boxShadow: `3px 3px 0 ${ink}` }}>Remove →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Invite Codes Tab ─────────────────────────────────────────────

function TabInviteCodes() {
  const [codes,   setCodes]   = useState<AdminInviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState('')
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    getAdminCodes()
      .then(setCodes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function generate() {
    try {
      const c = await createAdminCode()
      setCodes(prev => [c, ...prev])
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  async function revoke(id: string) {
    try {
      const updated = await patchAdminCode(id, false)
      setCodes(cs => cs.map(c => c.id === id ? { ...c, active: updated.active } : c))
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <div style={{ background: '#FFF3F3', border: `2px solid #E63946`, borderRadius: '12px', padding: '12px 16px', color: '#E63946', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem' }}>⚠️ {error}</div>}

      <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '16px', boxShadow: `4px 4px 0 ${ink}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🔑 Invite Codes
          </div>
          <button onClick={generate} style={{
            ...btnBase, fontSize: '0.75rem', padding: '7px 16px',
            borderRadius: '9999px', background: '#2D9A4E', color: 'white',
            boxShadow: `3px 3px 0 ${ink}`,
          }}
          onMouseEnter={lift} onMouseLeave={unlift}>
            + Generate New
          </button>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '24px', opacity: 0.4, fontFamily: "'Fredoka One', cursive" }}>Loading…</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {codes.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '12px',
              border: `2px solid ${c.active ? ink : 'rgba(26,8,0,0.2)'}`,
              background: c.active ? surface : 'transparent',
              opacity: c.active ? 1 : 0.45,
            }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem',
                letterSpacing: '0.14em', flex: 1,
                color: c.active ? ink : 'rgba(26,8,0,0.4)',
              }}>
                {c.code}
                {c.orgs && <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.65rem', opacity: 0.45, marginLeft: '8px' }}>({c.orgs.emoji} {c.orgs.name})</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.62rem', opacity: 0.5 }}>
                  {c.uses}/{c.max_uses ?? '∞'} used
                </div>
                {c.max_uses && (
                  <div style={{ height: '5px', borderRadius: '9999px', background: 'rgba(26,8,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', width: `${Math.min((c.uses / c.max_uses) * 100, 100)}%`, background: c.uses >= c.max_uses ? '#E63946' : '#2D9A4E', transition: 'width 0.3s' }}/>
                  </div>
                )}
              </div>

              <span style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                padding: '3px 9px', borderRadius: '9999px',
                border: `1.5px solid ${c.active ? '#2D9A4E' : 'rgba(26,8,0,0.2)'}`,
                color: c.active ? '#2D9A4E' : 'rgba(26,8,0,0.35)',
                background: c.active ? 'rgba(45,154,78,0.1)' : 'transparent',
              }}>
                {c.active ? 'Active' : 'Revoked'}
              </span>

              {c.active && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => copyText(c.code, setCopied)} style={{ ...btnBase, fontSize: '0.68rem', padding: '5px 10px', borderRadius: '9999px', background: '#FFCD00', color: '#1A0800', boxShadow: `2px 2px 0 ${ink}` }}>
                    {copied === c.code ? '✓' : '📋'}
                  </button>
                  <button onClick={() => revoke(c.id)} style={{ ...btnBase, fontSize: '0.68rem', padding: '5px 10px', borderRadius: '9999px', background: '#E63946', color: 'white', boxShadow: `2px 2px 0 ${ink}` }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
          {!loading && codes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', opacity: 0.4, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500 }}>No codes yet. Generate one!</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── News Tab ─────────────────────────────────────────────────────

function TabNews() {
  const [items,   setItems]   = useState<AdminNewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [draft,   setDraft]   = useState('')
  const [adding,  setAdding]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    getAdminNews()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function add() {
    if (!draft.trim()) return
    try {
      const item = await createAdminNews(draft.trim())
      setItems(prev => [item, ...prev])
      setDraft('')
      setAdding(false)
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const updated = await patchAdminNews(id, { active: !current })
      setItems(is => is.map(i => i.id === id ? { ...i, active: updated.active } : i))
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  async function remove(id: string) {
    try {
      await deleteAdminNews(id)
      setItems(is => is.filter(i => i.id !== id))
    } catch (e: unknown) {
      setError((e as Error).message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ background: '#FFF3F3', border: `2px solid #E63946`, borderRadius: '12px', padding: '12px 16px', color: '#E63946', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          📰 News Items
        </div>
        <button onClick={() => setAdding(v => !v)} style={{
          ...btnBase, fontSize: '0.78rem', padding: '8px 18px',
          borderRadius: '9999px', background: adding ? surface : '#FF7B25',
          color: adding ? ink : 'white', boxShadow: `3px 3px 0 ${ink}`,
        }}
        onMouseEnter={lift} onMouseLeave={unlift}>
          {adding ? '✕ Cancel' : '+ Add Item'}
        </button>
      </div>

      {adding && (
        <div style={{ background: paper, border: `3px solid #FF7B25`, borderRadius: '16px', padding: '16px', boxShadow: `4px 4px 0 ${ink}` }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder="Breaking: market hits new high…"
            style={{
              width: '100%', padding: '11px 14px', boxSizing: 'border-box', marginBottom: '10px',
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem',
              background: surface, border: `2.5px solid ${ink}`, borderRadius: '10px',
              boxShadow: `2px 2px 0 ${ink}`, outline: 'none', color: ink,
            }}
          />
          <button onClick={add} disabled={!draft.trim()} style={{
            ...btnBase, fontSize: '0.85rem', padding: '10px 24px',
            borderRadius: '9999px', background: draft.trim() ? '#FF7B25' : surface,
            color: draft.trim() ? 'white' : ink, boxShadow: `3px 3px 0 ${ink}`,
            opacity: draft.trim() ? 1 : 0.45,
          }}>
            Add →
          </button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '24px', opacity: 0.4, fontFamily: "'Fredoka One', cursive" }}>Loading…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', borderRadius: '12px',
            border: `2px solid ${item.active ? ink : 'rgba(26,8,0,0.2)'}`,
            background: item.active ? surface : 'transparent',
            opacity: item.active ? 1 : 0.5,
          }}>
            <div style={{ flex: 1, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem' }}>
              {item.headline}
              <span style={{ display: 'block', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 400, fontSize: '0.65rem', opacity: 0.4, marginTop: '2px' }}>
                {item.source} · {item.category} · {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <Toggle enabled={item.active} onToggle={() => toggleActive(item.id, item.active)} />
            <button onClick={() => remove(item.id)} style={{ ...btnBase, fontSize: '0.68rem', padding: '5px 10px', borderRadius: '9999px', background: '#E63946', color: 'white', boxShadow: `2px 2px 0 ${ink}` }}>✕</button>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', opacity: 0.4, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500 }}>No news items yet.</div>
        )}
      </div>
    </div>
  )
}

// ── Main AdminPanel ──────────────────────────────────────────────

type Tab = 'overview' | 'flags' | 'members' | 'codes' | 'news'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview',  icon: '🏠' },
  { key: 'flags',    label: 'Features',  icon: '🚦' },
  { key: 'members',  label: 'Members',   icon: '👥' },
  { key: 'codes',    label: 'Codes',     icon: '🔑' },
  { key: 'news',     label: 'News',      icon: '📰' },
]

export default function AdminPanel() {
  const navigate  = useNavigate()
  const session   = getSession()
  const { isAdmin } = useAuth()
  const [tab,     setTab]     = useState<Tab>('overview')
  const [stats,   setStats]   = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [adminError, setAdminError]     = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true })
      return
    }
    getAdminStats()
      .then(setStats)
      .catch(e => setAdminError(e.message))
      .finally(() => setStatsLoading(false))
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: paper,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
      paddingBottom: '60px',
    }}>
      {/* Hero header */}
      <div style={{
        background: `linear-gradient(135deg, #7B2D8B 0%, #1565C0 100%)`,
        borderBottom: `4px solid ${ink}`,
        boxShadow: `0 6px 0 ${ink}`,
        padding: '24px 20px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}/>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '3px solid rgba(255,255,255,0.12)' }}/>

        <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            marginBottom: '18px', padding: '5px 12px', borderRadius: '9999px',
            border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)',
          }}>← Home</Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', flexShrink: 0, boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
            }}>👑</div>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                Admin Panel
              </div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: 'white', textShadow: '3px 3px 0 rgba(0,0,0,0.3)', lineHeight: 1.1 }}>
                Knowly Control
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(255,205,0,0.9)', color: '#1A0800', border: '1.5px solid rgba(0,0,0,0.2)' }}>
                  👑 {session?.displayName ?? session?.username}
                </span>
                {stats && !statsLoading && (
                  <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                    {stats.totalUsers} users · {stats.totalGames.toLocaleString()} games played
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ maxWidth: '680px', margin: '-40px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '18px', padding: '6px',
          boxShadow: `6px 6px 0 ${ink}`,
          display: 'flex', gap: '4px', overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, minWidth: '52px', padding: '10px 8px',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
              border: `2px solid ${tab === t.key ? ink : 'transparent'}`,
              borderRadius: '12px',
              background: tab === t.key ? '#7B2D8B' : 'transparent',
              color: tab === t.key ? 'white' : ink,
              cursor: 'pointer',
              boxShadow: tab === t.key ? `2px 2px 0 ${ink}` : 'none',
              transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            }}>
              <span style={{ fontSize: '1rem' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: '680px', margin: '20px auto 0', padding: '0 16px' }}>
        {adminError && (
          <div style={{ background: '#FFF3F3', border: `2px solid #E63946`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#E63946', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem' }}>
            ⚠️ {adminError}
          </div>
        )}
        {tab === 'overview' && <TabOverview stats={stats} loading={statsLoading} />}
        {tab === 'flags'    && <TabFlags />}
        {tab === 'members'  && <TabMembers />}
        {tab === 'codes'    && <TabInviteCodes />}
        {tab === 'news'     && <TabNews />}
      </div>
    </div>
  )
}
