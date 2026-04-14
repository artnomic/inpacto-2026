import { supabase } from './supabase'
import type {
  Achievement, EventConfig, FeedPost, Mission, Note, Product, RankingUser, Session, User,
} from '../store/appStore'

// ─── AUTH ────────────────────────────────────────────────────────────────────

// Login by email only — no password, no Supabase Auth session.
// Looks up the profile directly; only pre-registered emails can log in.
export async function loginByEmail(email: string): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !data) {
    throw new Error('E-mail não encontrado. Verifique e tente novamente.')
  }

  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    avatar: data.avatar_url ?? '',
    church: data.church ?? '',
    city: data.city ?? '',
    bio: data.bio ?? '',
    xp: data.xp ?? 0,
    age: data.age ?? undefined,
    role: data.role ?? 'user',
  }
}

// ─── EVENT CONFIG ─────────────────────────────────────────────────────────────

export async function getEventConfig(): Promise<EventConfig | null> {
  const { data, error } = await supabase
    .from('event_config')
    .select('*')
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    eventName: data.event_name,
    eventStartDate: data.event_start_date,
    eventEndDate: data.event_end_date,
    totalDays: data.total_days,
    tagline: data.tagline ?? 'Saturados do Espírito',
    primaryColor: data.primary_color ?? '#FA1462',
    logoUrl: data.logo_url ?? undefined,
  }
}

// ─── PROFILES ────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    avatar: data.avatar_url ?? '',
    church: data.church ?? '',
    city: data.city ?? '',
    bio: data.bio ?? '',
    xp: data.xp ?? 0,
    age: data.age ?? undefined,
    role: data.role ?? 'user',
  }
}

export async function upsertProfile(userId: string, updates: Partial<User>) {
  const raw = {
    name: updates.name,
    avatar_url: updates.avatar,
    church: updates.church,
    city: updates.city,
    bio: updates.bio,
    age: updates.age,
  }
  const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined))
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
  if (error) throw error
}

export async function addXp(userId: string, amount: number) {
  const { data } = await supabase.from('profiles').select('xp').eq('id', userId).single()
  const newXp = (data?.xp ?? 0) + amount
  await supabase.from('profiles').update({ xp: newXp }).eq('id', userId)
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('day')
    .order('start_time')

  if (error || !data) return []

  return data.map(s => ({
    id: s.id,
    day: s.day,
    title: s.title,
    speaker: s.speaker ?? '',
    type: s.type as Session['type'],
    startTime: s.start_time,
    endTime: s.end_time,
    description: s.description ?? '',
    isLive: s.is_live ?? false,
  }))
}

// Live session: first checks is_live flag (manual control), then falls back to time-based detection
export async function getLiveSession(): Promise<Session | null> {
  // 1. Priority: check if any session has is_live = true (manual admin toggle)
  const { data: manualLive } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_live', true)
    .limit(1)
    .maybeSingle()

  if (manualLive) {
    return {
      id: manualLive.id,
      day: manualLive.day,
      title: manualLive.title,
      speaker: manualLive.speaker ?? '',
      type: manualLive.type as Session['type'],
      startTime: manualLive.start_time,
      endTime: manualLive.end_time,
      description: manualLive.description ?? '',
      isLive: true,
    }
  }

  // 2. Fallback: time-based detection within the event window
  const config = await getEventConfig()
  if (!config) return null

  const eventStart = new Date(config.eventStartDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - eventStart.getTime()) / 86400000)
  const currentDay = diffDays + 1

  if (currentDay < 1 || currentDay > config.totalDays) return null

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('day', currentDay)
    .order('start_time')

  if (error || !data || data.length === 0) return null

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const currentTime = `${hh}:${mm}`
  const live = data.find(s => s.start_time <= currentTime && currentTime < s.end_time)
  if (!live) return null

  return {
    id: live.id,
    day: live.day,
    title: live.title,
    speaker: live.speaker ?? '',
    type: live.type as Session['type'],
    startTime: live.start_time,
    endTime: live.end_time,
    description: live.description ?? '',
    isLive: true,
  }
}

// Turn a specific session on/off as live. Ensures only one session is live at a time.
export async function setSessionLive(sessionId: string, isLive: boolean) {
  if (isLive) {
    // Primeiro desliga qualquer sessão ao vivo antes de ligar a nova
    await supabase.from('sessions').update({ is_live: false }).eq('is_live', true)
  }
  const { error } = await supabase
    .from('sessions')
    .update({ is_live: isLive })
    .eq('id', sessionId)
  if (error) throw error
}

