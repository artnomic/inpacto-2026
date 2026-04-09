import { useAppStore } from '../store/appStore'

export function WishlistScreen() {
  const { products, toggleWishlist, markPurchased, navigateTo, goBack } = useAppStore()

  const wishlistItems = products.filter(p => p.inWishlist)
  const shopItems = wishlistItems.filter(p => p.category === 'shop')
  const foodItems = wishlistItems.filter(p => p.category === 'food')
  const purchasedCount = wishlistItems.filter(p => p.purchased).length
  const total = wishlistItems.filter(p => !p.purchased).reduce((sum, p) => sum + p.price, 0)

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
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <button
          onClick={goBack}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, marginBottom: 12, padding: 0 }}
        >
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Minha Wishlist 💛</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'itens'}
              {purchasedCount > 0 ? ` • ${purchasedCount} comprado${purchasedCount !== 1 ? 's' : ''}` : ''}
            </div>
          </div>
          {wishlistItems.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Restante</div>
              <div style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>
                R$ {total.toFixed(2).replace('.', ',')}
              </div>
            </div>
          )}
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💛</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Wishlist vazia</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>
            Salve produtos e alimentos que você quer conferir durante o evento!
          </div>
          <button
            onClick={() => navigateTo('store')}
            style={{ padding: '13px 28px', background: 'var(--grad-warm)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Explorar loja
          </button>
        </div>
      ) : (
        <div className="scroll-area">
          {[
            { label: '👕 Produtos Mocidade', items: shopItems },
            { label: '🍽️ Restaurantes', items: foodItems },
          ].filter(s => s.items.length > 0).map(section => (
            <div key={section.label} style={{ padding: '16px 16px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>
                {section.label}
              </div>
              {section.items.map(product => (
                <div
                  key={product.id}
                  style={{
                    background: 'var(--surface)',
                    border: product.purchased ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: 'var(--shadow-sm)',
                    opacity: product.purchased ? 0.75 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: product.purchased ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg, rgba(255,143,68,.1), rgba(250,20,98,.06))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden', position: 'relative',
                  }}>
                    {product.image
                      ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 26 }}>{product.emoji}</span>
                    }
                    {product.purchased && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✅</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--text)',
                      textDecoration: product.purchased ? 'line-through' : 'none',
                      opacity: product.purchased ? 0.6 : 1,
                    }}>{product.name}</div>
                    {product.venue && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{product.venue}</div>}
                    <div style={{
                      fontSize: 15, fontWeight: 800,
                      color: product.purchased ? 'var(--text3)' : 'var(--pink)',
                      marginTop: 4,
                      textDecoration: product.purchased ? 'line-through' : 'none',
                    }}>
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => markPurchased(product.id)}
                      style={{
                        background: product.purchased ? 'rgba(34,197,94,0.12)' : 'var(--bg2)',
                        border: product.purchased ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: product.purchased ? '#16a34a' : 'var(--text3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {product.purchased ? '✅ Comprado' : '✓ Marcar'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      style={{
                        background: 'rgba(250,20,98,0.08)',
                        border: '1px solid rgba(250,20,98,0.2)',
                        borderRadius: 10,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: 'var(--pink)',
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div style={{ height: 20 }} />
        </div>
      )}
    </div>
  )
}
