import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { Product } from '../store/appStore'
import { RESTAURANTES } from '../lib/restaurantesData'
import type { Restaurant } from '../lib/restaurantesData'

type StoreTab = 'shop' | 'food'

export function StoreScreen() {
  const { products, toggleWishlist, navigateTo } = useAppStore()
  const [tab, setTab] = useState<StoreTab>('shop')
  const [selected, setSelected] = useState<Product | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const filtered = products.filter(p => p.category === tab)
  const featured = products.find(p => p.id === 'moc-camisa-3') ?? null

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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Loja</div>
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
            ❤️ Wishlist ({products.filter(p => p.inWishlist).length})
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
          { key: 'shop', label: 'Mocidade' },
          { key: 'food', label: 'Restaurantes' },
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

      {/* Content */}
      <div className="scroll-area">

        {/* ── MOCIDADE TAB ── */}
        {tab === 'shop' && (
          <>
            {/* Featured card — Camisa Saturados */}
            {featured && (
              <div style={{ padding: '14px 14px 0' }}>
                <div
                  onClick={() => setSelected(featured)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.15s',
                    marginBottom: 10,
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                    {featured.image && (
                      <img src={featured.image} alt={featured.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                      padding: '16px 16px 14px',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>Destaque</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{featured.name}</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                        R$ {featured.price.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 14px 0' }}>
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
                  <div style={{
                    width: '100%', height: 170, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid var(--border)', position: 'relative',
                  }}>
                    {product.image
                      ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 44 }}>{product.emoji}</span>
                    }
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
                          background: product.inWishlist ? 'rgba(229,62,62,0.1)' : 'transparent',
                          border: product.inWishlist ? '1px solid #e53e3e' : '1px solid #ccc',
                          borderRadius: 8,
                          padding: '4px 8px',
                          fontSize: 13,
                          cursor: 'pointer',
                          color: product.inWishlist ? '#e53e3e' : '#ccc',
                          transition: 'all 0.15s',
                          lineHeight: 1,
                        }}
                      >
                        {product.inWishlist ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 14 }} />
          </>
        )}

        {/* ── RESTAURANTES TAB ── */}
        {tab === 'food' && (
          <div style={{ padding: '14px 14px 0' }}>
            {RESTAURANTES.map(rest => (
              <div
                key={rest.id}
                onClick={() => setSelectedRestaurant(rest)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  marginBottom: 12,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.985)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.985)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Banner */}
                <div style={{
                  height: 110,
                  background: rest.bannerGradient,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 48, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>{rest.logoEmoji}</span>
                  {/* Open/closed badge */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: rest.isOpen ? 'rgba(34,197,94,0.9)' : 'rgba(100,100,100,0.85)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                  }}>
                    {rest.isOpen ? 'Aberto' : 'Fechado'}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: '12px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{rest.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{rest.cuisine}</div>
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text3)' }}>›</div>
                </div>
              </div>
            ))}
            <div style={{ height: 14 }} />
          </div>
        )}
      </div>

      {/* ── PRODUCT DETAIL SHEET (Mocidade) ── */}
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
            {selected.image
              ? <img src={selected.image} alt={selected.name} style={{ width: '100%', height: 240, borderRadius: 16, objectFit: 'cover', marginBottom: 18, display: 'block' }} />
              : <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, rgba(255,143,68,.12), rgba(250,20,98,.08))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 18, border: '1px solid var(--border)' }}>{selected.emoji}</div>
            }
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{selected.name}</div>
            {selected.venue && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>📍 {selected.venue}</div>}
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--pink)', marginBottom: 12 }}>R$ {selected.price.toFixed(2).replace('.', ',')}</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{selected.description}</p>
            <button
              onClick={() => { toggleWishlist(selected.id); setSelected(null) }}
              style={{
                width: '100%', padding: 14,
                background: selected.inWishlist ? 'rgba(229,62,62,0.08)' : 'var(--grad-warm)',
                border: selected.inWishlist ? '1.5px solid #e53e3e' : 'none',
                borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                color: selected.inWishlist ? '#e53e3e' : '#fff',
              }}
            >
              {selected.inWishlist ? '❤️ Remover da Wishlist' : '🤍 Adicionar à Wishlist'}
            </button>
          </div>
        </>
      )}

      {/* ── RESTAURANT DETAIL VIEW ── */}
      {selectedRestaurant && (
        <div
          className="sheet-up"
          style={{
            position: 'absolute', inset: 0,
            background: 'var(--bg)',
            zIndex: 92,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Restaurant header / banner */}
          <div style={{
            height: 180,
            background: selectedRestaurant.bannerGradient,
            position: 'relative',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{selectedRestaurant.logoEmoji}</span>

            {/* Back button */}
            <button
              onClick={() => setSelectedRestaurant(null)}
              style={{
                position: 'absolute', top: 48, left: 16,
                background: 'rgba(0,0,0,0.35)',
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ← Voltar
            </button>

            {/* Open badge */}
            <div style={{
              position: 'absolute', top: 52, right: 16,
              background: selectedRestaurant.isOpen ? 'rgba(34,197,94,0.9)' : 'rgba(100,100,100,0.85)',
              color: '#fff', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20,
            }}>
              {selectedRestaurant.isOpen ? 'Aberto' : 'Fechado'}
            </div>

            {/* Name overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
              padding: '12px 18px',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{selectedRestaurant.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{selectedRestaurant.cuisine}</div>
            </div>
          </div>

          {/* Menu */}
          <div className="scroll-area">
            {selectedRestaurant.menu.map(category => (
              <div key={category.name} style={{ padding: '18px 16px 0' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
                  textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10,
                }}>
                  {category.name}
                </div>
                {category.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: idx < category.items.length - 1 ? 8 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                      background: selectedRestaurant.bannerGradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24,
                    }}>
                      {selectedRestaurant.logoEmoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ height: 28 }} />
          </div>
        </div>
      )}
    </div>
  )
}
