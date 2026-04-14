import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as api from '../lib/api'
import { supabase } from '../lib/supabase'

let _feedChannel: ReturnType<typeof supabase.channel> | null = null
let _liveChannel: ReturnType<typeof supabase.channel> | null = null

export type Screen =
  | 'splash'
  | 'login'
  | 'profile-setup'
  | 'home'
  | 'agenda'
  | 'ranking'
  | 'store'
  | 'live'
  | 'profile'
  | 'profile-edit'
  | 'wishlist'
  | 'notes'
  | 'note-editor'
  | 'admin'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  church: string
  city: string
  bio: string
  xp: number
  age: number
  role?: string
}

export interface EventConfig {
  id: string
  eventName: string
  eventStartDate: string
  eventEndDate: string
  totalDays: number
  tagline: string
  primaryColor: string
  logoUrl?: string
}

export interface Achievement {
  id: string
  key: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
  conditionKey?: string
  conditionValue?: number
}

export interface Mission {
  id: string
  key: string
  title: string
  description: string
  xpReward: number
  icon: string
  completed: boolean
  day: number | null
  type?: 'auto' | 'text' | 'evidence' | 'quiz' | 'admin' | 'checkin'
  eixo?: string
  participationXp?: number
  isActive?: boolean
  status?: 'completed' | 'pending'
}

export interface FeedPost {
  id: string
  userId: string
  userName: string
  userInitials: string
  userAvatar?: string
  church: string
  userXp: number
  type: 'comment' | 'prayer' | 'announcement'
  content: string
  imageUrl?: string
  parentId?: string
  createdAt: string
  reactions: { emoji: string; count: number; reacted: boolean }[]
  likes: number
  liked: boolean
  isPinned?: boolean
  replies?: FeedPost[]
}

export interface Session {
  id: string
  day: number
  title: string
  speaker: string
  type: 'palestra' | 'plenaria' | 'louvor' | 'oficina' | 'talkshow' | 'break' | 'especial' | 'intervalo' | 'grupo' | 'encerramento'
  startTime: string
  endTime: string
  description: string
  isLive: boolean
}

export interface RankingUser {
  id: string
  name: string
  initials: string
  church: string
  xp: number
  position: number
  avatar?: string
}

export interface Product {
  id: string
  category: 'shop' | 'food'
  name: string
  price: number
  emoji: string
  image?: string
  description: string
  venue?: string
  inWishlist: boolean
  purchased?: boolean
}

export interface Note {
  sessionId: string
  sessionTitle: string
  content: string
  updatedAt: string
}

const EMPTY_USER: User = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  church: '',
  city: '',
  bio: '',
  xp: 0,
  age: 17,
}

interface AppState {
  // Navigation
  currentScreen: Screen
  previousScreen: Screen | null
  // Auth
  authUserId: string | null
  // Data
  user: User
  eventConfig: EventConfig | null
  missions: Mission[]
  feed: FeedPost[]
  sessions: Session[]
  liveSession: Session | null
  ranking: RankingUser[]
  products: Product[]
  notes: Note[]
  achievements: Achievement[]
  activeNoteSessionId: string | null
  xpAnimation: boolean
  xpGained: number
  addSheetOpen: boolean
  // Loading states
  loading: boolean
  feedLoading: boolean
  rankingLoading: boolean
  openLiveQuestion: boolean
  toast: { message: string; type: 'success' | 'error' } | null
  celebrationModal: { type: 'mission' | 'achievement' | 'level'; title: string; xp?: number; icon?: string } | null
  // Navigation
  navigateTo: (screen: Screen) => void
  goBack: () => void
  // Auth actions
  login: (email: string) => Promise<void>
  logout: () => void
  initAuth: () => Promise<void>
  // Data loading
  loadInitialData: (userId: string) => Promise<void>
  refreshLiveSession: () => Promise<void>
  loadFeed: () => Promise<void>
  loadRanking: () => Promise<void>
  loadAchievements: () => Promise<void>
  // Actions
  completeMission: (id: string) => Promise<void>
  toggleLike: (postId: string) => void
  addReaction: (postId: string, emoji: string) => void
  addPost: (type: FeedPost['type'], content: string, imageUrl?: string | null, parentId?: string | null) => Promise<void>
  submitLiveQuestion: (sessionId: string, content: string) => Promise<void>
  setLiveSession: (sessionId: string | null) => Promise<void>
  toggleWishlist: (productId: string) => void
  markPurchased: (productId: string) => void
  deletePost: (postId: string) => Promise<void>
  pinPost: (postId: string) => Promise<void>
  saveNote: (sessionId: string, content: string) => Promise<void>
  setActiveNote: (sessionId: string | null) => void
  triggerXpAnimation: () => void
  setAddSheetOpen: (open: boolean) => void
  updateProfile: (data: Partial<User>) => Promise<void>
  completeMissionByKey: (key: string) => void
  setOpenLiveQuestion: (v: boolean) => void
  showToast: (message: string, type?: 'success' | 'error') => void
  hideToast: () => void
  setUserAvatar: (url: string) => void
  showCelebration: (data: { type: 'mission' | 'achievement' | 'level'; title: string; xp?: number; icon?: string }) => void
  hideCelebration: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  currentScreen: 'splash',
  previousScreen: null,
  authUserId: null,
  user: EMPTY_USER,
  eventConfig: null,
  missions: [],
  feed: [],
  sessions: [],
  liveSession: null,
  ranking: [],
  products: [],
  notes: [],
  achievements: [],
  activeNoteSessionId: null,
  xpAnimation: false,
  xpGained: 0,
  addSheetOpen: false,
  loading: false,
  feedLoading: false,
  rankingLoading: false,
  openLiveQuestion: false,
  toast: null,
  celebrationModal: null,

