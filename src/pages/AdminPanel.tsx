import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
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

// ── Types ──────────────────────────────────────────────────────

interface CommunityStats {
  id: string; name: string; emoji: string; type: string; isPublic: boolean
  members: number; totalXp: number; totalBadges: number; primaryCode: string | null
}

interface ApiInviteCode {
  id: string; code: string; uses: number; maxUses: number; active: boolean; createdAt: string
}

interface ApiMember {
  id: string; name: string; username: string; email: string
  avatarEmoji: string; xp: number; level: string; specialty: string
  isAdmin: boolean; joinedAt: string
}

interface ApiModule {
  id: string; emoji: string; title: string; description: string
  lessons: number; published: boolean
}

// ── Overview tab ──────────────────────────────────────────────

function TabOverview({ stats }: { stats: CommunityStats }) {
  const [copied, setCopied] = useState('')
  const code = stats.primaryCode ?? ''
  const statCards = [
    { label: 'Total Members',    value: stats.members,                       color: '#1565C0', icon: '👥' },
    { label: 'Active Today',     value: Math.max(1, Math.floor(stats.members * 0.6)), color: '#2D9A4E', icon: '🟢' },
    { label: 'Total XP Earned',  value: stats.totalXp.toLocaleString(),      color: '#FF7B25', icon: '⚡' },
    { label: 'Badges Awarded',   value: stats.totalBadges,                   color: '#7B2D8B', icon: '🏅' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Community card */}
      <div style={{
        background: 'linear-gradient(135deg, #7B2D8B 0%, #1565C0 100%)',
        borderRadius: '20px', border: `3px solid ${ink}`,
        boxShadow: `6px 6px 0 ${ink}`, padding: '24px',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', opacity: 0.12, pointerEvents: 'none' }}>
          {stats.emoji}
        </div>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{stats.emoji}</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', marginBottom: '4px' }}>{stats.name}</div>
        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.8rem', opacity: 0.7, marginBottom: '14px' }}>
          You are the Admin · {stats.members} members
        </div>
        {code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.15)', padding: '6px 14px',
              borderRadius: '9999px', border: '1.5px solid rgba(255,255,255,0.3)',
              letterSpacing: '0.14em',
            }}>{code}</div>
            <button
              onClick={() => copyText(code, setCopied)}
              style={{
                ...btnBase, fontSize: '0.75rem', padding: '6px 14px',
                borderRadius: '9999px', background: 'rgba(255,255,255,0.9)',
                color: '#1A0800', boxShadow: `2px 2px 0 rgba(0,0,0,0.4)`,
              }}
            >
              {copied === code ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: paper, border: `3px solid ${ink}`,
            borderRadius: '16px', padding: '16px',
            boxShadow: `4px 4px 0 ${ink}`,
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
    </div>
  )
}

// ── Invite Codes tab ──────────────────────────────────────────

function TabInviteCodes() {
  const [codes,   setCodes]   = useState<ApiInviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState('')

  const load = useCallback(async () => {
    try { setCodes(await api.get<ApiInviteCode[]>('/admin/invite-codes')) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function generateCode() {
    try {
      const newCode = await api.post<ApiInviteCode>('/admin/invite-codes', { maxUses: 25 })
      setCodes(c => [newCode, ...c])
    } catch {}
  }

  async function revokeCode(id: string) {
    try {
      await api.delete(`/admin/invite-codes/${id}`)
      setCodes(c => c.map(co => co.id === id ? { ...co, active: false } : co))
    } catch {}
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, opacity: 0.4 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Codes list */}
      <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '16px', boxShadow: `4px 4px 0 ${ink}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🔑 Invite Codes
          </div>
          <button onClick={generateCode} style={{
            ...btnBase, fontSize: '0.75rem', padding: '7px 16px',
            borderRadius: '9999px', background: '#2D9A4E', color: 'white',
            boxShadow: `3px 3px 0 ${ink}`,
          }}
          onMouseEnter={lift} onMouseLeave={unlift}>
            + Generate New
          </button>
        </div>

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
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.62rem', opacity: 0.5 }}>
                  {c.uses}/{c.maxUses} used
                </div>
                <div style={{ height: '5px', borderRadius: '9999px', background: 'rgba(26,8,0,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '9999px', width: `${Math.min(100, (c.uses / c.maxUses) * 100)}%`, background: c.uses >= c.maxUses ? '#E63946' : '#2D9A4E', transition: 'width 0.3s' }}/>
                </div>
              </div>

              <span style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                padding: '3px 9px', borderRadius: '9999px',
                border: `1.5px solid ${c.active ? '#2D9A4E' : 'rgba(26,8,0,0.2)'}`,
                color: c.active ? '#2D9A4E' : 'rgba(26,8,0,0.35)',
                background: c.active ? 'rgba(45,154,78,0.1)' : 'transparent',
              }}>
                {c.active ? 'Active' : 'Expired'}
              </span>

              {c.active && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => copyText(c.code, setCopied)}
                    style={{
                      ...btnBase, fontSize: '0.68rem', padding: '5px 10px',
                      borderRadius: '9999px', background: '#FFCD00', color: '#1A0800',
                      boxShadow: `2px 2px 0 ${ink}`,
                    }}
                    title="Copy code"
                  >
                    {copied === c.code ? '✓' : '📋'}
                  </button>
                  <button
                    onClick={() => revokeCode(c.id)}
                    style={{
                      ...btnBase, fontSize: '0.68rem', padding: '5px 10px',
                      borderRadius: '9999px', background: '#E63946', color: 'white',
                      boxShadow: `2px 2px 0 ${ink}`,
                    }}
                    title="Revoke code"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}

          {codes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.4 }}>
              No invite codes yet — generate one!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Members tab ───────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  Legend: '#FFCD00', Expert: '#7B2D8B', Pro: '#1565C0', Rookie: '#2D9A4E',
}

function TabMembers() {
  const [members, setMembers] = useState<ApiMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setMembers(await api.get<ApiMember[]>('/admin/members')) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.specialty.toLowerCase().includes(search.toLowerCase())
  )

  async function removeMember(userId: string) {
    try {
      await api.delete(`/admin/members/${userId}`)
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch {}
    setConfirm(null)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, opacity: 0.4 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search members by name or specialty…"
        style={{
          width: '100%', padding: '12px 16px', boxSizing: 'border-box',
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem',
          background: paper, border: `3px solid ${ink}`, borderRadius: '14px',
          boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((m, i) => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '14px',
            border: `2px solid ${ink}`, background: paper,
            boxShadow: `3px 3px 0 ${ink}`,
            animation: 'rh-animate-bounce-in 0.3s ease both',
            animationDelay: `${i * 0.03}s`, animationFillMode: 'both',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: LEVEL_COLOR[m.level] ?? '#FF7B25', border: `2px solid ${ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>{m.avatarEmoji}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                {m.isAdmin && (
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.55rem', padding: '1px 7px', borderRadius: '9999px', background: '#FFCD00', border: `1.5px solid ${ink}`, color: '#1A0800', whiteSpace: 'nowrap' }}>
                    👑 ADMIN
                  </span>
                )}
                <span style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.55rem',
                  padding: '1px 7px', borderRadius: '9999px',
                  background: LEVEL_COLOR[m.level] ?? '#FF7B25', border: `1.5px solid ${ink}`,
                  color: m.level === 'Legend' ? '#1A0800' : 'white',
                  whiteSpace: 'nowrap',
                }}>{m.level}</span>
              </div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.45, marginTop: '2px' }}>
                {m.specialty} · {m.xp.toLocaleString()} XP · joined {new Date(m.joinedAt).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <Link to={`/community/${m.username}`} style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem',
                padding: '6px 12px', borderRadius: '9999px',
                border: `2px solid ${ink}`, background: surface, color: ink,
                textDecoration: 'none', boxShadow: `2px 2px 0 ${ink}`,
                display: 'inline-block',
              }}>View</Link>
              {!m.isAdmin && (
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
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem', opacity: 0.4 }}>
            No members match your search.
          </div>
        )}
      </div>

      {confirm !== null && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(26,8,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
        onClick={() => setConfirm(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: paper, border: `4px solid #E63946`, borderRadius: '20px',
            boxShadow: `8px 8px 0 ${ink}`, padding: '28px',
            maxWidth: 360, width: '100%', textAlign: 'center',
            animation: 'bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', marginBottom: '8px' }}>Remove Member?</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.55, marginBottom: '20px' }}>
              {members.find(m => m.id === confirm)?.name} will lose access to the community.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} style={{
                ...btnBase, fontSize: '0.9rem', padding: '11px 24px',
                borderRadius: '9999px', background: surface, color: ink,
                boxShadow: `3px 3px 0 ${ink}`,
              }}>Cancel</button>
              <button onClick={() => removeMember(confirm!)} style={{
                ...btnBase, fontSize: '0.9rem', padding: '11px 24px',
                borderRadius: '9999px', background: '#E63946', color: 'white',
                boxShadow: `3px 3px 0 ${ink}`,
              }}>Remove →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings tab ──────────────────────────────────────────────

