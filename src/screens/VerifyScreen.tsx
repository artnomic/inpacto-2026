import { useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { resendVerification } from '../lib/api'

export function VerifyScreen() {
  const { navigateTo, pendingEmail, verifyEmail, loading } = useAppStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (idx: number, val: string) => {
    // Suporta colar o código completo em qualquer campo
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('')
      const next = ['', '', '', '', '', '']
      digits.forEach((d, i) => { next[i] = d })
      setCode(next)
      setError('')
      const lastFilled = Math.min(digits.length, 5)
      inputs.current[lastFilled]?.focus()
      return
    }
    const v = val.replace(/\D/, '').slice(-1)
    const next = [...code]
    next[idx] = v
    setCode(next)
    setError('')
    if (v && idx < 5) inputs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  const isComplete = code.every(c => c !== '')

  const handleVerify = async () => {
    if (!isComplete || loading) return
    setError('')
    try {
      await verifyEmail(code.join(''))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('expired')) {
        setError('Código expirado. Clique em "Reenviar código" para receber um novo.')
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect')) {
        setError('Código incorreto. Verifique e tente novamente.')
      } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('confirmed')) {
        navigateTo('login')
        return
      } else {
        setError('Código inválido ou expirado. Tente novamente.')
      }
      setCode(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }

  const handleResend = async () => {
    if (resending || !pendingEmail) return
    setResending(true)
    setResent(false)
    setError('')
    try {
      await resendVerification(pendingEmail)
      setResent(true)
      setCode(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
    } catch {
      setError('Não foi possível reenviar. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 24px',
        background: 'var(--grad-hero)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <button
          onClick={() => navigateTo('signup')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, marginBottom: 12, padding: 0 }}
        >
          ← Voltar
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#fff' }}>Verificar e-mail</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: 4 }}>
          Insira o código de 6 dígitos enviado para você
        </div>
      </div>

      <div style={{ padding: '32px 24px' }}>
        {/* Email icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(250,20,98,0.1)', border: '2px solid rgba(250,20,98,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 20px',
        }}>
          📧
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
          Código enviado para
        </p>
        <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--pink)', marginBottom: 28 }}>
          {pendingEmail ?? 'seu e-mail'}
        </p>

        {/* Code inputs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              autoFocus={idx === 0}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              style={{
                width: 48, height: 56, textAlign: 'center',
                fontSize: 22, fontWeight: 700,
                background: error ? 'rgba(239,68,68,0.06)' : digit ? 'rgba(250,20,98,0.06)' : 'var(--bg2)',
                border: `2px solid ${error ? '#ef4444' : digit ? 'var(--pink)' : 'var(--border)'}`,
                borderRadius: 12, color: 'var(--text)', outline: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = error ? '#ef4444' : 'var(--pink)' }}
              onBlur={e => { if (!digit) e.target.style.borderColor = error ? '#ef4444' : 'var(--border)' }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#ef4444', fontSize: 13, fontWeight: 500, textAlign: 'center', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Resent success */}
        {resent && !error && (
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#16a34a', fontSize: 13, fontWeight: 500, textAlign: 'center',
          }}>
            ✅ Novo código enviado! Verifique seu e-mail.
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!isComplete || loading}
          style={{
            width: '100%', padding: 15,
            background: isComplete && !loading ? 'var(--grad-warm)' : 'var(--bg3)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: isComplete && !loading ? 'white' : 'var(--text3)',
            fontSize: 14, fontWeight: 700,
            cursor: isComplete && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', marginBottom: 16,
          }}
        >
          {loading ? 'Verificando...' : 'Verificar código'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Não recebeu?{' '}
          <span
            onClick={handleResend}
            style={{
              color: resending ? 'var(--text3)' : 'var(--pink)',
              fontWeight: 600,
              cursor: resending ? 'default' : 'pointer',
            }}
          >
            {resending ? 'Reenviando...' : 'Reenviar código'}
          </span>
        </p>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 16, lineHeight: 1.6 }}>
          Verifique também sua caixa de spam.{'\n'}O código expira em 1 hora.
        </p>
      </div>
    </div>
  )
}
