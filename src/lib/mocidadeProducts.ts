import type { Product } from '../store/appStore'

export const MOCIDADE_PRODUCTS: Omit<Product, 'inWishlist' | 'purchased'>[] = [
  { id: 'moc-garrafa-1', category: 'shop', name: 'Garrafa João 8:35',    price: 90.80,  emoji: '🫙', image: '/loja/garrafa-1.jpg', description: 'Garrafa exclusiva Mocidade.' },
  { id: 'moc-garrafa-2', category: 'shop', name: 'Garrafa Pão da Vida',  price: 78.80,  emoji: '🫙', image: '/loja/garrafa-2.jpg', description: 'Garrafa exclusiva Mocidade.' },
  { id: 'moc-copo',      category: 'shop', name: 'Copo Saturados',       price: 70.80,  emoji: '🥤', image: '/loja/copo.jpg',      description: 'Copo exclusivo Mocidade.'    },
  { id: 'moc-caderno',   category: 'shop', name: 'Caderno Pão da Vida',  price: 38.80,  emoji: '📓', image: '/loja/caderno.jpg',   description: 'Caderno exclusivo Mocidade.' },
  { id: 'moc-moletom',   category: 'shop', name: "Moletom In God's Hands", price: 159.80, emoji: '🧥', image: '/loja/moletom.jpg', description: 'Moletom exclusivo Mocidade.' },
  { id: 'moc-camisa-1',  category: 'shop', name: 'Camisa Eternidade',    price: 89.80,  emoji: '👕', image: '/loja/camisa-1.jpg',  description: 'Camisa exclusiva Mocidade.'  },
  { id: 'moc-camisa-2',  category: 'shop', name: 'Camisa Pray More',     price: 89.80,  emoji: '👕', image: '/loja/camisa-2.jpg',  description: 'Camisa exclusiva Mocidade.'  },
  { id: 'moc-camisa-3',  category: 'shop', name: 'Camisa Saturados',     price: 89.80,  emoji: '👕', image: '/loja/camisa-3.jpg',  description: 'Camisa exclusiva Mocidade.'  },
]

// Maps product names to image paths — used by api.ts for Supabase products
export const MOCIDADE_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  MOCIDADE_PRODUCTS.map(p => [p.name, p.image as string])
)
