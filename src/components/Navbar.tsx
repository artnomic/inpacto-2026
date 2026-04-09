import type { ReactElement } from 'react'
import { useAppStore } from '../store/appStore'
import type { Screen } from '../store/appStore'

export function Navbar() {
  const { currentScreen, navigateTo, setAddSheetOpen } = useAppStore()

  const authScreens: Screen[] = ['splash', 'login', 'signup', 'verify', 'profile-setup']
  if (authScreens.includes(currentScreen)) return null

  const navItem = (screen: Screen, label: string, icon: ReactElement) => {
    const active = currentScreen === screen
    return (
      <button
        key={screen}
        onClick={() => navigateTo(screen)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '5px 14px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: active ? 'var(--pink)' : 'var(--text3)',
          fontFamily: 'var(--font-body)',
          borderRadius: 10,
          transition: 'color 0.18s',
        }}
      >
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2px' }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '4px 8px calc(var(--safe-bottom) + 6px)',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      zIndex: 50,
      position: 'relative',
      overflow: 'visible',
    }}>
      {/* Inicio */}
      {navItem('home', 'Inicio', <svg viewBox="0 0 24 24" fill={currentScreen === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} width={20} height={20}>
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>)}

      {/* Agenda */}
      {navItem('agenda', 'Agenda', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
        <rect x={3} y={4} width={18} height={18} rx={2} />
        <line x1={16} y1={2} x2={16} y2={6} />
        <line x1={8} y1={2} x2={8} y2={6} />
        <line x1={3} y1={10} x2={21} y2={10} />
      </svg>)}

      {/* FAB - opens add-post sheet, navigates to home first if needed */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <button
          onClick={() => {
            if (currentScreen !== 'home') navigateTo('home')
            setAddSheetOpen(true)
          }}
          style={{
            width: 48,
            height: 48,
            background: 'var(--grad-warm)',
            borderRadius: '50%',
            border: 'none',
            boxShadow: '0 4px 14px rgba(250,20,98,0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateY(-12px)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            color: '#fff',
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px) scale(0.92)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(250,20,98,0.25)'
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'translateY(-12px)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(250,20,98,0.35)'
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
            <line x1={12} y1={5} x2={12} y2={19} />
            <line x1={5} y1={12} x2={19} y2={12} />
          </svg>
        </button>
      </div>

      {/* Loja */}
      {navItem('store', 'Loja', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1={3} y1={6} x2={21} y2={6} />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>)}

      {/* Ao vivo */}
      {navItem('live', 'Ao vivo', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
      </svg>)}
    </div>
  )
}
