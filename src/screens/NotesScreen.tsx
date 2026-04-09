import { useAppStore } from '../store/appStore'

const NOTES_TYPES = ['plenaria', 'oficina', 'talkshow']

export function NotesScreen() {
  const { notes, sessions, setActiveNote, navigateTo } = useAppStore()

  // Only show sessions that support note-taking
  const allSessions = sessions.filter(s => NOTES_TYPES.includes(s.type))

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
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 180, height: 180,
          background: 'rgba(255,255,255,0.06)', borderRadius: '50%',
        }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>
          Minhas Notas 📝
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
          {notes.filter(n => n.content).length} nota{notes.filter(n => n.content).length !== 1 ? 's' : ''} salva{notes.filter(n => n.content).length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="scroll-area">
        <div style={{ padding: '16px 16px 0' }}>
          {[1, 2].map(day => {
            const daySessions = allSessions.filter(s => s.day === day)
            if (daySessions.length === 0) return null
            return (
              <div key={day}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
                  textTransform: 'uppercase', color: 'var(--text3)',
                  marginBottom: 10, marginTop: day === 2 ? 20 : 0,
                }}>
                  📅 Dia {day}
                </div>
                {daySessions.map(session => {
                  const note = notes.find(n => n.sessionId === session.id)
                  const hasContent = note?.content && note.content.trim().length > 0
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveNote(session.id)
                        navigateTo('note-editor')
                      }}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 8,
                        cursor: 'pointer',
                        borderLeft: hasContent ? '3px solid var(--pink)' : '3px solid var(--bg3)',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                            {session.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: hasContent ? 6 : 0 }}>
                            {session.speaker} · {session.startTime}
                          </div>
                          {hasContent && (
                            <div style={{
                              fontSize: 12, color: 'var(--text2)',
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis', maxWidth: 260,
                            }}>
                              {note!.content}
                            </div>
                          )}
                          {hasContent && note?.updatedAt && (
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                              Atualizado as {note.updatedAt}
                            </div>
                          )}
                          {!hasContent && (
                            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                              Toque para adicionar notas...
                            </div>
                          )}
                        </div>
                        <div style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 18 }}>›</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
