import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { getSessions, setSessionLive, clearAllLive } from '../lib/api'
import type { Session } from '../store/appStore'

const LIVE_TYPES: Session['type'][] = ['palestra', 'talkshow', 'louvor', 'especial']

export function AdminScreen() {
  const { navigateTo } = useAppStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    const data = await getSessions()
    setSessions(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleStart(id: string) {
    setActing(id)
    try {
      await setSessionLive(id, true)
      await load()
    } finally {
      setActing(null)
    }
  }

  async function handleStop(id: string) {
    setActing(id)
    try {
      await setSessionLive(id, false)
      await load()
    } finally {
      setActing(null)
    }
  }

  async function handleClearAll() {
    setActing('all')
    try {
      await clearAllLive()
      await load()
    } finally {
      setActing(null)
    }
  }

  const days = Array.from(new Set(sessions.map(s => s.day))).sort((a, b) => a - b)
  const hasLive = sessions.some(s => s.isLive)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'var(--grad-hero)',
        display: 'flex', alignItems: 'center', gap: 12,
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
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Controle de transmissão ao vivo</div>
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: 16, paddingBottom: 32 }}>
        {/* Global stop button */}
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
      </div>
    </div>
  )
}
