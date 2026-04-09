import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export function SplashScreen() {
  const { initAuth } = useAppStore()

  useEffect(() => {
    // Give splash 2.2s to show, then check auth
    const t = setTimeout(() => initAuth(), 2200)
    return () => clearTimeout(t)
  }, [initAuth])

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, #FF8F44 0%, #FA1462 50%, #35126A 100%)',
      zIndex: 999, overflow: 'hidden',
    }}>
      {/* Full-screen background image */}
      <img
                src="/saturados-login.jpg"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          zIndex: 1,
        }}
        onError={e => { e.currentTarget.style.display = 'none' }}
      />

      {/* Fallback / overlay content (shown behind image or when image fails) */}
      <div className="splash-up" style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 0,
      }}>
        <img
          src="/logo-inpacto.svg"
          height={70}
          alt="InPacto"
          style={{ filter: 'brightness(0) invert(1)', marginBottom: 16 }}
        />
        <div style={{
          fontSize: 36, fontWeight: 800, color: 'white',
          fontFamily: 'var(--font-display)', letterSpacing: '-1px',
        }}>
          SATURADOS
        </div>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.6)',
          fontWeight: 700, letterSpacing: '5px', marginTop: 6,
          textTransform: 'uppercase',
        }}>
          2026
        </div>
      </div>

      {/* Loading bar (above image) */}
      <div style={{
        position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
        width: 48, zIndex: 2,
      }}>
        <div style={{
          width: 48, height: 3, background: 'rgba(255,255,255,0.2)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: 'rgba(255,255,255,0.85)',
            borderRadius: 2,
            animation: 'splashBar 2s ease forwards',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes splashBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