  navigateTo: (screen) => set((s) => ({ currentScreen: screen, previousScreen: s.currentScreen })),
  goBack: () => set((s) => ({ currentScreen: s.previousScreen ?? 'home', previousScreen: null })),

  // Auth: check persisted userId from localStorage (no Supabase Auth session needed)
  initAuth: async () => {
    const { authUserId } = get()
    if (authUserId) {
      const profile = await api.getProfile(authUserId)
      if (profile) {
        set({ user: profile })
        await get().loadInitialData(authUserId)
        set({ currentScreen: 'home' })
      } else {
        // Profile no longer exists — reset
        set({ authUserId: null, user: EMPTY_USER, currentScreen: 'login' })
      }
    } else {
      set({ currentScreen: 'login' })
    }
  },

  login: async (email) => {
    set({ loading: true })
    try {
      const profile = await api.loginByEmail(email)
      set({ authUserId: profile.id, user: profile })
      await get().loadInitialData(profile.id)
      set({ currentScreen: 'home', loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: () => {
    if (_feedChannel) { supabase.removeChannel(_feedChannel); _feedChannel = null }
    if (_liveChannel) { supabase.removeChannel(_liveChannel); _liveChannel = null }
    set({
      authUserId: null,
      user: EMPTY_USER,
      eventConfig: null,
      missions: [],
      feed: [],
      sessions: [],
      liveSession: null,
      ranking: [],
      products: [],
      notes: [],
      achievements: [],
      currentScreen: 'login',
      openLiveQuestion: false,
      toast: null,
      celebrationModal: null,
    })
  },

  // Data Loading
  loadInitialData: async (userId) => {
    const cachedEventConfig = get().eventConfig
    const cachedSessions = get().sessions

    // eventConfig and sessions are static for the event duration — skip re-fetching if already cached.
    // They'll still refresh lazily in the background to pick up any admin changes.
    const [eventConfig, sessions, missions, feed, ranking, products, liveSession, achievements] =
      await Promise.all([
        cachedEventConfig ? Promise.resolve(cachedEventConfig) : api.getEventConfig(),
        cachedSessions.length ? Promise.resolve(cachedSessions) : api.getSessions(),
        api.getMissionsWithStatus(userId),
        api.getFeed(userId),
        api.getRanking(),
        api.getProducts(userId),
        api.getLiveSession(),
        api.getAchievements(userId),
      ])
    const notes = await api.getNotes(userId, sessions)
    set({ eventConfig, sessions, missions, feed, ranking, products, notes, liveSession, achievements })

    // Refresh static data in background so any admin changes eventually propagate
    if (cachedEventConfig || cachedSessions.length) {
      Promise.all([api.getEventConfig(), api.getSessions()]).then(([freshConfig, freshSessions]) => {
        set({ eventConfig: freshConfig, sessions: freshSessions })
      }).catch(() => {})
    }

    // Realtime: subscribe to new feed_posts
    if (_feedChannel) { supabase.removeChannel(_feedChannel); _feedChannel = null }
    _feedChannel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, () => {
        get().loadFeed()
      })
      .subscribe()

    // Realtime: subscribe to sessions table so live status updates reflect immediately on Home and LiveScreen
    if (_liveChannel) { supabase.removeChannel(_liveChannel); _liveChannel = null }
    _liveChannel = supabase
      .channel('live-session-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, () => {
        get().refreshLiveSession()
      })
      .subscribe()
  },

  refreshLiveSession: async () => {
    const liveSession = await api.getLiveSession()
    set({ liveSession })
  },

  loadFeed: async () => {
    const userId = get().authUserId
    if (!userId) return
    set({ feedLoading: true })
    const feed = await api.getFeed(userId)
    set({ feed, feedLoading: false })
  },

  loadRanking: async () => {
    set({ rankingLoading: true })
    const ranking = await api.getRanking()
    set({ ranking, rankingLoading: false })
  },

  loadAchievements: async () => {
    const userId = get().authUserId
    if (!userId) return
    const oldAchievements = get().achievements
    const achievements = await api.getAchievements(userId)
    set({ achievements })
    const newlyUnlocked = achievements.filter(
      a => a.unlocked && !oldAchievements.find(o => o.id === a.id && o.unlocked)
    )
    if (newlyUnlocked.length > 0) {
      set({ celebrationModal: { type: 'achievement', title: newlyUnlocked[0].title, icon: newlyUnlocked[0].icon } })
    }
  },

  // Actions
  completeMission: async (id) => {
    const { authUserId, missions, user } = get()
    const mission = missions.find(m => m.id === id)
    if (!mission || mission.completed || !authUserId) return
    const LEVEL_THRESHOLDS = [0, 300, 700, 1200, 2000, 3000]
    const LEVEL_NAMES = ['Novo', 'Participante', 'Engajado', 'Comprometido', 'Saturado', 'Líder']
    const computeLevel = (xp: number) => {
      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i
      }
      return 0
    }
    const oldLevel = computeLevel(user.xp)
    const newXp = user.xp + mission.xpReward
    const newLevel = computeLevel(newXp)
    set((s) => ({
      missions: s.missions.map(m => m.id === id ? { ...m, completed: true } : m),
      user: { ...s.user, xp: newXp },
      xpAnimation: true,
      xpGained: mission.xpReward,
      celebrationModal: newLevel > oldLevel
        ? { type: 'level', title: LEVEL_NAMES[newLevel], icon: '⬆️' }
        : { type: 'mission', title: mission.title, xp: mission.xpReward },
    }))
    try {
      await api.completeMission(authUserId, id, mission.xpReward)
      if (mission.key === 'checkin') {
        api.checkAchievement(authUserId, 'boas_vindas').catch(() => {})
        api.checkAchievement(authUserId, 'madrugador').catch(() => {})
      }
      api.checkAndUnlockAchievements(authUserId)
        .catch(() => {})
        .finally(() => get().loadAchievements())
    } catch {
      set((s) => ({
        missions: s.missions.map(m => m.id === id ? { ...m, completed: false } : m),
        user: { ...s.user, xp: s.user.xp - mission.xpReward },
        celebrationModal: null,
      }))
    }
  },

  triggerXpAnimation: () => set({ xpAnimation: false }),
  setAddSheetOpen: (open) => set({ addSheetOpen: open }),

  submitLiveQuestion: async (sessionId, content) => {
    const { authUserId } = get()
    if (!authUserId || !content.trim()) return
    await api.submitLiveQuestion(authUserId, sessionId, content)
    get().completeMissionByKey('pergunta_palestra')
    api.checkAchievement(authUserId, 'pergunta_viva').then(() => get().loadAchievements()).catch(() => {})
  },

  setLiveSession: async (sessionId) => {
    if (sessionId) {
      await api.setSessionLive(sessionId, true)
    } else {
      // Turn off current live session
      const { liveSession } = get()
      if (liveSession) await api.setSessionLive(liveSession.id, false)
    }
    // Refresh store — realtime subscription will also pick this up for other clients
    await get().refreshLiveSession()
  },

  toggleLike: (postId) => {
    const { authUserId, feed } = get()
    if (!authUserId) return
    const post = feed.find(p => p.id === postId)
    if (!post) return
    set((s) => ({
      feed: s.feed.map(p =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    }))
    if (!post.liked) {
      get().completeMissionByKey('interact_post')
    }
    api.toggleLike(authUserId, postId, post.liked).catch(() => {
      set((s) => ({
        feed: s.feed.map(p =>
          p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
      }))
    })
  },

  addReaction: (postId, emoji) => {
    const { authUserId, feed } = get()
    if (!authUserId) return
    const post = feed.find(p => p.id === postId)
    if (!post) return
    const existingReaction = post.reactions.find(r => r.emoji === emoji)
    const currentlyReacted = existingReaction?.reacted ?? false
    set((s) => ({
      feed: s.feed.map(p => {
        if (p.id !== postId) return p
        const existing = p.reactions.find(r => r.emoji === emoji)
        if (existing) {
          return {
            ...p,
            reactions: p.reactions.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                : r
            )
          }
        }
        return { ...p, reactions: [...p.reactions, { emoji, count: 1, reacted: true }] }
      })
    }))
    api.toggleReaction(authUserId, postId, emoji, currentlyReacted).catch(() => {})
  },

  addPost: async (type, content, imageUrl?, parentId?) => {
    const { authUserId, user } = get()
    if (!authUserId) return
    const tempId = `temp-${Date.now()}`
    const tempPost: FeedPost = {
      id: tempId,
      userId: authUserId,
      userName: user.name,
      userInitials: user.name.split(' ').slice(0, 2).map(w => w[0]).join(''),
      userAvatar: user.avatar || undefined,
      church: user.church,
      userXp: user.xp,
      type,
      content,
      imageUrl: imageUrl ?? undefined,
      parentId: parentId ?? undefined,
      createdAt: 'agora',
      reactions: [],
      likes: 0,
      liked: false,
      replies: [],
    }
    if (parentId) {
      set((s) => ({
        feed: s.feed.map(p => p.id === parentId
          ? { ...p, replies: [...(p.replies ?? []), tempPost] }
          : p
        )
      }))
    } else {
      set((s) => ({ feed: [tempPost, ...s.feed] }))
    }
    try {
      const real = await api.addPost(authUserId, type, content, imageUrl, parentId)
      if (parentId) {
        set((s) => ({
          feed: s.feed.map(p => p.id === parentId
            ? { ...p, replies: (p.replies ?? []).map(r => r.id === tempId ? { ...tempPost, id: real.id } : r) }
            : p
          )
        }))
      } else {
        set((s) => ({ feed: s.feed.map(p => p.id === tempId ? { ...tempPost, id: real.id } : p) }))
      }
      if (type === 'comment') {
        get().completeMissionByKey('comment')
      }
      api.checkAchievement(authUserId, 'feed_ativo').then(() => get().loadAchievements()).catch(() => {})
    } catch {
      if (parentId) {
        set((s) => ({
          feed: s.feed.map(p => p.id === parentId
            ? { ...p, replies: (p.replies ?? []).filter(r => r.id !== tempId) }
            : p
          )
        }))
      } else {
        set((s) => ({ feed: s.feed.filter(p => p.id !== tempId) }))
      }
    }
  },

  toggleWishlist: (productId) => {
    const { authUserId, products } = get()
    if (!authUserId) return
    const product = products.find(p => p.id === productId)
    if (!product) return
    const wasInWishlist = product.inWishlist
    set((s) => ({
      products: s.products.map(p => p.id === productId ? { ...p, inWishlist: !p.inWishlist } : p)
    }))
    if (!wasInWishlist) {
      const newCount = products.filter(p => p.inWishlist).length + 1
      if (newCount >= 2) {
        get().completeMissionByKey('wishlist_2')
      }
      if (newCount >= 3) {
        api.checkAchievement(authUserId, 'wishlist_cheia').then(() => get().loadAchievements()).catch(() => {})
      }
    }
    api.toggleWishlist(authUserId, productId, wasInWishlist).catch(() => {
      set((s) => ({
        products: s.products.map(p => p.id === productId ? { ...p, inWishlist: !p.inWishlist } : p)
      }))
    })
  },

  markPurchased: (productId) => {
    set((s) => ({
      products: s.products.map(p =>
        p.id === productId ? { ...p, purchased: !p.purchased } : p
      )
    }))
  },

  deletePost: async (postId) => {
    const { authUserId, user } = get()
    if (!authUserId) return
    set(s => ({
      feed: s.feed
        .filter(p => p.id !== postId)
        .map(p => ({ ...p, replies: (p.replies ?? []).filter(r => r.id !== postId) }))
    }))
    try { await api.deletePost(postId, authUserId, user.role === 'admin') } catch { get().loadFeed() }
  },
  pinPost: async (postId) => {
    const post = get().feed.find(p => p.id === postId)
    if (!post) return
    const newPinned = !post.isPinned
    set(s => ({ feed: s.feed.map(p => p.id === postId ? { ...p, isPinned: newPinned } : p) }))
    try { await api.pinPost(postId, newPinned) } catch { get().loadFeed() }
  },
  saveNote: async (sessionId, content) => {
    const { authUserId, sessions } = get()
    if (!authUserId) return
    const session = sessions.find(s => s.id === sessionId)
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    set((s) => {
      const existing = s.notes.find(n => n.sessionId === sessionId)
      if (existing) {
        return { notes: s.notes.map(n => n.sessionId === sessionId ? { ...n, content, updatedAt: now } : n) }
      }
      return {
        notes: [...s.notes, {
          sessionId,
          sessionTitle: session?.title ?? 'Sessao',
          content,
          updatedAt: now,
        }]
      }
    })
    await api.saveNote(authUserId, sessionId, content)
    const filledNotes = get().notes.filter(n => n.content.trim().length > 0)
    if (filledNotes.length >= 3) {
      get().completeMissionByKey('note_3')
    }
  },

  setActiveNote: (sessionId) => set({ activeNoteSessionId: sessionId }),

  updateProfile: async (data) => {
    const { authUserId } = get()
    if (!authUserId) return
    const previousUser = get().user
    set((s) => ({ user: { ...s.user, ...data } }))
    try {
      await api.upsertProfile(authUserId, { ...get().user, ...data })
    } catch (err) {
      // Revert optimistic update and inform the user
      set({ user: previousUser })
      get().showToast('Erro ao salvar perfil. Tente novamente.', 'error')
      console.error('Failed to update profile', err)
      throw err
    }
  },

  completeMissionByKey: (key: string) => {
    const { missions, eventConfig, authUserId } = get()
    if (!authUserId) return

    let currentDay: number | null = null
    if (eventConfig) {
      const startDate = new Date(eventConfig.eventStartDate + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      currentDay = diff < 0 ? 1 : diff >= eventConfig.totalDays ? eventConfig.totalDays : diff + 1
    }

    // Match mission by key: day=null (applies to all days) OR day=currentDay
    const matchFn = (m: Mission) =>
      m.key === key &&
      (m.day === null || (currentDay !== null && m.day === currentDay)) &&
      !m.completed

    const mission = missions.find(matchFn)
    if (mission) {
      get().completeMission(mission.id)
      return
    }

    // Fallback: missions may be empty or stale — refresh from DB and retry
    ;(async () => {
      try {
        const freshMissions = await api.getMissionsWithStatus(authUserId)
        set({ missions: freshMissions })
        const fresh = freshMissions.find(matchFn)
        if (fresh) get().completeMission(fresh.id)
      } catch { /* ignore */ }
    })()
  },

  setOpenLiveQuestion: (v: boolean) => set({ openLiveQuestion: v }),
  showToast: (message: string, type: 'success' | 'error' = 'success') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
  setUserAvatar: (url: string) => set((s) => ({ user: { ...s.user, avatar: url } })),
  showCelebration: (data: { type: 'mission' | 'achievement' | 'level'; title: string; xp?: number; icon?: string }) => set({ celebrationModal: data }),
  hideCelebration: () => set({ celebrationModal: null }),
    }),
    {
      name: 'inpacto-app-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist identity + static event data so returning users see content instantly
      // (no blank screen while Supabase warms up) and we reduce cold-start DB load
      partialize: (state) => ({
        user: state.user,
        authUserId: state.authUserId,
        eventConfig: state.eventConfig,
        sessions: state.sessions,
      }),
    }
  )
)
