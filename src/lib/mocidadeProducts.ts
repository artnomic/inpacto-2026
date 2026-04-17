import type { Product } from '../store/appStore'

export const MOCIDADE_PRODUCTS: Omit<Product, 'inWishlist' | 'purchased'>[] = [
  { id: 'moc-garrafa-1', category: 'shop', name: 'Garrafa 1', price: 90.80, emoji: '🍶', image: '/loja/garrafa-1.jpeg', description: 'Garrafa exclusiva Mocidade.' },
  { id: 'moc-garrafa-2', category: 'shop', name: 'Garrafa 2', price: 78.80, emoji: '🍶', image: '/loja/garrafa-2.jpeg', description: 'Garrafa exclusiva Mocidade.' },
  { id: 'moc-copo',      category: 'shop', name: 'Copo',      price: 70.80, emoji: '🥤',                               description: 'Copo exclusivo Mocidade.' },
  { id: 'moc-caderno',   category: 'shop', name: 'Caderno',   price: 38.80, emoji: '📓', image: '/loja/caderno.jpeg',  description: 'Caderno exclusivo Mocidade.' },
  { id: 'moc-moletom',   category: 'shop', name: 'Moletom',   price: 159.80, emoji: '👕', image: '/loja/moletom.png',  description: 'Moletom exclusivo Mocidade.' },
  { id: 'moc-camisa-1',  category: 'shop', name: 'Camisa 1',  price: 89.80, emoji: '👕', image: '/loja/camisa-1.png',  description: 'Camisa exclusiva Mocidade.' },
  { id: 'moc-camisa-2',  category: 'shop', name: 'Camisa 2',  price: 89.80, emoji: '👕', image: '/loja/camisa-2.png',  description: 'Camisa exclusiva Mocidade.' },
]
