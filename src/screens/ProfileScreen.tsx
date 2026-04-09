import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { uploadAvatar, upsertProfile } from '../lib/api'

const LEVEL_THRESHOLDS = [0, 300, 700, 1200, 2000, 3000]
const LEVEL_NAMES = ['Novo', 'Participante', 'Engajado', 'Comprometido', 'Saturado', 'Líder']

export function ProfileScreen() {
  const { user, missions, achievements, navigateTo, logout } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localAvatar, setLocalAvatar] = useState(user.avatar || '')
  useEffect(() => { setLocalAvatar(user.avatar || '') }, [user.avatar])
  const [uploading, setUploading] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null)

  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
    : '?'
  const completedMissions = missions.filter((m: any) => m.completed).length

  const xp = user.xp || 0
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i; break }
  }
  const levelName = LEVEL_NAMES[level]
  const isMaxLevel = level >= LEVEL_NAMES.length - 1
  const nextThreshold = isMaxLevel
    ? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    : LEVEL_THRESHOLDS[level + 1]
  const prevThreshold = LEVEL_THRESHOLDS[level]
  const xpNeeded = nextThreshold - prevThreshold
  const xpInLevel = xp - prevThreshold
  const progress = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpInLevel / xpNeeded) * 100))
  const xpToNext = Math.max(0, nextThreshold - xp)

  async function handleAvatarChange(e: any) {
    const file = e.target.files && e.target.files[0]
    if (!file || !user.id) return
    try {
      setUploading(true)
      const url = await uploadAvatar(user.id, file)
      await upsertProfile(user.id, { avatar: url })
      setLocalAvatar(url)
      useAppStore.getState().setUserAvatar(url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="scroll-area" style={{ paddingBottom: 88 }}>
        {/* Profile header */}
        <div style={{
          padding: '52px 20px 28px',
          background: 'var(--grad-hero)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Avatar with upload */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <div style={{
              width: 82, height: 82, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', border: '3px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff', overflow: 'hidden',
            }}>
              {localAvatar
                ? <img src={localAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: uploading ? '#999' : 'var(--pink)', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, cursor: 'pointer', padding: 0,
              }}
            >
              {uploading ? '⏳' : '📷'}
            </button>
          </div>

          {/* Level badge */}
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 1 }}>
            Nv. {level + 1} · {levelName}
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff', zIndex: 1, textAlign: 'center' }}>
            {user.name || 'Participante'}
          </div>
          {user.church && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', zIndex: 1 }}>
              ⛪ {user.church}
            </div>
          )}
          {user.bio && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', zIndex: 1, textAlign: 'center', maxWidth: 260 }}>
              {user.bio}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 28, marginTop: 4, zIndex: 1 }}>
            {[
              { val: user.xp.toLocaleString('pt-BR'), lbl: 'XP Total' },
              { val: completedMissions, lbl: 'Missões' },
              { val: achievements.filter((a: any) => a.unlocked).length, lbl: 'Conquistas' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.3px' }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigateTo('profile-edit')}
            style={{
              marginTop: 8, padding: '8px 20px', zIndex: 1,
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✏️ Editar perfil
          </button>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {/* XP Progress */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  ⚡ Nível {level + 1} — {levelName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  {isMaxLevel
                    ? 'Nível máximo atingido!'
                    : 'Ainda ' + xpToNext + ' XP para o próximo nível'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--xp)' }}>{user.xp}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>/ {nextThreshold} XP</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden', height: 8 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, var(--xp), var(--pink))',
                width: progress + '%',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
              Informações
            </div>
            {[
              { icon: '📍', label: 'Cidade', value: user.city || 'Não informado' },
              { icon: '⛪', label: 'Igreja', value: user.church || 'Não informado' },
              { icon: '🎂', label: 'Idade', value: user.age ? user.age + ' anos' : 'Não informado' },
              { icon: '✉️', label: 'E-mail', value: user.email },
              ...(user.bio ? [{ icon: '💬', label: 'Bio', value: user.bio }] : []),
            ].map(info => (
              <div key={info.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border2)' }}>
                <span style={{ fontSize: 16 }}>{info.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{info.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{info.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
              Conquistas 🏅
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {achievements.map((a: any) => (
                <div
                  key={a.id}
                  title={a.title + ': ' + a.description}
                  onClick={() => a.unlocked && setSelectedAchievement(a)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    opacity: a.unlocked ? 1 : 0.35,
                    filter: a.unlocked ? 'none' : 'grayscale(1)',
                    cursor: a.unlocked ? 'pointer' : 'default',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: a.unlocked ? 'rgba(250,20,98,0.1)' : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, border: a.unlocked ? '1px solid rgba(250,20,98,0.2)' : '1px solid var(--border)',
                  }}>
                    {a.icon}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.2 }}>{a.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              width: '100%', padding: 14,
              background: 'transparent', border: '1.5px solid rgba(250,20,98,0.25)',
              borderRadius: 14, color: 'var(--pink)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>🚪</span> Sair da conta
          </button>
        </div>
      </div>
      {selectedAchievement && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 95, backdropFilter: 'blur(3px)' }}
               onClick={() => setSelectedAchievement(null)} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface)',
            borderRadius: '24px 24px 0 0', zIndex: 96, padding: '0 24px 48px' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
              <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 8 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(250,20,98,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                border: '2px solid rgba(250,20,98,0.2)' }}>{selectedAchievement.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', textAlign: 'center' }}>{selectedAchievement.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>{selectedAchievement.description}</div>
              {selectedAchievement.unlockedAt && (
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
                  Desbloqueado em {new Date(selectedAchievement.unlockedAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
