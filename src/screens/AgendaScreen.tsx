import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Session } from '../store/appStore'

// Types that get a full highlighted card
const CARD_TYPES = new Set(['palestra', 'plenaria', 'louvor', 'talkshow', 'oficina', 'especial'])

const TYPE_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  palestra:     { label: 'Palestra',    color: 'rgba(53,18,106,0.08)',   textColor: '#35126A' },
  plenaria:     { label: 'Plenária',    color: 'rgba(53,18,106,0.08)',   textColor: '#35126A' },
  louvor:       { label: 'Louvor',      color: 'rgba(250,20,98,0.08)',   textColor: 'var(--pink)' },
  oficina:      { label: 'Oficina',     color: 'rgba(77,193,231,0.1)',   textColor: '#1A7EA0' },
  talkshow:     { label: 'Talkshow',    color: 'rgba(130,80,200,0.1)',   textColor: '#6B40B0' },
  break:        { label: 'Break',       color: 'rgba(80,160,80,0.1)',    textColor: '#2E7D32' },
  especial:     { label: 'Especial',    color: 'rgba(255,140,0,0.1)',    textColor: '#E65100' },
  intervalo:    { label: 'Intervalo',   color: 'rgba(150,150,150,0.1)', textColor: '#666' },
  grupo:        { label: 'Grupo',       color: 'rgba(77,193,231,0.08)', textColor: '#1A7EA0' },
  encerramento: { label: 'Encerramento',color: 'rgba(53,18,106,0.1)',   textColor: '#35126A' },
}

const TYPE_ICON: Record<string, string> = {
  palestra:     '🎙️',
  plenaria:     '🎙️',
  louvor:       '🎵',
  oficina:      '🛠️',
  talkshow:     '💬',
  break:        '☕',
  especial:     '⭐',
  intervalo:    '⏸️',
  grupo:        '👥',
  encerramento: '🙌',
}

const DAY_INFO = [
  { day: 1, label: 'Dia 1 · 01/05', weekday: 'Sexta-feira', theme: 'A vida refém da dopamina' },
  { day: 2, label: 'Dia 2 · 02/05', weekday: 'Sábado',      theme: 'A vida que vale a pena ser vivida' },
]

export function AgendaScreen() {
  const { sessions } = useAppStore()
  const [day1Open, setDay1Open] = useState(true)
  const [day2Open, setDay2Open] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const dayOpens = [day1Open, day2Open]
  const daySetOpens = [setDay1Open, setDay2Open]

  const handleCardTap = (session: Session) => {
    if (CARD_TYPES.has(session.type)) {
      setSelectedSession(session)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'var(--grad-hero)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Agenda 📅</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
          InPacto 2026 · 01–02 de maio
        </div>
      </div>

      <div className="scroll-area">
        {DAY_INFO.map(({ day, label, weekday, theme }, di) => {
          const daySessions = sessions.filter(s => s.day === day)
          const open = dayOpens[di]
          const setOpen = daySetOpens[di]
          return (
            <div key={day} style={{ marginBottom: 2 }}>
              {/* Day header */}
              <div
                onClick={() => setOpen(!open)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px', cursor: 'pointer',
                  background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'var(--grad-warm)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{day}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, color: '#fff', letterSpacing: '0.5px' }}>MAI</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{label} · {weekday}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>{theme}</div>
                </div>
                <div style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text3)', fontSize: 16 }}>
                  ▾
                </div>
              </div>

              {/* Sessions */}
              {open && (
                <div style={{ background: 'var(--bg2)' }}>
                  {daySessions.map((session, idx) => {
                    const isCard = CARD_TYPES.has(session.type)
                    const cfg = TYPE_CONFIG[session.type] || TYPE_CONFIG.palestra
                    const icon = TYPE_ICON[session.type] || '📌'
                    const isLast = idx === daySessions.length - 1

                    if (!isCard) {
                      // Simple row for breaks/intervals/groups/closing
                      return (
                        <div
                          key={session.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 20px',
                            background: 'var(--surface)',
                            borderBottom: isLast ? '2px solid var(--bg3)' : '1px solid var(--border2)',
                          }}
                        >
                          <div style={{ width: 44, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>{session.startTime}</div>
                          </div>
                          <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--bg3)', borderRadius: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 13 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{session.title}</span>
                          </div>
                          <div style={{
                            background: cfg.color, color: cfg.textColor,
                            fontSize: 10, fontWeight: 700,
                            padding: '2px 7px', borderRadius: 6,
                            textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
                          }}>
                            {cfg.label}
                          </div>
                        </div>
                      )
                    }

                    // Full card for highlight types
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleCardTap(session)}
                        style={{
                          display: 'flex', gap: 12, padding: '13px 20px',
                          cursor: 'pointer', background: 'var(--surface)',
                          borderBottom: isLast ? '2px solid var(--bg3)' : '1px solid var(--border2)',
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Time */}
                        <div style={{ width: 48, flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{session.startTime}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{session.endTime}</div>
                        </div>
                        {/* Timeline line */}
                        <div style={{ width: 2, background: 'var(--bg3)', flexShrink: 0, borderRadius: 1, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 2, left: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)', border: '2px solid var(--surface)' }} />
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 15 }}>{icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{session.title}</span>
                                {session.isLive && <span style={{ fontSize: 10, fontWeight: 800, background: '#e00', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>🔴 AO VIVO</span>}
                              </div>
                              {session.speaker && (
                                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{session.speaker}</div>
                              )}
                            </div>
                          </div>
                          <div style={{
                            display: 'inline-block',
                            background: cfg.color, color: cfg.textColor,
                            fontSize: 10, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 6, marginTop: 5,
                            textTransform: 'uppercase', letterSpacing: '0.6px',
                          }}>
                            {cfg.label}
                          </div>
                        </div>
                        <div style={{ color: 'var(--text3)', fontSize: 16, alignSelf: 'center' }}>›</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Session detail sheet */}
      {selectedSession && (
        <>
          <div
            className="fade-in"
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 90, backdropFilter: 'blur(3px)' }}
            onClick={() => setSelectedSession(null)}
          />
          <div
            className="sheet-up"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '12px 20px 40px',
              zIndex: 91,
              boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
              maxHeight: '80%',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '0 auto 18px' }} />

            {/* Session header */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--grad-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {TYPE_ICON[selectedSession.type] || '📌'}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--dark)' }}>
                  {selectedSession.title}
                </div>
                {selectedSession.speaker && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                    {selectedSession.speaker}
                  </div>
                )}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                🕐 {selectedSession.startTime}–{selectedSession.endTime}
              </div>
              <div style={{
                background: (TYPE_CONFIG[selectedSession.type] || TYPE_CONFIG.palestra).color,
                color: (TYPE_CONFIG[selectedSession.type] || TYPE_CONFIG.palestra).textColor,
                borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {(TYPE_CONFIG[selectedSession.type] || TYPE_CONFIG.palestra).label}
              </div>
            </div>

            {/* Description */}
            {selectedSession.description && (
              <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{selectedSession.description}</p>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}
