import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { checkAchievement } from '../lib/api'

export function ProfileSetupScreen() {
  const { navigateTo, updateProfile, loadInitialData, loadAchievements, authUserId, completeMissionByKey } = useAppStore()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [church, setChurch] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), age: parseInt(age) || 17, city, church, bio })
      if (authUserId) await loadInitialData(authUserId)
      // First-time profile setup: fire boas_vindas achievement in background
      checkAchievement('boas_vindas').then(() => loadAchievements()).catch(() => {})
      if (name.trim() && parseInt(age) && city.trim() && church.trim() && bio.trim()) {
        completeMissionByKey('complete_profile')
      }
      navigateTo('home')
    } catch {
      // ignore errors here - profile update is best-effort
      navigateTo('home')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 24px',
        background: 'var(--grad-hero)',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />

        {/* Avatar placeholder */}
        <div style={{
          width: 82, height: 82, borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)', border: '2px dashed rgba(255,255,255,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', margin: '0 auto 16px', gap: 4,
        }}>
          <span style={{ fontSize: 24 }}>📷</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Foto</span>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
          Configure seu perfil
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: 4, textAlign: 'center' }}>
          Como os outros participantes vão te ver
        </div>
      </div>

      {/* Form */}
      <div className="scroll-area" style={{ padding: '24px 24px 0' }}>
        {[
          { label: 'Nome *', placeholder: 'Como você quer ser chamado(a)?', value: name, onChange: setName, type: 'text' },
          { label: 'Idade', placeholder: 'Sua idade', value: age, onChange: setAge, type: 'number' },
          { label: 'Cidade', placeholder: 'Cidade, Estado', value: city, onChange: setCity, type: 'text' },
          { label: 'Igreja', placeholder: 'Nome da sua igreja', value: church, onChange: setChurch, type: 'text' },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
              {field.label}
            </label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '13px 15px',
                color: 'var(--text)', fontSize: 14, outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--pink)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        ))}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
            Bio <span style={{ color: 'var(--text3)', fontWeight: 500 }}>(opcional)</span>
          </label>
          <textarea
            placeholder="Conte um pouco sobre você..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            style={{
              width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '13px 15px',
              color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{
            width: '100%', padding: 15,
            background: saving || !name.trim() ? 'var(--text3)' : 'var(--grad-warm)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: 'white', fontSize: 14, fontWeight: 700,
            cursor: saving || !name.trim() ? 'not-allowed' : 'pointer', marginBottom: 24,
          }}
        >
          {saving ? 'Salvando...' : 'Entrar na conferência 🙌'}
        </button>
      </div>
    </div>
  )
}
