import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Product } from '../store/appStore'

type StoreTab = 'shop' | 'food'

export function StoreScreen() {
  const { products, toggleWishlist, navigateTo } = useAppStore()
  const [tab, setTab] = useState<StoreTab>('shop')
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = products.filter(p => p.category === tab)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'var(--grad-hero)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Loja & Cantina 🛍️</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
              Produtos e restaurantes
            </div>
          </div>
          <button
            onClick={() => navigateTo('wishlist')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: '8px 14px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💛 Wishlist ({products.filter(p => p.inWishlist).length})
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--surface)',
        padding: '10px 16px',
        gap: 8,
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {([
          { key: 'shop', label: '👕 Mocidade' },
          { key: 'food', label: '🍽️ Restaurantes' },
        ] as { key: StoreTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              background: tab === t.key ? 'var(--grad-warm)' : 'var(--bg2)',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              color: tab === t.key ? '#fff' : 'var(--text2)',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="scroll-area">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 14px 0' }}>
          {filtered.map(product => (
            <div
              key={product.id}
              onClick={() => setSelected(product)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {/* Product image area */}
              <div style={{
                width: '100%',
                height: 110,
                background: 'linear-gradient(135deg, rgba(255,143,68,.1), rgba(250,20,98,.06))',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
              }}>
                {product.image
                  ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 44 }}>{product.emoji}</span>
                }
                {product.inWishlist && (
                  <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 14 }}>💛</div>
                )}
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 }}>
                  {product.name}
                </div>
                {product.venue && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{product.venue}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--pink)' }}>
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
                    style={{
                      background: product.inWishlist ? 'rgba(250,20,98,0.1)' : 'var(--bg2)',
                      border: product.inWishlist ? '1px solid var(--pink)' : '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: product.inWishlist ? 'var(--pink)' : 'var(--text3)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {product.inWishlist ? '💛' : '🤍'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product detail sheet */}
      {selected && (
        <>
          <div
            className="fade-in"
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 90, backdropFilter: 'blur(3px)' }}
            onClick={() => setSelected(null)}
          />
          <div
            className="sheet-up"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--surface)',
              borderRadius: '24px 24px 0 0',
              padding: '12px 20px 40px',
              zIndex: 91,
              boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '0 auto 18px' }} />

            {/* Product header */}
            {selected.image
              ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  style={{ width: '100%', height: 160, borderRadius: 16, objectFit: 'cover', marginBottom: 18, border: '1px solid var(--border)', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, rgba(255,143,68,.12), rgba(250,20,98,.08))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 18, border: '1px solid var(--border)' }}>
                  {selected.emoji}
                </div>
              )
            }

            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
              {selected.name}
            </div>
            {selected.venue && (
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>📍 {selected.venue}</div>
            )}
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--pink)', marginBottom: 12 }}>
              R$ {selected.price.toFixed(2).replace('.', ',')}
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
              {selected.description}
            </p>
            <button
              onClick={() => { toggleWishlist(selected.id); setSelected(null) }}
              style={{
                width: '100%',
                padding: 14,
                background: selected.inWishlist ? 'rgba(250,20,98,0.08)' : 'var(--grad-warm)',
                border: selected.inWishlist ? '1.5px solid var(--pink)' : 'none',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                color: selected.inWishlist ? 'var(--pink)' : '#fff',
              }}
            >
              {selected.inWishlist ? '💛 Remover da Wishlist' : '🤍 Adicionar à Wishlist'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
