export interface MenuItem {
  id: string
  name: string
  description: string
}

export interface MenuCategory {
  name: string
  items: MenuItem[]
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  isOpen: boolean
  bannerGradient: string
  logoEmoji: string
  menu: MenuCategory[]
}

export const RESTAURANTES: Restaurant[] = [
  {
    id: 'rest-cantina',
    name: 'Cantina do Evento',
    cuisine: 'Lanches & Salgados',
    isOpen: true,
    bannerGradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    logoEmoji: '🥪',
    menu: [
      {
        name: 'Salgados',
        items: [
          { id: 'c1', name: 'Coxinha', description: 'Frango cremoso com catupiry, massa crocante' },
          { id: 'c2', name: 'Esfiha', description: 'Massa artesanal com carne temperada' },
          { id: 'c3', name: 'Pão de Queijo', description: 'Quentinho, feito na hora' },
        ],
      },
      {
        name: 'Lanches',
        items: [
          { id: 'c4', name: 'X-Burguer', description: 'Hambúrguer artesanal, queijo e alface' },
          { id: 'c5', name: 'Wrap Frango', description: 'Frango grelhado, salada e molho da casa' },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          { id: 'c6', name: 'Suco Natural', description: 'Laranja, limão ou maracujá' },
          { id: 'c7', name: 'Água Mineral', description: 'Com ou sem gás' },
        ],
      },
    ],
  },
  {
    id: 'rest-acai',
    name: 'Açaí & Cia',
    cuisine: 'Açaí & Vitaminas',
    isOpen: true,
    bannerGradient: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
    logoEmoji: '🫐',
    menu: [
      {
        name: 'Açaí',
        items: [
          { id: 'a1', name: 'Açaí Tradicional', description: 'Com granola, banana e mel' },
          { id: 'a2', name: 'Açaí Especial', description: 'Com frutas da estação, granola e leite condensado' },
          { id: 'a3', name: 'Açaí Fit', description: 'Com chia, granola sem açúcar e morango' },
        ],
      },
      {
        name: 'Vitaminas',
        items: [
          { id: 'a4', name: 'Vitamina de Banana', description: 'Banana, aveia e mel' },
          { id: 'a5', name: 'Smoothie Verde', description: 'Espinafre, maçã, gengibre e limão' },
        ],
      },
    ],
  },
  {
    id: 'rest-arabe',
    name: 'Sabor do Oriente',
    cuisine: 'Culinária Árabe',
    isOpen: false,
    bannerGradient: 'linear-gradient(135deg, #d97706, #92400e)',
    logoEmoji: '🧆',
    menu: [
      {
        name: 'Pratos Principais',
        items: [
          { id: 'ar1', name: 'Kafta Grelhada', description: 'Kafta no carvão com arroz árabe e salada fatush' },
          { id: 'ar2', name: 'Frango ao Zaatar', description: 'Frango temperado com ervas árabes e homus' },
          { id: 'ar3', name: 'Prato Vegano', description: 'Falafel, tabule, homus e pão sírio' },
        ],
      },
      {
        name: 'Entradas',
        items: [
          { id: 'ar4', name: 'Homus', description: 'Grão-de-bico cremoso com azeite e páprica' },
          { id: 'ar5', name: 'Quibe Frito', description: 'Tradicional, servido com tahine' },
        ],
      },
      {
        name: 'Sobremesas',
        items: [
          { id: 'ar6', name: 'Baklava', description: 'Massa folhada com pistache e mel' },
        ],
      },
    ],
  },
  {
    id: 'rest-doceria',
    name: 'Doceria Artesanal',
    cuisine: 'Doces & Café',
    isOpen: true,
    bannerGradient: 'linear-gradient(135deg, #db2777, #9d174d)',
    logoEmoji: '🍰',
    menu: [
      {
        name: 'Bolos',
        items: [
          { id: 'd1', name: 'Bolo de Cenoura', description: 'Fofinho com cobertura de chocolate' },
          { id: 'd2', name: 'Bolo Red Velvet', description: 'Massa vermelha com cream cheese' },
          { id: 'd3', name: 'Bolo de Limão', description: 'Com calda de frutas cítricas' },
        ],
      },
      {
        name: 'Doces',
        items: [
          { id: 'd4', name: 'Brigadeiro Gourmet', description: 'Chocolate belga, várias coberturas' },
          { id: 'd5', name: 'Beijinho', description: 'Coco ralado, clássico e cremoso' },
          { id: 'd6', name: 'Trufa de Morango', description: 'Chocolate branco com recheio de morango' },
        ],
      },
      {
        name: 'Café',
        items: [
          { id: 'd7', name: 'Café Expresso', description: 'Grão especial, intenso e encorpado' },
          { id: 'd8', name: 'Cappuccino', description: 'Com espuma de leite e canela' },
        ],
      },
    ],
  },
]
