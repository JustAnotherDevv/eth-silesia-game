import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ink   = 'var(--rh-ink)'
const paper = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

interface Org { id: string; name: string; type: string; color: string; emoji: string; members: number }

const PUBLIC_ORGS: Org[] = [
  { id: 'ETH_SIL',  name: 'ETH Silesia',      type: 'Conference', color: '#7B2D8B', emoji: '⛓️', members: 312  },
  { id: 'PKO_BANK', name: 'PKO Bank',          type: 'Corporate',  color: '#1565C0', emoji: '🏦', members: 1240 },
  { id: 'WAW_UNI',  name: 'Warsaw University', type: 'Education',  color: '#2D9A4E', emoji: '🎓', members: 567  },
  { id: 'FINTECH',  name: 'FinTech Hub',       type: 'Startup',    color: '#FF7B25', emoji: '🚀', members: 89   },
  { id: 'KRAK_UNI', name: 'Krakow Uni',        type: 'Education',  color: '#E63946', emoji: '📚', members: 430  },
  { id: 'DEFI_PL',  name: 'DeFi Poland',       type: 'Community',  color: '#2D9A4E', emoji: '🌿', members: 156  },
]

const PRIVATE_CODES: Record<string, Org> = {
  'GENESIS': { id: 'GENESIS', name: 'Genesis DAO', type: 'DAO',     color: '#7B2D8B', emoji: '🔮', members: 42 },
  'ALPHA23': { id: 'ALPHA23', name: 'Alpha Club',  type: 'Private', color: '#FFCD00', emoji: '⚡', members: 17 },
}