// Desliga todas as sessões ao vivo de uma vez
export async function clearAllLive() {
  const { error } = await supabase
    .from('sessions')
    .update({ is_live: false })
    .eq('is_live', true)
  if (error) throw error
}

// Retorna a sessão marcada como ao vivo (manual admin toggle)
export async function getLiveSessionManual(): Promise<Session | null> {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_live', true)
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    day: data.day,
    title: data.title,
    speaker: data.speaker ?? '',
    type: data.type as Session['type'],
    startTime: data.start_time,
    endTime: data.end_time,
    description: data.description ?? '',
    isLive: true,
  }
}

// ─── MISSIONS ─────────────────────────────────────────────────────────────────

export async function getMissionsWithStatus(userId: string): Promise<Mission[]> {
  const [missionsRes, userMissionsRes] = await Promise.all([
    supabase.from('missions').select('*').order('day', { nullsFirst: false }).order('order_index'),
    supabase.from('user_missions').select('mission_id, status').eq('user_id', userId),
  ])

  const missions = missionsRes.data ?? []
  const userMissionsMap = new Map(
    (userMissionsRes.data ?? []).map(um => [um.mission_id, um.status as string])
  )

  return missions.map(m => {
    const umStatus = userMissionsMap.get(m.id)
    return {
      id: m.id,
      key: m.key ?? '',
      title: m.title,
      description: m.description ?? '',
      xpReward: m.xp_reward,
      icon: m.icon,
      day: m.day ?? null,
      completed: !!umStatus,
      type: (m.type ?? 'auto') as Mission['type'],
      eixo: m.eixo ?? 'geral',
      participationXp: m.participation_xp ?? 0,
      isActive: m.is_active ?? true,
      status: (umStatus ?? undefined) as Mission['status'],
    }
  })
}

export async function submitMissionEvidence(
  userId: string,
  missionId: string,
  file: File,
  xpReward: number,
  isAdmin: boolean
): Promise<void> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${missionId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('mission-evidence')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('mission-evidence').getPublicUrl(path)
  const status = isAdmin ? 'pending' : 'completed'

  const { error } = await supabase
    .from('user_missions')
    .upsert(
      { user_id: userId, mission_id: missionId, evidence_url: data.publicUrl, status },
      { onConflict: 'user_id,mission_id' }
    )
  if (error) throw error

  if (!isAdmin) {
    await addXp(userId, xpReward)
  }
}

export async function submitMissionText(
  userId: string,
  missionId: string,
  text: string,
  xpReward: number
): Promise<void> {
  const { error } = await supabase
    .from('user_missions')
    .upsert(
      { user_id: userId, mission_id: missionId, response_text: text, status: 'completed' },
      { onConflict: 'user_id,mission_id' }
    )
  if (error) throw error
  await addXp(userId, xpReward)
}

export async function getAdminPendingMissions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_missions')
    .select(`
      id,
      user_id,
      mission_id,
      evidence_url,
      response_text,
      status,
      missions!inner (title, xp_reward, participation_xp, icon),
      profiles!user_missions_user_id_fkey (name)
    `)
    .eq('status', 'pending')
    .order('id')

  if (error) throw error
  return data ?? []
}

export async function approveAdminMission(
  winnerUserMissionId: string,
  missionId: string,
  winnerUserId: string,
  winnerXp: number,
  participationXp: number
): Promise<void> {
  // Mark winner as completed and credit full XP
  const { error: winnerError } = await supabase
    .from('user_missions')
    .update({ status: 'completed' })
    .eq('id', winnerUserMissionId)
  if (winnerError) throw winnerError
  await addXp(winnerUserId, winnerXp)

  // Get all other pending submissions for this mission
  const { data: others } = await supabase
    .from('user_missions')
    .select('id, user_id')
    .eq('mission_id', missionId)
    .eq('status', 'pending')
    .neq('id', winnerUserMissionId)

  if (others && others.length > 0) {
    const ids = others.map(o => o.id)
    await supabase
      .from('user_missions')
      .update({ status: 'completed' })
      .in('id', ids)

    if (participationXp > 0) {
      await Promise.all(others.map(o => addXp(o.user_id, participationXp)))
    }
  }
}

