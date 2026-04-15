import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { getSessions, setSessionLive, clearAllLive, getAdminPendingMissions, approveAdminMission, getAllMissions, toggleMissionActive, getActiveDay, setActiveDay } from '../lib/api'
import type { Session } from '../store/appStore'

const LIVE_TYPES: Session['type'][] = ['palestra', 'talkshow', 'louvor', 'especial']

type Tab = 'live' | 'approve' | 'missions'

const TABS: { id: Tab; label: string; badge?: (s: AdminScreenState) => number | null }[] = [
  { id: 'live',     label: 'Ao Vivo' },
  { id: 'approve',  label: 'Aprovar', badge: (s) => s.pendingCount || null },
  { id: 'missions', label: 'Missões' },
]

interface AdminScreenState {
  pendingCount: number
}

export function AdminScreen() {
  const { navigateTo, showToast, activeDay: storeActiveDay, setActiveDayLocal } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('live')
  const [localActiveDay, setLocalActiveDay] = useState<number>(storeActiveDay)
  const [dayActing, setDayActing] = useState(false)

  // ── Ao Vivo state ────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  // ── Aprovar state ────────────────────────────────────────────────────
  const [pendingMissions, setPendingMissions] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // ── Missões state ────────────────────────────────────────────────────
  type MissionRow = { id: string; title: string; icon: string; day: number | null; isActive: boolean; type: string }
  const [allMissions, setAllMissions] = useState<MissionRow[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── Data loaders ─────────────────────────────────────────────────────
  async function load() {
    const data = await getSessions()
    setSessions(data)
    setLoading(false)
  }

  async function loadPending() {
    setPendingLoading(true)
    setPendingError(null)
    try {
      const data = await getAdminPendingMissions()
      setPendingMissions(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[AdminScreen] loadPending error:', msg)
      setPendingError(msg)
      setPendingMissions([])
    } finally {
      setPendingLoading(false)
    }
  }

  async function loadAllMissions() {
    try {
      const data = await getAllMissions()
      setAllMissions(data)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    load()
    loadPending()
    loadAllMissions()
    getActiveDay().then(d => setLocalActiveDay(d))
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────
  async function handleStart(id: string) {
    setActing(id)
    try { await setSessionLive(id, true); await load() }
    finally { setActing(null) }
  }

  async function handleStop(id: string) {
    setActing(id)
    try { await setSessionLive(id, false); await load() }
    finally { setActing(null) }
  }

  async function handleClearAll() {
    setActing('all')
    try { await clearAllLive(); await load() }
    finally { setActing(null) }
  }

  async function handleToggleMission(mission: { id: string; isActive: boolean }) {
    setTogglingId(mission.id)
    const newValue = !mission.isActive
    setAllMissions(prev => prev.map(m => m.id === mission.id ? { ...m, isActive: newValue } : m))
    try {
      await toggleMissionActive(mission.id, newValue)
    } catch {
      setAllMissions(prev => prev.map(m => m.id === mission.id ? { ...m, isActive: mission.isActive } : m))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleApprove(submission: any) {
    setApprovingId(submission.id)
    try {
      const mission = submission.missions
      await approveAdminMission(
        submission.id,
        submission.mission_id,
        submission.user_id,
        mission.xp_reward,
        mission.participation_xp ?? 0
      )
      showToast(`✅ Vencedor definido! +${mission.xp_reward} XP creditados`, 'success')
      setPendingMissions(prev => prev.filter(s => s.mission_id !== submission.mission_id))
      await loadPending()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[AdminScreen] handleApprove error:', msg)
      showToast('Erro ao aprovar: ' + msg, 'error')
    } finally {
      setApprovingId(null)
    }
  }

  async function handleSetDay(day: number) {
    setDayActing(true)
    try {
      await setActiveDay(day)
      setLocalActiveDay(day)
      setActiveDayLocal(day)
    } catch {
      showToast('Erro ao atualizar dia', 'error')
    } finally {
      setDayActing(false)
    }
  }

  const days = Array.from(new Set(sessions.map(s => s.day))).sort((a, b) => a - b)
  const hasLive = sessions.some(s => s.isLive)
  const screenState: AdminScreenState = { pendingCount: pendingMissions.length }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'var(--grad-hero)',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigateTo('profile')}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0,
          }}
        >
          ←
        </button>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Painel Admin
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>InPacto 2026</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        padding: '0 16px',
        gap: 4,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          const badge = tab.badge?.(screenState)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 4px 10px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2.5px solid var(--pink)' : '2.5px solid transparent',
                color: isActive ? 'var(--pink)' : 'var(--text3)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
              {badge != null && badge > 0 && (
                <span style={{
                  background: 'var(--pink)', color: '#fff',
                  fontSize: 10, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 20,
                  lineHeight: '15px',
                }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="scroll-area" style={{ flex: 1, padding: 16, paddingBottom: 32 }}>

        {/* ─── AO VIVO ─────────────────────────────────────────────────── */}
        {activeTab === 'live' && (
          <>
            {/* Day control card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 16, marginBottom: 16,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12,
              }}>
                Controle do Dia
              </div>

              {/* Status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                background: 'var(--bg2)', borderRadius: 10, padding: '10px 12px',
              }}>
                <span style={{ fontSize: 18 }}>
                  {localActiveDay === 0 ? '⏸️' : '🟢'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {localActiveDay === 0
                    ? 'Nenhum dia iniciado'
                    : `Dia ${localActiveDay} em andamento`}
                </span>
              </div>

              {/* Day buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2].map(day => {
                  const isActive = localActiveDay === day
                  return (
                    <div key={day} style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleSetDay(day)}
                        disabled={dayActing || isActive}
                        style={{
                          flex: 1, padding: '10px 0',
                          background: isActive ? 'var(--bg3)' : 'rgba(0,180,80,0.1)',
                          border: isActive ? '1.5px solid var(--border)' : '1.5px solid rgba(0,180,80,0.35)',
                          borderRadius: 10,
                          color: isActive ? 'var(--text3)' : '#00a050',
                          fontSize: 13, fontWeight: 700,
                          cursor: dayActing || isActive ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {isActive ? `✓ Dia ${day} ativo` : `▶ Iniciar Dia ${day}`}
                      </button>
                      {isActive && (
                        <button
                          onClick={() => handleSetDay(0)}
                          disabled={dayActing}
                          style={{
                            padding: '10px 14px',
                            background: 'rgba(200,0,0,0.1)',
                            border: '1.5px solid rgba(200,0,0,0.4)',
                            borderRadius: 10, color: '#cc0000',
                            fontSize: 13, fontWeight: 700,
                            cursor: dayActing ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          ■ Finalizar
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {hasLive && (
              <button
                onClick={handleClearAll}
                disabled={acting === 'all'}
                style={{
                  width: '100%', padding: '13px 20px', marginBottom: 16,
                  background: acting === 'all' ? 'var(--bg3)' : 'rgba(200,0,0,0.1)',
                  border: '1.5px solid rgba(200,0,0,0.4)',
                  borderRadius: 14, color: '#cc0000', fontSize: 14, fontWeight: 700,
                  cursor: acting === 'all' ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'var(--font-body)',
                }}
              >
                ■ Encerrar todas as transmissões
              </button>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Carregando…</div>
            ) : (
              days.map(day => {
                const daySessions = sessions.filter(s => s.day === day && LIVE_TYPES.includes(s.type))
                if (daySessions.length === 0) return null
                return (
                  <div key={day} style={{ marginBottom: 20 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
                      textTransform: 'uppercase', color: 'var(--text3)',
                      marginBottom: 10,
                    }}>
                      Dia {day}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {daySessions.map(session => {
                        const isLive = session.isLive
                        const isActing = acting === session.id
                        return (
                          <div
                            key={session.id}
                            style={{
                              background: isLive ? 'rgba(250,20,98,0.08)' : 'var(--surface)',
                              border: isLive ? '1.5px solid rgba(250,20,98,0.35)' : '1px solid var(--border)',
                              borderRadius: 14, padding: '12px 14px',
                              display: 'flex', alignItems: 'center', gap: 12,
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {isLive && (
                                  <span style={{
                                    background: 'var(--pink)', color: '#fff',
                                    fontSize: 9, fontWeight: 800, padding: '2px 6px',
                                    borderRadius: 4, letterSpacing: '0.5px',
                                  }}>AO VIVO</span>
                                )}
                                {session.title}
                              </div>
                              {session.speaker && (
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{session.speaker}</div>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                                {session.startTime} – {session.endTime}
                              </div>
                            </div>
                            {isLive ? (
                              <button
                                onClick={() => handleStop(session.id)}
                                disabled={!!acting}
                                style={{
                                  padding: '8px 14px', borderRadius: 10, flexShrink: 0,
                                  background: isActing ? 'var(--bg3)' : 'rgba(200,0,0,0.1)',
                                  border: '1.5px solid rgba(200,0,0,0.4)',
                                  color: '#cc0000', fontSize: 13, fontWeight: 700,
                                  cursor: acting ? 'not-allowed' : 'pointer',
                                  fontFamily: 'var(--font-body)',
                                }}
                              >
                                {isActing ? '…' : '■ Encerrar'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStart(session.id)}
                                disabled={!!acting}
                                style={{
                                  padding: '8px 14px', borderRadius: 10, flexShrink: 0,
                                  background: isActing ? 'var(--bg3)' : 'rgba(0,180,80,0.1)',
                                  border: '1.5px solid rgba(0,180,80,0.35)',
                                  color: '#00a050', fontSize: 13, fontWeight: 700,
                                  cursor: acting ? 'not-allowed' : 'pointer',
                                  fontFamily: 'var(--font-body)',
                                }}
                              >
                                {isActing ? '…' : '▶ Iniciar'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {/* ─── APROVAR ─────────────────────────────────────────────────── */}
        {activeTab === 'approve' && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text3)' }}>
                Submissões pendentes
              </div>
              <button
                onClick={loadPending}
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ↻ Atualizar
              </button>
            </div>

            {pendingLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: 13 }}>Carregando…</div>
            ) : pendingError ? (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 14, padding: 14,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Erro ao carregar submissões</div>
                <div style={{ fontSize: 12, color: '#ef4444', opacity: 0.8, wordBreak: 'break-all' }}>{pendingError}</div>
                <button
                  onClick={loadPending}
                  style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >Tentar novamente</button>
              </div>
            ) : pendingMissions.length === 0 ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: 24, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Tudo aprovado!</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma submissão pendente</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingMissions.map((sub: any) => {
                  const mission = sub.missions
                  const profile = sub.profiles
                  const isApproving = approvingId === sub.id
                  return (
                    <div
                      key={sub.id}
                      style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 22 }}>{mission?.icon ?? '📋'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                            {mission?.title ?? 'Missão'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                            {profile?.name ?? 'Participante'} · +{mission?.xp_reward ?? 0} XP
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: '#F59E0B',
                          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                          borderRadius: 6, padding: '2px 7px',
                        }}>
                          ⏳ Pendente
                        </div>
                      </div>

                      {sub.evidence_url && (
                        <img
                          src={sub.evidence_url}
                          alt="evidência"
                          style={{
                            width: '100%', maxHeight: 180, objectFit: 'cover',
                            borderRadius: 10, marginBottom: 10,
                          }}
                        />
                      )}

                      {sub.response_text && (
                        <div style={{
                          background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px',
                          fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10,
                        }}>
                          {sub.response_text}
                        </div>
                      )}

                      <button
                        onClick={() => handleApprove(sub)}
                        disabled={isApproving}
                        style={{
                          width: '100%', padding: '10px 0',
                          background: isApproving ? 'var(--bg3)' : 'rgba(250,20,98,0.1)',
                          border: '1.5px solid rgba(250,20,98,0.35)',
                          borderRadius: 10, color: isApproving ? 'var(--text3)' : 'var(--pink)',
                          fontSize: 13, fontWeight: 700,
                          cursor: isApproving ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {isApproving ? '…' : '👑 Definir como vencedor'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── MISSÕES ─────────────────────────────────────────────────── */}
        {activeTab === 'missions' && (
          <>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
              textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 14,
            }}>
              Liberar / Bloquear Missões
            </div>

            {allMissions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 0', fontSize: 13 }}>
                Carregando…
              </div>
            ) : (() => {
              const missionDays = Array.from(new Set(allMissions.map(m => m.day))).sort((a, b) => {
                if (a === null) return 1
                if (b === null) return -1
                return a - b
              })
              return missionDays.map(day => {
                const group = allMissions.filter(m => m.day === day)
                return (
                  <div key={String(day)} style={{ marginBottom: 16 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                      marginBottom: 6, paddingLeft: 2,
                    }}>
                      {day === null ? 'Sempre disponível' : `Dia ${day}`}
                    </div>
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 14, overflow: 'hidden',
                    }}>
                      {group.map((m, i) => (
                        <div key={m.id}>
                          {i > 0 && <div style={{ height: 1, background: 'var(--border2)', margin: '0 14px' }} />}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '11px 14px',
                            opacity: togglingId === m.id ? 0.6 : 1,
                            transition: 'opacity 0.15s',
                          }}>
                            <span style={{ fontSize: 18, flexShrink: 0, width: 26, textAlign: 'center' }}>{m.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>{m.title}</div>
                              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{m.type}</div>
                            </div>
                            <button
                              onClick={() => handleToggleMission(m)}
                              disabled={togglingId === m.id}
                              style={{
                                flexShrink: 0, cursor: 'pointer',
                                background: 'none', border: 'none', padding: 0,
                              }}
                            >
                              <div style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: m.isActive ? 'var(--pink)' : 'var(--bg3)',
                                position: 'relative',
                                transition: 'background 0.2s',
                              }}>
                                <div style={{
                                  position: 'absolute', top: 3,
                                  left: m.isActive ? 23 : 3,
                                  width: 18, height: 18, borderRadius: '50%',
                                  background: '#fff',
                                  transition: 'left 0.2s',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                }} />
                              </div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </>
        )}

      </div>
    </div>
  )
}