export function OrgSwitcher() {
  const [joined,    setJoined]    = useState<Org[]>([PUBLIC_ORGS[0]])
  const [currentId, setCurrentId] = useState(PUBLIC_ORGS[0].id)
  const [open,      setOpen]      = useState(false)
  const [modal,     setModal]     = useState(false)
  const [tab,       setTab]       = useState<'public' | 'code'>('public')
  const [pickId,    setPickId]    = useState('')
  const [code,      setCode]      = useState('')
  const [codeState, setCodeState] = useState<'idle' | 'finding' | 'found'>('idle')
  const [foundOrg,  setFoundOrg]  = useState<Org | null>(null)

  const isAdmin = localStorage.getItem('xp_is_admin') === 'true'

  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = joined.find(o => o.id === currentId) ?? joined[0]
  const available = PUBLIC_ORGS.filter(o => !joined.some(j => j.id === o.id))
  const canJoin = tab === 'public' ? pickId.length > 0 : codeState === 'found'

  function openModal() {
    setOpen(false); setModal(true); setTab('public')
    setPickId(''); setCode(''); setCodeState('idle'); setFoundOrg(null)
  }

  function findCode() {
    if (code.trim().length < 3 || codeState === 'finding') return
    setCodeState('finding')
    setTimeout(() => {
      const key = code.trim().toUpperCase()
      const org = PRIVATE_CODES[key] ?? {
        id: 'PRIV_' + key, name: key.replace(/_/g, ' '), type: 'Private',
        color: '#7B2D8B', emoji: '🔒', members: 1,
      }
      setFoundOrg(org); setPickId(org.id); setCodeState('found')
    }, 1000)
  }

  function doJoin() {
    const org = tab === 'public'
      ? PUBLIC_ORGS.find(o => o.id === pickId)
      : foundOrg
    if (!org) return
    setJoined(prev => prev.some(j => j.id === org.id) ? prev : [...prev, org])
    setCurrentId(org.id)
    setModal(false)
  }

  return (
    <>
      {/* ── Pill trigger ───────────────────────────────────── */}
      <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
          letterSpacing: '0.05em',
          padding: '5px 9px 5px 7px', borderRadius: '9999px',
          border: `2px solid ${ink}`,
          background: current.color, color: '#1A0800',
          cursor: 'pointer',
          boxShadow: open ? '1px 1px 0 var(--rh-ink)' : '3px 3px 0 var(--rh-ink)',
          transform: open ? 'translate(2px,2px)' : '',
          transition: 'all 0.1s', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '0.85rem' }}>{current.emoji}</span>
          <span style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.name}</span>
          <span style={{ fontSize: '0.55rem', opacity: 0.65 }}>{open ? '▲' : '▼'}</span>
        </button>

        {/* ── Dropdown ──────────────────────────────────────── */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
            minWidth: 230, zIndex: 200,
            background: paper, border: `3px solid ${ink}`,
            borderRadius: 16, boxShadow: `5px 5px 0 ${ink}`,
            overflow: 'hidden',
            animation: 'fly-in-left 0.18s ease both',
          }}>
            {/* Joined list */}
            <div style={{ padding: '10px 10px 4px' }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem',
                letterSpacing: '0.14em', textTransform: 'uppercase',
                opacity: 0.38, padding: '0 4px 6px',
              }}>Your Spaces</div>

              {joined.map(org => (
                <button key={org.id} onClick={() => { setCurrentId(org.id); setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    width: '100%', padding: '7px 8px', borderRadius: 10,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: currentId === org.id ? `color-mix(in srgb, ${org.color} 25%, transparent)` : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (org.id !== currentId) (e.currentTarget as HTMLElement).style.background = surface }}
                  onMouseLeave={e => { if (org.id !== currentId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: org.color, border: `2px solid ${ink}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.82rem', flexShrink: 0,
                  }}>{org.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{org.name}</div>
                    <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.6rem', opacity: 0.4 }}>
                      {org.members.toLocaleString()} members
                    </div>
                  </div>
                  {currentId === org.id && (
                    <span style={{ fontSize: '0.72rem', color: '#2D9A4E', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ borderTop: `2px solid color-mix(in srgb, ${ink} 10%, transparent)`, margin: '2px 0' }}/>

            {/* Admin panel link — only visible to admin */}
            {isAdmin && (
              <>
                <div style={{ borderTop: `2px solid color-mix(in srgb, ${ink} 10%, transparent)`, margin: '2px 0' }}/>
                <div style={{ padding: '4px 10px 2px' }}>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      width: '100%', padding: '7px 8px', borderRadius: 10,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: 'rgba(123,45,139,0.1)',
                      fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
                      color: '#7B2D8B', textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(123,45,139,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(123,45,139,0.1)'}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#7B2D8B', border: `2px solid ${ink}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.82rem', flexShrink: 0,
                    }}>⚙️</div>
                    <div>
                      <div style={{ fontSize: '0.78rem' }}>Admin Panel</div>
                      <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.58rem', opacity: 0.55, color: ink }}>
                        Manage your community
                      </div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.5 }}>→</span>
                  </Link>
                </div>
              </>
            )}

            <div style={{ borderTop: `2px solid color-mix(in srgb, ${ink} 10%, transparent)`, margin: '2px 0' }}/>

            {/* Join CTA */}
            <div style={{ padding: '4px 10px 10px' }}>
              <button onClick={openModal} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 8px',
                border: `2px dashed color-mix(in srgb, ${ink} 28%, transparent)`,
                borderRadius: 10, background: 'transparent', cursor: 'pointer',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', color: ink,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = surface}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `2px dashed color-mix(in srgb, ${ink} 28%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>+</span>
                Join a new space
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Join modal ─────────────────────────────────────── */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(26,8,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, maxHeight: '86vh', overflowY: 'auto',
              background: paper, border: `4px solid ${ink}`,
              borderRadius: 20, boxShadow: `8px 8px 0 ${ink}`,
              animation: 'bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              background: '#FFCD00', borderBottom: `3px solid ${ink}`,
              borderRadius: '16px 16px 0 0',
              padding: '13px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.98rem', color: '#1A0800' }}>
                🏢 Join a Space
              </span>
              <button onClick={() => setModal(false)} style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
                padding: '5px 12px', borderRadius: '9999px',
                border: `2px solid ${ink}`, background: paper, color: ink,
                cursor: 'pointer', boxShadow: `2px 2px 0 ${ink}`,
              }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `2px solid color-mix(in srgb, ${ink} 12%, transparent)`,
              padding: '0 18px',
            }}>
              {(['public', 'code'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem',
                  padding: '11px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', color: ink,
                  borderBottom: tab === t ? `3px solid ${ink}` : '3px solid transparent',
                  opacity: tab === t ? 1 : 0.4, transition: 'opacity 0.12s',
                }}>
                  {t === 'public' ? '🌍 Public' : '🔒 Invite Code'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: 18 }}>

              {/* ── Public tab ────────────────────────────── */}
              {tab === 'public' && (
                available.length === 0
                  ? (
                    <div style={{
                      textAlign: 'center', padding: 32,
                      fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
                      fontSize: '0.9rem', opacity: 0.45,
                    }}>You've joined all public spaces! 🎉</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {available.map(org => {
                        const sel = pickId === org.id
                        return (
                          <button key={org.id} onClick={() => setPickId(org.id)} style={{
                            padding: '13px 11px', borderRadius: 14, textAlign: 'left',
                            border: `${sel ? 3 : 2}px solid ${ink}`,
                            background: sel ? org.color : paper,
                            cursor: 'pointer',
                            boxShadow: sel ? `4px 4px 0 ${ink}` : `2px 2px 0 ${ink}`,
                            transform: sel ? 'translate(-1px,-1px)' : '',
                            transition: 'all 0.14s cubic-bezier(0.34,1.56,0.64,1)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: '1.4rem' }}>{org.emoji}</span>
                              {sel && <span style={{ fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.86rem', marginBottom: 3 }}>{org.name}</div>
                            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.6rem', opacity: 0.52 }}>
                              {org.type} · {org.members.toLocaleString()} members
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
              )}

              {/* ── Code tab ──────────────────────────────── */}
              {tab === 'code' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.87rem', opacity: 0.52, margin: 0 }}>
                    Enter the invite code shared by your organization admin.
                  </p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={code}
                      onChange={e => {
                        setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))
                        setCodeState('idle'); setFoundOrg(null); setPickId('')
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') findCode() }}
                      placeholder="ENTER CODE"
                      maxLength={12}
                      style={{
                        flex: 1, padding: '12px 16px',
                        fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
                        letterSpacing: '0.2em', background: paper,
                        border: `3px solid ${ink}`, borderRadius: 12,
                        boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
                      }}
                    />
                    <button onClick={findCode}
                      disabled={codeState === 'finding' || code.trim().length < 3}
                      style={{
                        fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem',
                        padding: '11px 16px', borderRadius: 12,
                        border: `2.5px solid ${ink}`, background: '#1565C0', color: 'white',
                        cursor: code.trim().length >= 3 ? 'pointer' : 'not-allowed',
                        boxShadow: `3px 3px 0 ${ink}`,
                        opacity: code.trim().length >= 3 ? 1 : 0.42,
                      }}>
                      {codeState === 'finding' ? '⏳' : codeState === 'found' ? '✓' : 'Find'}
                    </button>
                  </div>

                  {codeState === 'found' && foundOrg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 14,
                      border: '2px solid #2D9A4E',
                      background: 'rgba(45,154,78,0.09)',
                      animation: 'bounce-in 0.35s ease both',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: foundOrg.color, border: `2px solid ${ink}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', flexShrink: 0,
                      }}>{foundOrg.emoji}</div>
                      <div>
                        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.93rem' }}>{foundOrg.name}</div>
                        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.68rem', color: '#2D9A4E' }}>
                          ✓ Private space found
                        </div>
                      </div>
                    </div>
                  )}

                  <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.72rem', opacity: 0.35, margin: 0, lineHeight: 1.5 }}>
                    💡 Demo codes: <strong>GENESIS</strong> · <strong>ALPHA23</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0 18px 18px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={doJoin} disabled={!canJoin} style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.93rem',
                padding: '13px 36px', borderRadius: '9999px',
                border: `2.5px solid ${ink}`,
                background: canJoin ? '#2D9A4E' : surface,
                color: canJoin ? 'white' : ink,
                cursor: canJoin ? 'pointer' : 'not-allowed',
                boxShadow: canJoin ? `4px 4px 0 ${ink}` : `1px 1px 0 ${ink}`,
                opacity: canJoin ? 1 : 0.42,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (canJoin) { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${ink}` } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = canJoin ? `4px 4px 0 ${ink}` : `1px 1px 0 ${ink}` }}
              >
                Join Space →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