export async function completeMission(userId: string, missionId: string, xpReward: number) {
  const { error } = await supabase
    .from('user_missions')
    .insert({ user_id: userId, mission_id: missionId })

  if (error) throw error

  await addXp(userId, xpReward)
}

export async function toggleMissionActive(missionId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('missions')
    .update({ is_active: isActive })
    .eq('id', missionId)
  if (error) throw error
}

export async function getAllMissions(): Promise<{ id: string; title: string; icon: string; day: number | null; isActive: boolean; type: string }[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('id, title, icon, day, is_active, type')
    .order('day', { nullsFirst: false })
    .order('order_index')
  if (error) throw error
  return (data ?? []).map(m => ({
    id: m.id,
    title: m.title,
    icon: m.icon,
    day: m.day ?? null,
    isActive: m.is_active ?? true,
    type: m.type ?? 'auto',
  }))
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

export async function getAchievements(userId: string): Promise<Achievement[]> {
  const [achievementsRes, unlockedRes] = await Promise.all([
    supabase.from('achievements').select('*').order('created_at'),
    supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', userId),
  ])

  const achievements = achievementsRes.data ?? []
  const unlockedMap = new Map(
    (unlockedRes.data ?? []).map(ua => [ua.achievement_id, ua.unlocked_at as string])
  )

  return achievements.map(a => ({
    id: a.id,
    key: a.key,
    icon: a.icon,
    title: a.title,
    description: a.description,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id),
  }))
}

// Check and unlock an achievement by key for a given user (no auth.uid() dependency)
export async function checkAchievement(userId: string, key: string): Promise<boolean> {
  const { data: ach } = await supabase
    .from('achievements')
    .select('id')
    .eq('key', key)
    .single()
  if (!ach) return false

  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', ach.id)
    .maybeSingle()
  if (existing) return false

  const { error } = await supabase
    .from('user_achievements')
    .insert({ user_id: userId, achievement_id: ach.id })
  return !error
}

// ─── LIVE QUESTIONS ───────────────────────────────────────────────────────────

export async function submitLiveQuestion(userId: string, sessionId: string, content: string) {
  const { error } = await supabase
    .from('live_questions')
    .insert({ user_id: userId, session_id: sessionId, content })
  if (error) throw error
}

// ─── FEED ──────────────────────────────────────────────────────────────────────

