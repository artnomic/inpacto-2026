import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Session } from '../store/appStore'

const TYPE_CONFIG = {
  plenaria: { label: 'Plenária', color: 'rgba(53,18,106,0.08)', textColor: '#35126A' },
  louvor: { label: 'Louvor', color: 'rgba(250,20,98,0.08)', textColor: 'var(--pink)' },
  oficina: { label: 'Oficina', color: 'rgba(77,193,231,0.1)', textColor: '#1A7EA0' },
  talkshow: { label: 'Talkshow', color: 'rgba(130,80,200,0.1)', textColor: '#6B40B0' },
  break: { label: 'Break', color: 'rgba(80,160,80,0.1)', textColor: '#2E7D32' },
  especial: { label: 'Especial', color: 'rgba(255,140,0,0.1)', textColor: '#E65100' },
}

const TYPE_ICON = {
  plenaria: '🎙️',
  louvor: '🎵',
  oficina: '🛠️',
  talkshow: '💬',
  break: '☕',
  especial: '⭐',
}

const NOTES_QUESTIONS_TYPES = ['plenaria', 'oficina', 'talkshow']

export function AgendaScreen() {
  const { sessions, navigateTo, setActiveNote, eventConfig, setOpenLiveQuestion } = useAppStore()
  const [day1Open, setDay1Open] = useState(true)
  const [day2Open, setDay2Open] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const day1 = sessions.filter(s => s.day === 1)
  const day2 = sessions.filter(s => s.day === 2)

  const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
  const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
  const startDate = eventConfig ? new Date(eventConfig.eventStartDate + 'T12:00:00') : null
  const DAY_DATES = [
    { day: 1, sessions: day1, open: day1Open, setOpen: setDay1Open },
    { day: 2, sessions: day2, open: day2Open, setOpen: setDay2Open },
  ].map(({ day, sessions, open, setOpen }) => {
    const d = startDate ? new Date(startDate.getTime() + (day - 1) * 86400000) : null
    return { day, date: d ? String(d.getDate()).padStart(2,'0') : '??', month: d ? MONTHS[d.getMonth()] : '???', weekday: d ? WEEKDAYS[d.getDay()] : '', sessions, open, setOpen }
  })

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
          {startDate ? `Saturados 2026 · ${String(startDate.getDate()).padStart(2,'0')}\u2013${String(startDate.getDate()+1).padStart(2,'0')} de ${startDate.toLocaleDateString('pt-BR',{month:'long'})}` : 'Saturados 2026'}
        </div>
      </div>

      <div className="scroll-area">
        {DAY_DATES.map(({ day, date, month, weekday, sessions: daySessions, open, setOpen }) => (
          <div key={day} style={{ marginBottom: 2 }}>
            {/* Day header */}
            <div
              onClick={() => setOpen(!open)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px', cursor: 'pointer',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--grad-warm)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{date}</span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, opacity: 0.85, color: '#fff', letterSpacing: '0.5px' }}>{month}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Dia {day} · {weekday}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{daySessions.length} atividades</div>
              </div>
              <div style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text3)', fontSize: 16 }}>
                ▾
              </div>
            </div>

            {/* Sessions */}
            {open && (
              <div style={{ background: 'var(--bg2)' }}>
                {daySessions.map((session, idx) => {
                  const cfg = TYPE_CONFIG[session.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.plenaria
                  return (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 20px',
                        cursor: 'pointer', background: 'var(--surface)',
                        borderBottom: idx < daySessions.length - 1 ? '1px solid var(--border2)' : '2px solid var(--bg3)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Time */}
                      <div style={{ width: 48, flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{session.startTime}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{session.endTime}</div>
                      </div>
                      {/* Line */}
                      <div style={{ width: 2, background: 'var(--bg3)', flexShrink: 0, borderRadius: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 2, left: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)', border: '2px solid var(--surface)' }} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 14 }}>{TYPE_ICON[session.type as keyof typeof TYPE_ICON] || '📌'}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{session.title}</span>
                              {session.isLive && <span style={{ fontSize: 10, fontWeight: 800, background: '#e00', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>🔴 AO VIVO</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{session.speaker}</div>
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
        ))}
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
                {TYPE_ICON[selectedSession.type as keyof typeof TYPE_ICON] || '📌'}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--dark)' }}>
                  {selectedSession.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  {selectedSession.speaker}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
                🕐 {selectedSession.startTime}–{selectedSession.endTime}
              </div>
              <div style={{
                background: (TYPE_CONFIG[selectedSession.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.plenaria).color,
                color: (TYPE_CONFIG[selectedSession.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.plenaria).textColor,
                borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {(TYPE_CONFIG[selectedSession.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.plenaria).label}
              </div>
            </div>

            {/* Description */}
            <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{selectedSession.description}</p>
            </div>

            {/* Actions — only for plenaria, oficina, talkshow */}
            {NOTES_QUESTIONS_TYPES.includes(selectedSession.type) && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setActiveNote(selectedSession.id)
                    setSelectedSession(null)
                    navigateTo('note-editor')
                  }}
                  style={{
                    flex: 1, padding: 13,
                    background: 'var(--bg2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', color: 'var(--text2)',
                  }}
                >
                  📝 Anotações
                </button>
                <button
                  onClick={() => { setOpenLiveQuestion(true); setSelectedSession(null); navigateTo('home') }}
                  style={{
                    flex: 1, padding: 13,
                    background: 'var(--grad-warm)',
                    border: 'none',
                    borderRadius: 12, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  🎯 Enviar pergunta
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
