import { useState } from 'react'
import { useAppStore } from '../store/appStore'

export function LoginScreen() {
  const { login, loading } = useAppStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email.trim()) return
    setError('')
    try {
      await login(email.trim())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar'
      setError(msg)
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#F7F5F2',
    }}>
      {/* Full-screen background image */}
      <img
        src="/capa-login.jpg"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'top center',
          zIndex: 0,
        }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />

      {/* Spacer to push card to bottom */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }} />

      {/* Auth card */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '28px 28px 0 0',
        padding: '28px 24px 32px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
        flexShrink: 0,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 4, color: 'var(--dark)' }}>
          Bem-vindo! 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, fontWeight: 500 }}>
          Entre com seu e-mail para acessar a conferência
        </div>

        {error && (
          <div style={{
            background: 'rgba(250,20,98,0.08)', border: '1px solid rgba(250,20,98,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: 'var(--pink)', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block', letterSpacing: '0.2px' }}>
            E-mail
          </label>
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '13px 15px',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email.trim()}
          style={{
            width: '100%', padding: 15, background: loading ? 'var(--text3)' : 'var(--grad-warm)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: 'white', fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.3px',
            transition: 'opacity 0.2s, transform 0.12s',
            opacity: !email.trim() ? 0.6 : 1,
          }}
          onMouseDown={e => { if (!loading) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(0.98)' } }}
          onMouseUp={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
