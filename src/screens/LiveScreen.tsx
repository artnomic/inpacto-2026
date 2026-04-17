import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { supabase } from '../lib/supabase'

// Parse imageUrl: returns array or null
function parseImageUrl(imageUrl?: string): string[] | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('[')) {
    try { return JSON.parse(imageUrl) } catch { return null }
  }
  return [imageUrl]
}

interface LiveQuestion {
  id: string
  content: string
  user_id: string
  created_at: string
  userName: string
}

const EMOJIS = ['🙌', '🔥', '❤️', '🙏', '⚡']

function typeColor(type: string) {
  const map: Record<string, string> = {
    plenaria: 'var(--pink)', louvor: '#7c3aed', oficina: '#0891b2',
    talkshow: '#d97706', especial: '#059669', break: '#6b7280',
  }
  return map[type] || 'var(--pink)'
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    plenaria: 'Plenária', louvor: 'Louvor', oficina: 'Oficina',
    talkshow: 'Talk Show', especial: 'Especial', break: 'Intervalo',
  }
  return map[type] || type
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
}

export function LiveScreen() {
  const { liveSession, sessions, activeDay, submitLiveQuestion, refreshLiveSession, setLiveSession, user } = useAppStore()
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({})
  const [questions, setQuestions] = useState<LiveQuestion[]>([])
  const [questionText, setQuestionText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [adminPromptOpen, setAdminPromptOpen] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const isAdmin = user.role === 'admin'

  // Refresh live session on mount and every 60s (fallback for time-based detection)
  useEffect(() => {
    refreshLiveSession()
    const interval = setInterval(() => refreshLiveSession(), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (liveSession) loadQuestions(liveSession.id)
  }, [liveSession])

  async function loadQuestions(sessionId: string) {
    let query = supabase
      .from('live_questions')
      .select('id, content, user_id, created_at, profiles(name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }
    const { data } = await query
    if (data) {
      setQuestions(data.map((q: any) => ({
        id: q.id,
        content: q.content,
        user_id: q.user_id,
        created_at: q.created_at,
        userName: q.profiles?.name || 'Participante',
      })))
    }
  }

  function handleReaction(emoji: string) {
    if (userReacted[emoji]) {
      setReactions(prev => ({ ...prev, [emoji]: Math.max((prev[emoji] || 1) - 1, 0) }))
      setUserReacted(prev => ({ ...prev, [emoji]: false }))
    } else {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
      setUserReacted(prev => ({ ...prev, [emoji]: true }))
    }
  }

  async function handleSubmitQuestion() {
    if (!questionText.trim() || !liveSession) return
    setSubmitting(true)
    try {
      await submitLiveQuestion(liveSession.id, questionText.trim())
      setQuestionText('')
      loadQuestions(liveSession.id)
      useAppStore.getState().completeMissionByKey('pergunta_palestra')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--grad-hero)',
        padding: '52px 20px 20px',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

        {/* Admin control button */}
        {isAdmin && (
          <button
            onClick={() => setAdminPromptOpen(true)}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20, padding: '5px 12px',
              fontSize: 11, fontWeight: 700, color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: 13 }}>⚙️</span> Controle Admin
          </button>
        )}

        {liveSession && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.18)', borderRadius: 20,
            padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 6,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
            AO VIVO
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', marginTop: 2 }}>
          Acontecendo Agora
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
          {liveSession ? liveSession.title : 'Nenhuma sessão ao vivo no momento'}
        </div>
      </div>

      {/* Content */}
      <div className="scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>
        {liveSession ? (
          <>
            {/* Speaker Card */}
            <div style={{
              background: 'var(--surface)', borderRadius: 20, padding: 20,
              marginBottom: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
            }}>
              {(() => {
                const images = parseImageUrl(liveSession.imageUrl)
                const isMulti = images && images.length > 1
                return (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Avatar: real photo or initials fallback */}
                      {images && !isMulti ? (
                        <img
                          src={images[0]}
                          alt={liveSession.speaker}
                          style={{
                            width: 64, height: 64, borderRadius: '50%',
                            objectFit: 'cover', flexShrink: 0,
                            border: '2px solid var(--border)',
                          }}
                        />
                      ) : !isMulti ? (
                        <div style={{
                          width: 60, height: 60, borderRadius: '50%',
                          background: 'var(--grad-warm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {initials(liveSession.speaker || 'S')}
                        </div>
                      ) : null}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'inline-block',
                          background: typeColor(liveSession.type), color: '#fff',
                          fontSize: 10, fontWeight: 700, borderRadius: 6,
                          padding: '2px 8px', marginBottom: 4,
                          textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                        }}>
                          {typeLabel(liveSession.type)}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text1)', lineHeight: 1.3 }}>
                          {liveSession.title}
                        </div>
                        {liveSession.speaker && (
                          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                            {liveSession.speaker}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Multi-photo row for oficinas/talkshow */}
                    {isMulti && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        {images!.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            style={{
                              width: 56, height: 56, borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--border)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
              {liveSession.description ? (
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {liveSession.description}
                </div>
              ) : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
                {'🕐'} {liveSession.startTime} – {liveSession.endTime}
              </div>
            </div>

            {/* Reactions */}
            <div style={{
              background: 'var(--surface)', borderRadius: 16, padding: '14px 16px',
              marginBottom: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                Reações
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      background: userReacted[emoji] ? 'var(--grad-warm)' : 'var(--bg)',
                      border: `1.5px solid ${userReacted[emoji] ? 'transparent' : 'var(--border)'}`,
                      borderRadius: 12, padding: '8px 4px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: userReacted[emoji] ? '#fff' : 'var(--text3)' }}>
                      {reactions[emoji] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Question — only for palestra and talkshow */}
            {(liveSession.type === 'palestra' || liveSession.type === 'talkshow') && (
              <div style={{
                background: 'var(--surface)', borderRadius: 16, padding: 16,
                marginBottom: 14, boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                  {'🎤'} Enviar Pergunta
                </div>
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Digite sua pergunta para o palestrante..."
                  rows={3}
                  style={{
                    width: '100%', background: 'var(--bg)',
                    border: '1.5px solid var(--border)', borderRadius: 12,
                    padding: '10px 12px', fontSize: 14, color: 'var(--text1)',
                    fontFamily: 'var(--font-body)', resize: 'none', outline: 'none',
                    boxSizing: 'border-box' as const,
                  }}
                />
                <button
                  onClick={handleSubmitQuestion}
                  disabled={submitting || !questionText.trim()}
                  style={{
                    width: '100%', marginTop: 8, padding: 12,
                    background: submitting || !questionText.trim() ? 'var(--border)' : 'var(--grad-warm)',
                    border: 'none', borderRadius: 12, color: '#fff',
                    fontWeight: 700, fontSize: 14,
                    cursor: submitting || !questionText.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {submitting ? 'Enviando...' : 'Enviar Pergunta'}
                </button>
              </div>
            )}

            {/* Questions List — only for palestra and talkshow */}
            {(liveSession.type === 'palestra' || liveSession.type === 'talkshow') && questions.length > 0 && (
              <div style={{
                background: 'var(--surface)', borderRadius: 16, padding: 16,
                boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
                  {'💬'} Perguntas ({questions.length})
                </div>
                {questions.map((q, i) => (
                  <div key={q.id} style={{
                    paddingTop: i === 0 ? 0 : 10, paddingBottom: 10,
                    borderBottom: i < questions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)', marginBottom: 2 }}>
                      {q.userName}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>
                      {q.content}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </>
        ) : (
          <>
            {/* No live session */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>{'📺'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text1)', marginBottom: 8 }}>
                Nenhuma sessão ao vivo
              </div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 280 }}>
                Quando uma sessão começar, ela aparecerá aqui automaticamente.
              </div>
            </div>

            {/* Today's upcoming schedule */}
            {sessions.length > 0 && activeDay > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.5px', paddingLeft: 2 }}>
                  Programação do Dia {activeDay}
                </div>
                {sessions.filter(s => s.day === activeDay && s.type !== 'break').slice(0, 6).map(s => (
                  <div key={s.id} style={{
                    background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
                    marginBottom: 10, border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 4, height: 44, borderRadius: 2, background: typeColor(s.type), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 1 }}>{s.title}</div>
                      {s.speaker && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.speaker}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.startTime} – {s.endTime}</div>
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 700, background: typeColor(s.type),
                      color: '#fff', borderRadius: 6, padding: '2px 6px',
                      textTransform: 'uppercase' as const, letterSpacing: '0.3px', flexShrink: 0,
                    }}>
                      {typeLabel(s.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Prompt — bottom sheet to control live sessions */}
      {isAdmin && adminPromptOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setAdminPromptOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 100,
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            zIndex: 101,
            maxHeight: '75%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sheet header */}
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text1)' }}>
                    ⚙️ Controle Ao Vivo
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    Selecione a programação para transmitir
                  </div>
                </div>
                <button
                  onClick={() => setAdminPromptOpen(false)}
                  style={{
                    background: 'var(--bg2)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: 'var(--text2)',
                  }}
                >✕</button>
              </div>

              {/* Turn off button — only shown when something is live */}
              {liveSession && (
                <button
                  onClick={async () => {
                    setToggling('off')
                    try { await setLiveSession(null) } finally { setToggling(null) }
                  }}
                  disabled={toggling !== null}
                  style={{
                    marginTop: 12, width: '100%',
                    padding: '10px 16px',
                    background: toggling ? 'var(--border)' : 'rgba(220,38,38,0.1)',
                    border: '1.5px solid rgba(220,38,38,0.3)',
                    borderRadius: 12, cursor: toggling ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 700, color: '#dc2626',
                    fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <span>🔴</span>
                  {toggling === 'off' ? 'Desligando...' : `Desligar "${liveSession.title}"`}
                </button>
              )}
            </div>

            {/* Sessions list */}
            <div style={{ overflowY: 'auto', padding: '8px 0 24px' }}>
              {Array.from(new Set(sessions.map(s => s.day))).sort().map(day => (
                <div key={day}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: 'var(--text3)',
                    letterSpacing: '0.8px', textTransform: 'uppercase',
                    padding: '10px 20px 4px',
                  }}>
                    Dia {day}
                  </div>
                  {sessions.filter(s => s.day === day).map(s => {
                    const isCurrentLive = liveSession?.id === s.id
                    const isTogglingThis = toggling === s.id
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 20px',
                          background: isCurrentLive ? 'rgba(250,20,98,0.06)' : 'transparent',
                          borderLeft: isCurrentLive ? '3px solid var(--pink)' : '3px solid transparent',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 700,
                            color: isCurrentLive ? 'var(--pink)' : 'var(--text1)',
                            marginBottom: 1,
                          }}>
                            {s.title}
                          </div>
                          {s.speaker && (
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.speaker}</div>
                          )}
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                            {s.startTime} – {s.endTime}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (isCurrentLive) return
                            setToggling(s.id)
                            try { await setLiveSession(s.id) } finally {
                              setToggling(null)
                              setAdminPromptOpen(false)
                            }
                          }}
                          disabled={isCurrentLive || toggling !== null}
                          style={{
                            padding: '7px 14px',
                            background: isCurrentLive
                              ? 'var(--grad-warm)'
                              : isTogglingThis ? 'var(--border)' : 'var(--bg2)',
                            border: isCurrentLive ? 'none' : '1px solid var(--border)',
                            borderRadius: 10, cursor: isCurrentLive || toggling !== null ? 'default' : 'pointer',
                            fontSize: 11, fontWeight: 700,
                            color: isCurrentLive ? '#fff' : 'var(--text2)',
                            fontFamily: 'var(--font-body)',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCurrentLive ? '🔴 Ao vivo' : isTogglingThis ? '...' : 'Ligar'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
