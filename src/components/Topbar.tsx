import { useAppStore } from '../store/appStore'

export function Topbar() {
  const { user, navigateTo } = useAppStore()

  const initials = user.name.split(' ').slice(0, 2).map(w => w[0]).join('')

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px 14px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
        <img
          src="/logo-inpacto.svg"
          alt="InPacto"
          style={{ height: 40, width: 'auto', display: 'block' }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => navigateTo('ranking')}
          style={{
            background: 'var(--xp-bg)',
            border: '1px solid rgba(196,122,0,0.3)',
            color: 'var(--xp)',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 10px',
            borderRadius: 20,
            letterSpacing: '0.3px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          ⚡ {user.xp.toLocaleString('pt-BR')} XP
        </button>
        <button
          onClick={() => navigateTo('profile')}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--grad-warm)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            overflow: 'hidden',
          }}
        >
          {user.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
          }
        </button>
      </div>
    </div>
  )
}