function TabSettings({ initialName, initialEmoji, initialIsPublic, onSaved }: {
  initialName: string; initialEmoji: string; initialIsPublic: boolean
  onSaved: () => void
}) {
  const [communityName,  setCommunityName]  = useState(initialName)
  const [communityEmoji, setCommunityEmoji] = useState(initialEmoji)
  const [isPublic, setIsPublic]             = useState(initialIsPublic)
  const [saved, setSaved] = useState(false)
  const [err,   setErr]   = useState('')

  const EMOJIS = ['🌟', '🚀', '💡', '🏆', '🔮', '⚡', '🌿', '🎯', '💎', '🔥', '🌊', '🎪', '⛓️', '🏦', '🎓', '🦊']

  async function save() {
    setErr('')
    try {
      await api.patch('/admin/settings', { name: communityName, emoji: communityEmoji, isPublic })
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '20px', boxShadow: `4px 4px 0 ${ink}` }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
          ⚙️ Community Settings
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', display: 'block', marginBottom: '6px', opacity: 0.5, letterSpacing: '0.08em' }}>COMMUNITY NAME</label>
            <input
              value={communityName}
              onChange={e => setCommunityName(e.target.value)}
              maxLength={40}
              style={{
                width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '1rem',
                background: surface, border: `3px solid ${ink}`, borderRadius: '12px',
                boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
              }}
            />
          </div>

          <div>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', display: 'block', marginBottom: '8px', opacity: 0.5, letterSpacing: '0.08em' }}>EMOJI</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {EMOJIS.map(em => (
                <button key={em} onClick={() => setCommunityEmoji(em)} style={{
                  width: '38px', height: '38px', borderRadius: '10px', fontSize: '1.2rem',
                  border: `${communityEmoji === em ? 3 : 2}px solid ${ink}`,
                  background: communityEmoji === em ? '#FFCD00' : surface,
                  cursor: 'pointer',
                  boxShadow: communityEmoji === em ? `2px 2px 0 ${ink}` : `1px 1px 0 ${ink}`,
                  transform: communityEmoji === em ? 'scale(1.1) translate(-1px,-1px)' : '',
                  transition: 'all 0.14s cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{em}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${ink}`, background: surface }}>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem' }}>
                {isPublic ? '🌍 Public Community' : '🔒 Private Community'}
              </div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.5, marginTop: '3px' }}>
                {isPublic ? 'Anyone can discover & join' : 'Invite code or approval required'}
              </div>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              style={{
                width: '50px', height: '27px', borderRadius: '13px',
                border: `2px solid ${ink}`, flexShrink: 0,
                background: isPublic ? '#2D9A4E' : surface,
                cursor: 'pointer', position: 'relative',
                boxShadow: `2px 2px 0 ${ink}`, transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: isPublic ? '23px' : '3px',
                width: '17px', height: '17px', borderRadius: '50%',
                background: 'white', border: `1.5px solid ${ink}`,
                transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}/>
            </button>
          </div>

          {err && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(230,57,70,0.1)', border: `1.5px solid #E63946`, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.8rem', color: '#E63946' }}>
              {err}
            </div>
          )}

          <button onClick={save} style={{
            ...btnBase, fontSize: '0.92rem', padding: '13px 0', width: '100%',
            borderRadius: '14px', background: saved ? '#2D9A4E' : '#FFCD00',
            color: saved ? 'white' : '#1A0800', boxShadow: `4px 4px 0 ${ink}`,
          }}
          onMouseEnter={lift} onMouseLeave={e => unlift(e, '4px 4px 0')}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ background: paper, border: `3px solid #E63946`, borderRadius: '16px', padding: '20px', boxShadow: `4px 4px 0 #E63946` }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: '#E63946', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          ⚠️ Danger Zone
        </div>
        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', opacity: 0.6, marginBottom: '14px' }}>
          Deleting the community is irreversible. All member progress will be lost.
        </div>
        <button style={{
          ...btnBase, fontSize: '0.85rem', padding: '11px 24px',
          borderRadius: '9999px', background: 'transparent', color: '#E63946',
          border: `2px solid #E63946`, boxShadow: `3px 3px 0 #E63946`,
        }}>
          Delete Community
        </button>
      </div>
    </div>
  )
}

