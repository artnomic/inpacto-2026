import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 7

function isDismissed(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAndroidChrome(): boolean {
  return /android/i.test(navigator.userAgent) && /chrome/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)
  const deferredPrompt = useRef<any>(null)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    if (isIOS()) {
      setPlatform('ios')
      setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e
      if (!isDismissed()) {
        setPlatform('android')
        setVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  async function install() {
    if (platform === 'android' && deferredPrompt.current) {
      deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      deferredPrompt.current = null
      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      }
      setVisible(false)
    }
  }

  if (!visible || !platform) return null

  return (
    <>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        zIndex: 9991,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
        padding: '24px 24px calc(24px + env(safe-area-inset-bottom))',
        animation: 'sheetUp 0.3s cubic-bezier(0.34,1.4,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <img
            src="/icon-192.png"
            alt="InPacto"
            style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
              InPacto 2026
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>
              Adicione à tela inicial para acesso rápido!
            </div>
          </div>
        </div>

        {platform === 'ios' && (
          <div style={{
            background: 'var(--bg2)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--text2)',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📲</span>
            <span>
              Toque em <strong style={{ color: 'var(--text)' }}>Compartilhar</strong> (
              <span style={{ fontSize: 15 }}>⎋</span>) e depois em{' '}
              <strong style={{ color: 'var(--text)' }}>"Adicionar à Tela de Início"</strong>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {platform === 'android' && (
            <button
              onClick={install}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: 'var(--grad-warm)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(250,20,98,0.3)',
              }}
            >
              Adicionar ao celular
            </button>
          )}
          <button
            onClick={dismiss}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text3)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Agora não
          </button>
        </div>
      </div>
    </>
  )
}