export async function getFeed(userId: string): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from('feed_posts')
    .select(`
      *,
      profiles!feed_posts_user_id_fkey (name, church, xp, avatar_url),
      post_likes (user_id),
      post_reactions (emoji, user_id)
    `)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !posts) return []

  const mapPost = (post: any): FeedPost => {
    const profile = post.profiles as { name: string; church: string; xp: number } | null
    const likes = post.post_likes as { user_id: string }[]
    const reactions = post.post_reactions as { emoji: string; user_id: string }[]

    const reactionMap: Record<string, { count: number; reacted: boolean }> = {}
    for (const r of reactions) {
      if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, reacted: false }
      reactionMap[r.emoji].count++
      if (r.user_id === userId) reactionMap[r.emoji].reacted = true
    }

    const name = post.user_id === '00000000-0000-0000-0000-000000000000'
      ? '\uD83D\uDCE2 Organização'
      : (profile?.name ?? 'Usuário')

    const initials = name === '\uD83D\uDCE2 Organização'
      ? '\uD83D\uDCE2'
      : name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')

    const now = new Date()
    const created = new Date(post.created_at)
    const diffMs = now.getTime() - created.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const timeLabel = diffMin < 1 ? 'agora'
      : diffMin < 60 ? `${diffMin}min atrás`
      : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h atrás`
      : `${Math.floor(diffMin / 1440)}d atrás`

    return {
      id: post.id,
      userId: post.user_id,
      userName: name,
      userInitials: initials,
      userAvatar: (profile as any)?.avatar_url ?? undefined,
      church: profile?.church ?? '',
      userXp: profile?.xp ?? 0,
      type: post.type as FeedPost['type'],
      content: post.content,
      imageUrl: post.image_url ?? undefined,
      isPinned: post.is_pinned ?? false,
      parentId: post.parent_id ?? undefined,
      createdAt: timeLabel,
      reactions: Object.entries(reactionMap).map(([emoji, val]) => ({ emoji, ...val })),
      likes: likes.length,
      liked: likes.some(l => l.user_id === userId),
      replies: [],
    }
  }

  const mapped = posts.map(mapPost)
  const topLevel = mapped.filter(p => !p.parentId)
  const replies = mapped.filter(p => p.parentId)
  for (const reply of replies) {
    const parent = topLevel.find(p => p.id === reply.parentId)
    if (parent) parent.replies!.push(reply)
  }
  return topLevel
}

export async function addPost(
  userId: string,
  type: FeedPost['type'],
  content: string,
  imageUrl?: string | null,
  parentId?: string | null,
) {
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({
      user_id: userId,
      type,
      content,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(parentId ? { parent_id: parentId } : {}),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleLike(userId: string, postId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from('post_likes').delete().eq('user_id', userId).eq('post_id', postId)
  } else {
    await supabase.from('post_likes').insert({ user_id: userId, post_id: postId })
  }
}

export async function toggleReaction(userId: string, postId: string, emoji: string, currentlyReacted: boolean) {
  if (currentlyReacted) {
    await supabase.from('post_reactions').delete()
      .eq('user_id', userId).eq('post_id', postId).eq('emoji', emoji)
  } else {
    await supabase.from('post_reactions').insert({ user_id: userId, post_id: postId, emoji })
  }
}

// ─── RANKING ──────────────────────────────────────────────────────────────────

export async function getRanking(): Promise<RankingUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, church, avatar_url, xp')
    .neq('role', 'admin')
    .not('name', 'is', null)
    .neq('name', '')
    .order('xp', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map((r, i) => ({
    id: r.id,
    name: r.name ?? 'Usuário',
    initials: (r.name ?? 'U').split(' ').slice(0, 2).map((w: string) => w[0]).join(''),
    church: r.church ?? '',
    xp: r.xp ?? 0,
    position: i + 1,
    avatar: (r.avatar_url as string | null) ?? undefined,
  }))
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

export async function getProducts(userId: string): Promise<Product[]> {
  const [productsRes, wishlistRes] = await Promise.all([
    supabase.from('products').select('*').order('category').order('name'),
    supabase.from('wishlist_items').select('product_id').eq('user_id', userId),
  ])

  const products = productsRes.data ?? []
  const wishlistIds = new Set((wishlistRes.data ?? []).map(w => w.product_id))

  return products.map(p => ({
    id: p.id,
    category: p.category as Product['category'],
    name: p.name,
    price: p.price,
    emoji: p.emoji,
    description: p.description ?? '',
    venue: p.venue ?? undefined,
    inWishlist: wishlistIds.has(p.id),
  }))
}

export async function toggleWishlist(userId: string, productId: string, currentlyInWishlist: boolean) {
  if (currentlyInWishlist) {
    await supabase.from('wishlist_items').delete()
      .eq('user_id', userId).eq('product_id', productId)
  } else {
    await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId })
  }
}

// ─── NOTES ────────────────────────────────────────────────────────────────────

export async function getNotes(userId: string, sessionsData: Session[]): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []

  return data.map(n => {
    const session = sessionsData.find(s => s.id === n.session_id)
    const updated = new Date(n.updated_at)
    const timeStr = updated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return {
      sessionId: n.session_id,
      sessionTitle: session?.title ?? 'Sessão',
      content: n.content ?? '',
      updatedAt: timeStr,
    }
  })
}

export async function saveNote(userId: string, sessionId: string, content: string) {
  const { error } = await supabase
    .from('notes')
    .upsert(
      { user_id: userId, session_id: sessionId, content },
      { onConflict: 'user_id,session_id' }
    )
  if (error) throw error
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
  return publicUrl
}

export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('post-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export async function deletePost(postId: string, userId: string, isAdmin = false) {
  let query = supabase.from('feed_posts').delete().eq('id', postId)
  // Admin pode excluir qualquer post; usuário comum só exclui o próprio
  if (!isAdmin) {
    query = query.eq('user_id', userId)
  }
  const { error } = await query
  if (error) throw error
}

export async function pinPost(postId: string, isPinned: boolean) {
  const { error } = await supabase
    .from('feed_posts')
    .update({ is_pinned: isPinned })
    .eq('id', postId)
  if (error) throw error
}