// ── Learning Content tab ──────────────────────────────────────

function TabContent() {
  const [modules, setModules] = useState<ApiModule[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [draft,   setDraft]   = useState({ emoji: '📚', title: '', desc: '' })

  const load = useCallback(async () => {
    try { setModules(await api.get<ApiModule[]>('/admin/modules')) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function addModule() {
    if (!draft.title.trim()) return
    try {
      const m = await api.post<ApiModule>('/admin/modules', { emoji: draft.emoji, title: draft.title, description: draft.desc })
      setModules(mods => [...mods, m])
      setAdding(false)
      setDraft({ emoji: '📚', title: '', desc: '' })
    } catch {}
  }

  async function togglePublish(id: string, current: boolean) {
    try {
      const updated = await api.patch<ApiModule>(`/admin/modules/${id}`, { published: !current })
      setModules(mods => mods.map(m => m.id === id ? updated : m))
    } catch {}
  }

  async function removeModule(id: string) {
    try {
      await api.delete(`/admin/modules/${id}`)
      setModules(mods => mods.filter(m => m.id !== id))
    } catch {}
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, opacity: 0.4 }}>
      Loading…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', opacity: 0.45, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          📚 Learning Modules
        </div>
        <button onClick={() => setAdding(v => !v)} style={{
          ...btnBase, fontSize: '0.78rem', padding: '8px 18px',
          borderRadius: '9999px', background: adding ? surface : '#FF7B25',
          color: adding ? ink : 'white', boxShadow: `3px 3px 0 ${ink}`,
        }}
        onMouseEnter={lift} onMouseLeave={unlift}>
          {adding ? '✕ Cancel' : '+ Add Module'}
        </button>
      </div>

      {adding && (
        <div style={{
          background: paper, border: `3px solid #FF7B25`,
          borderRadius: '16px', padding: '16px', boxShadow: `4px 4px 0 ${ink}`,
          animation: 'bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} maxLength={2}
              style={{
                width: '52px', padding: '10px 0', textAlign: 'center',
                fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem',
                background: surface, border: `2.5px solid ${ink}`, borderRadius: '10px',
                boxShadow: `2px 2px 0 ${ink}`, outline: 'none',
              }}/>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Module title…"
              style={{
                flex: 1, padding: '10px 14px',
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem',
                background: surface, border: `2.5px solid ${ink}`, borderRadius: '10px',
                boxShadow: `2px 2px 0 ${ink}`, outline: 'none', color: ink,
              }}/>
          </div>
          <input value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="Short description…"
            style={{
              width: '100%', padding: '10px 14px', boxSizing: 'border-box', marginBottom: '10px',
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem',
              background: surface, border: `2.5px solid ${ink}`, borderRadius: '10px',
              boxShadow: `2px 2px 0 ${ink}`, outline: 'none', color: ink,
            }}/>
          <button onClick={addModule} disabled={!draft.title.trim()} style={{
            ...btnBase, fontSize: '0.85rem', padding: '10px 24px',
            borderRadius: '9999px', background: draft.title.trim() ? '#FF7B25' : surface,
            color: draft.title.trim() ? 'white' : ink, boxShadow: `3px 3px 0 ${ink}`,
            opacity: draft.title.trim() ? 1 : 0.45,
          }}>
            Add Module →
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {modules.map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: '14px',
            border: `2px solid ${ink}`, background: paper,
            boxShadow: `3px 3px 0 ${ink}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: '#FF7B25', border: `2px solid ${ink}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>{m.emoji}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', marginBottom: '2px' }}>{m.title}</div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.45 }}>
                {m.description} · {m.lessons} lessons
              </div>
            </div>

            <button
              onClick={() => togglePublish(m.id, m.published)}
              style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem',
                padding: '5px 12px', borderRadius: '9999px',
                border: `1.5px solid ${m.published ? '#2D9A4E' : ink}`,
                background: m.published ? 'rgba(45,154,78,0.12)' : surface,
                color: m.published ? '#2D9A4E' : ink,
                cursor: 'pointer',
              }}
            >
              {m.published ? '✓ Live' : 'Draft'}
            </button>

            <button
              onClick={() => removeModule(m.id)}
              style={{
                ...btnBase, fontSize: '0.68rem', padding: '5px 10px',
                borderRadius: '9999px', background: '#E63946', color: 'white',
                boxShadow: `2px 2px 0 ${ink}`,
              }}
            >✕</button>
          </div>
        ))}

        {modules.length === 0 && !adding && (
          <div style={{ textAlign: 'center', padding: 32, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.4 }}>
            No modules yet — add one above!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main AdminPanel ───────────────────────────────────────────

type Tab = 'overview' | 'codes' | 'members' | 'settings' | 'content'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'codes',    label: 'Codes',    icon: '🔑' },
  { key: 'members',  label: 'Members',  icon: '👥' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'content',  label: 'Content',  icon: '📚' },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, isAdmin, isLoading, refreshUser } = useAuth()
  const [tab,   setTab]   = useState<Tab>('overview')
  const [stats, setStats] = useState<CommunityStats | null>(null)

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/', { replace: true })
  }, [isLoading, isAdmin, navigate])

  const fetchStats = useCallback(async () => {
    try { setStats(await api.get<CommunityStats>('/admin/community')) }
    catch {}
  }, [])

  useEffect(() => { if (isAdmin) fetchStats() }, [isAdmin, fetchStats])

  if (isLoading || !isAdmin || !user) return null

  const communityName  = stats?.name  ?? user.communityName  ?? 'My Community'
  const communityEmoji = stats?.emoji ?? user.communityEmoji ?? '🌟'

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
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.12,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}/>
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '220px', height: '220px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', border: '3px solid rgba(255,255,255,0.12)',
        }}/>

        <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
            marginBottom: '18px',
            padding: '5px 12px', borderRadius: '9999px',
            border: '1.5px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
          }}>← Home</Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '18px',
              background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', flexShrink: 0,
              boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
            }}>{communityEmoji}</div>
            <div>
              <div style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)', marginBottom: '4px',
              }}>Admin Panel</div>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                color: 'white',
                textShadow: '3px 3px 0 rgba(0,0,0,0.3)',
                lineHeight: 1.1,
              }}>{communityName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                  padding: '3px 10px', borderRadius: '9999px',
                  background: 'rgba(255,205,0,0.9)', color: '#1A0800',
                  border: '1.5px solid rgba(0,0,0,0.2)',
                }}>👑 ADMIN</span>
                {stats && (
                  <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                    {stats.members} members
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar — overlaps hero */}
      <div style={{ maxWidth: '680px', margin: '-40px auto 0', padding: '0 16px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '18px', padding: '6px',
          boxShadow: `6px 6px 0 ${ink}`,
          display: 'flex', gap: '4px',
          overflowX: 'auto',
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
        {tab === 'overview' && stats  && <TabOverview stats={stats} />}
        {tab === 'overview' && !stats && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, opacity: 0.4 }}>Loading…</div>
        )}
        {tab === 'codes'    && <TabInviteCodes />}
        {tab === 'members'  && <TabMembers />}
        {tab === 'settings' && (
          <TabSettings
            initialName={communityName}
            initialEmoji={communityEmoji}
            initialIsPublic={stats?.isPublic ?? false}
            onSaved={async () => { await refreshUser(); await fetchStats() }}
          />
        )}
        {tab === 'content'  && <TabContent />}
      </div>
    </div>
  )
}
