import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { uploadAvatar, upsertProfile } from '../lib/api'

export function ProfileEditScreen() {
  const { user, updateProfile, goBack, completeMissionByKey } = useAppStore()
  const [name, setName] = useState(user.name)
  const [church, setChurch] = useState(user.church)
  const [city, setCity] = useState(user.city)
  const [bio, setBio] = useState(user.bio)
  const [age, setAge] = useState(String(user.age || ''))
  const [saving, setSaving] = useState(false)
  const [localAvatar, setLocalAvatar] = useState(user.avatar || '')
  const hasSynced = useRef(false)
  useEffect(() => {
    if (!hasSynced.current && (user.name || user.church || user.city || user.bio || user.age)) {
      setName(user.name || '')
      setChurch(user.church || '')
      setCity(user.city || '')
      setBio(user.bio || '')
      setAge(user.age ? String(user.age) : '')
      setLocalAvatar(user.avatar || '')
      hasSynced.current = true
    }
  }, [user.name, user.church, user.city, user.bio, user.age, user.avatar])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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


  const handleSave = async () => {
    setSaving(true)
    await updateProfile({ name, church, city, bio, age: parseInt(age) || user.age })
    // Trigger complete_profile mission if all 5 fields are filled
    if (name.trim() && age.trim() && city.trim() && church.trim() && bio.trim()) {
      await completeMissionByKey('complete_profile')
    }
    setSaving(false)
    goBack()
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        background: 'var(--grad-hero)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, padding: 0 }}>
            ← Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12, padding: '7px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 12 }}>
          Editar Perfil ✏️
        </div>
      </div>

      <div className="scroll-area" style={{ padding: '24px 24px 0' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 82, height: 82, borderRadius: '50%',
              background: 'var(--grad-warm)',
              border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden',
            }}>
              {localAvatar
                ? <img src={localAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name.split(' ').slice(0,2).map((w: string) => w[0]).join('')
              }
            </div>
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: '50%',
                background: uploading ? '#999' : 'var(--pink)',
                border: '2px solid #fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, padding: 0,
              }}
            >
              {uploading ? '⏳' : '📷'}
            </button>
          </div>
        </div>

        {[
          { label: 'Nome completo', placeholder: 'Seu nome', value: name, onChange: setName, type: 'text' },
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
              style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px 15px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--pink)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        ))}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
            Bio
          </label>
          <textarea
            placeholder="Conte um pouco sobre você..."
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            style={{ width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '13px 15px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--pink)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <button
          onClick={handleSave}
          style={{ width: '100%', padding: 15, background: 'var(--grad-warm)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
        >
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
