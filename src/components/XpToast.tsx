import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export function XpToast() {
  const { xpAnimation, xpGained, triggerXpAnimation } = useAppStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!xpAnimation) return
    // Auto-dismiss after 2.2 s
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      triggerXpAnimation()
      timerRef.current = null
    }, 2200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [xpAnimation, triggerXpAnimation])

  if (!xpAnimation) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'xpToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <style>{`
        @keyframes xpToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.85); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #FA1462, #FF6B35)',
        borderRadius: 40,
        padding: '10px 20px',
        boxShadow: '0 4px 20px rgba(250,20,98,0.45)',
        color: '#fff',
        fontWeight: 800,
        fontSize: 15,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 18 }}>â¡</span>
        +{xpGained} XP
        <span style={{ fontSize: 14, opacity: 0.85 }}>desbloqueado!</span>
      </div>
    </div>
  )
}
