import { useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export function NoteEditorScreen() {
  const { notes, sessions, activeNoteSessionId, saveNote, navigateTo } = useAppStore()
  const session = sessions.find(s => s.id === activeNoteSessionId)
  const existingNote = notes.find(n => n.sessionId === activeNoteSessionId)
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [saved, setSaved] = useState<null | boolean>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleBack = () => {
    saveNote(activeNoteSessionId!, content)
    navigateTo('notes')
  }

  const handleChange = (val: string) => {
    setContent(val)
    setSaved(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveNote(activeNoteSessionId!, val)
      setSaved(true)
    }, 1200)
  }

  if (!session) return null

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 14px',
        background: 'var(--grad-hero)',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, padding: 0 }}
          >
            ← Voltar
          </button>
          <div style={{ fontSize: 11, color: saved ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {saved === null ? null : saved ? '✓ Salvo' : 'Salvando...'}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {session.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {session.speaker} · {session.startTime}–{session.endTime}
          </div>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder={`Suas anotações para "${session.title}"...\n\nDica: Escreva os pontos principais, versículos citados e revelações que Deus trouxe para você!`}
        autoFocus
        style={{
          flex: 1, background: 'var(--surface)', border: 'none',
          color: 'var(--text)', fontSize: 15, lineHeight: 1.8,
          resize: 'none', outline: 'none', padding: '20px 20px',
          fontFamily: 'var(--font-body)',
        }}
      />

      {/* Bottom word count */}
      <div style={{
        padding: '8px 20px 24px', background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {content.split(/\s+/).filter(Boolean).length} palavras
        </span>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 20px', background: 'var(--grad-warm)',
            border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Salvar e voltar
        </button>
      </div>
    </div>
  )
}
