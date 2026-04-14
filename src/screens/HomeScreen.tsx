import { useEffect, useMemo, useRef, useState } from 'react'
import { uploadPostImage, submitMissionEvidence, submitMissionText } from '../lib/api'
import { useAppStore } from '../store/appStore'
import type { Mission } from '../store/appStore'

type FeedTab = 'comments' | 'prayer' | 'announcements'
type SheetType = 'none' | 'pick' | 'comment' | 'live-question' | 'prayer' | 'announcement' | 'replies' | 'menu'

// Session types that allow Q&A
const QA_TYPES = ['plenaria', 'oficina', 'talkshow']

// Reactions defined in the mock
const LIVE_REACTIONS = [
  { emoji: '\u2764\ufe0f', label: 'Amei' },
  { emoji: '\uD83D\uDE4F', label: 'Amem' },
  { emoji: '\u2728', label: 'Abencado' },
  { emoji: '\uD83D\uDCA1', label: 'Inspirado' },
  { emoji: '\uD83D\uDE4C', label: 'Louvor' },
]

type ProfileModal = { name: string; initials: string; church: string; xp: number; avatar?: string }

export function HomeScreen() {
  const {
    missions, feed, authUserId, user, eventConfig, liveSession, toggleLike, addReaction, addPost,
    submitLiveQuestion, addSheetOpen, setAddSheetOpen, completeMissionByKey, openLiveQuestion,
    setOpenLiveQuestion, refreshLiveSession, completeMission, showToast,
    deletePost,
    pinPost,
  } = useAppStore()

  const [feedTab, setFeedTab] = useState<FeedTab>('comments')
  const [sheet, setSheet] = useState<SheetType>('none')
  const [postContent, setPostContent] = useState('')

  useEffect(() => {
    if (openLiveQuestion) {
      setSheet('live-question')
      setOpenLiveQuestion(false)
    }
  }, [openLiveQuestion])

  const [missionsExpanded, setMissionsExpanded] = useState(false)
  const [questionSent, setQuestionSent] = useState(false)
  const [activeReactions, setActiveReactions] = useState<Record<string, boolean>>({})
  const [profileModal, setProfileModal] = useState<ProfileModal | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [imgUploading, setImgUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null)
  const [menuPostId, setMenuPostId] = useState<string | null>(null)

  // Mission interaction
  const [activeMission, setActiveMission] = useState<Mission | null>(null)
  const [missionText, setMissionText] = useState('')
  const [missionFile, setMissionFile] = useState<File | null>(null)
  const [missionFilePreview, setMissionFilePreview] = useState<string | null>(null)
  const [missionUploading, setMissionUploading] = useState(false)
  const [missionPending, setMissionPending] = useState(false)
  const [missionShareToFeed, setMissionShareToFeed] = useState(false)
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const missionFileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = user.role === 'admin'

  // Sync addSheetOpen store flag to local sheet state
  useEffect(() => {
    if (addSheetOpen) {
      setSheet('pick')
      setAddSheetOpen(false)
    }
  }, [addSheetOpen, setAddSheetOpen])

  // Trigger checkin mission when user opens the home screen
  useEffect(() => {
    completeMissionByKey('checkin')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh live session on mount and every 60s to keep the home card up to date
  useEffect(() => {
    refreshLiveSession()
    const interval = setInterval(() => refreshLiveSession(), 60_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate current event day from eventConfig
  const currentEventDay = useMemo(() => {
    if (!eventConfig) return 1
    const startDate = new Date(eventConfig.eventStartDate + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 1
    if (diff >= eventConfig.totalDays) return eventConfig.totalDays
    return diff + 1
  }, [eventConfig])

  const todayMissions = missions.filter(m => m.day === currentEventDay || m.day === null)
  const completedCount = todayMissions.filter(m => m.completed).length
  const totalXp = todayMissions.reduce((sum, m) => sum + m.xpReward, 0)
  const progressPct = todayMissions.length > 0 ? (completedCount / todayMissions.length) * 100 : 0

  const liveAllowsQA = liveSession ? QA_TYPES.includes(liveSession.type) : false

  const openComments = (postId: string) => {
    setCommentsPostId(postId)
    setReplyingTo(postId)
    setSheet('replies')
  }

  const openMenu = (postId: string) => {
    setMenuPostId(postId)
    setSheet('menu')
  }

  const handleSubmitReply = async () => {
    if (!postContent.trim() && !selectedImage) return
    let imageUrl: string | null = null
    if (selectedImage && authUserId) {
      setImgUploading(true)
      try { imageUrl = await uploadPostImage(authUserId, selectedImage) } catch {}
      setImgUploading(false)
    }
    await addPost('comment', postContent, imageUrl, commentsPostId)
    setPostContent('')
    setSelectedImage(null)
    setImgPreview(null)
  }

  const handleDeletePost = async () => {
    if (!menuPostId) return
    await deletePost(menuPostId)
    closeSheet()
  }

  const handlePinPost = async () => {
    if (!menuPostId) return
    await pinPost(menuPostId)
    closeSheet()
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setImgPreview(URL.createObjectURL(file))
  }

  const handleSubmitPost = async () => {
    if (!postContent.trim() && !selectedImage) return
    let imageUrl: string | null = null
    if (selectedImage && authUserId) {
      setImgUploading(true)
      try {
        imageUrl = await uploadPostImage(authUserId, selectedImage)
      } catch {
        // post without image on upload error
      }
      setImgUploading(false)
    }
    const postType = sheet === 'prayer' ? 'prayer' : sheet === 'announcement' ? 'announcement' : 'comment'
    await addPost(postType, postContent, imageUrl, null)
    setPostContent('')
    setSelectedImage(null)
    setImgPreview(null)
    setReplyingTo(null)
    setSheet('none')
  }

  const handleSubmitQuestion = async () => {
    if (!postContent.trim() || !liveSession) return
    await submitLiveQuestion(liveSession.id, postContent)
    setPostContent('')
    setQuestionSent(true)
    setTimeout(() => {
      setQuestionSent(false)
      setSheet('none')
    }, 1800)
  }

  const closeSheet = () => {
    setSheet('none')
    setPostContent('')
    setQuestionSent(false)
    setSelectedImage(null)
    setImgPreview(null)
    setReplyingTo(null)
    setCommentsPostId(null)
    setMenuPostId(null)
  }

  // Mission interaction helpers
  const QUIZ_DATA: Record<string, { question: string; options: string[]; correct: number }[]> = {
    quiz_saturados: [
      {
        question: 'Segundo a palestra, o que significa estar saturado?',
        options: ['Cheio de informação verdadeira', 'Preso no ciclo de recompensas imediatas', 'Com sono'],
        correct: 1,
      },
      {
        question: 'O que Efésios 5:19 chama a fazer?',
        options: ['Evitar entretenimento', 'Ser enchido do Espírito Santo', 'Jejuar das redes'],
        correct: 1,
      },
      {
        question: 'Dois corpos não ocupam o mesmo lugar: isso ilustra o quê?',
        options: ['Física quântica', 'Para ser cheio do Espírito, devemos nos esvaziar do mundo', 'Que não dá para usar dois apps ao mesmo tempo'],
        correct: 1,
      },
    ],
    quiz_sentido: [
      {
        question: 'Qual é o desígnio de Deus para o trabalho?',
        options: ['Acumular experiências', 'Exige serviço, raramente gera likes', 'Trabalhar 40h'],
        correct: 1,
      },
      {
        question: 'O que Colossenses 3:23 diz?',
        options: ['Trabalhe 40h', 'Faça tudo de todo o coração, como para o Senhor', 'Busque realização'],
        correct: 1,
      },
      {
        question: 'Ao entender que servimos "como para o Senhor", o que acontece?',
        options: ['Ganha mais dinheiro', 'O tédio é substituído pela glória de quem nos chama', 'O trabalho fica mais fácil'],
        correct: 1,
      },
    ],
  }

  function openMission(m: Mission) {
    if (m.completed || m.type === 'auto') return
    if (!m.isActive) return
    setActiveMission(m)
    setMissionText('')
    setMissionFile(null)
    setMissionFilePreview(null)
    setMissionPending(false)
    setQuizStep(0)
    setQuizAnswers([])
    setQuizSubmitted(false)
  }

  function closeMissionSheet() {
    setActiveMission(null)
    setMissionText('')
    setMissionFile(null)
    setMissionFilePreview(null)
    setMissionPending(false)
    setMissionShareToFeed(false)
    setQuizStep(0)
    setQuizAnswers([])
    setQuizSubmitted(false)
  }

  async function handleMissionText() {
    if (!activeMission || !authUserId || !missionText.trim()) return
    setMissionUploading(true)
    const text = missionText
    const shareToFeed = missionShareToFeed
    try {
      await submitMissionText(authUserId, activeMission.id, text, activeMission.xpReward)
      if (shareToFeed) {
        addPost('comment', text, null, null)
      }
      completeMission(activeMission.id)
      closeMissionSheet()
    } catch {
      showToast('Erro ao salvar. Tente novamente.', 'error')
    } finally {
      setMissionUploading(false)
    }
  }

  async function handleMissionEvidence(isAdmin: boolean) {
    if (!activeMission || !authUserId || !missionFile) return
    setMissionUploading(true)
    const missionTitle = activeMission.title
    const shareToFeed = missionShareToFeed
    try {
      const imageUrl = await submitMissionEvidence(authUserId, activeMission.id, missionFile, activeMission.xpReward, isAdmin)
      if (isAdmin) {
        setMissionPending(true)
        // Mark completed locally (status=pending) without crediting XP
        useAppStore.setState(s => ({
          missions: s.missions.map(m => m.id === activeMission!.id ? { ...m, completed: true, status: 'pending' } : m),
        }))
      } else {
        if (shareToFeed) {
          addPost('comment', 'Missão: ' + missionTitle, imageUrl, null)
        }
        completeMission(activeMission.id)
        closeMissionSheet()
      }
    } catch {
      showToast('Erro ao enviar. Tente novamente.', 'error')
    } finally {
      setMissionUploading(false)
    }
  }

  function handleMissionFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMissionFile(file)
    setMissionFilePreview(URL.createObjectURL(file))
  }

  function handleQuizAnswer(optionIdx: number) {
    const newAnswers = [...quizAnswers]
    newAnswers[quizStep] = optionIdx
    setQuizAnswers(newAnswers)
  }

  function handleQuizNext() {
    if (!activeMission) return
    const quiz = QUIZ_DATA[activeMission.key] ?? []
    if (quizStep < quiz.length - 1) {
      setQuizStep(s => s + 1)
    } else {
      // Submit
      setQuizSubmitted(true)
      const allCorrect = quiz.every((q, i) => quizAnswers[i] === q.correct)
      if (allCorrect) {
        setTimeout(() => {
          completeMission(activeMission.id)
          closeMissionSheet()
        }, 1200)
      }
    }
  }

  const filteredFeed = feed.filter(p => {
    if (feedTab === 'comments') return p.type === 'comment'
    if (feedTab === 'prayer') return p.type === 'prayer'
    if (feedTab === 'announcements') return p.type === 'announcement'
    return false
  })

  const sortedFeed = [
    ...filteredFeed.filter(p => p.isPinned),
    ...filteredFeed.filter(p => !p.isPinned),
  ]
  const commentsPost = feed.find(p => p.id === commentsPostId) ?? null
  const menuPost = feed.find(p => p.id === menuPostId) ?? null

  // Short label for mission node (first word of title, 6 chars max)
  const shortLabel = (title: string) => {
    const word = title.split(' ')[0]
    return word.length > 6 ? word.slice(0, 5) + '\u2026' : word
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="scroll-area" style={{ padding: '14px 14px 0' }}>
        {/* MISSIONS CARD */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          {/* Header */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                Missoes do dia
              </div>
              {totalXp > 0 && (
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--xp)',
                  background: 'var(--xp-bg)', padding: '3px 9px', borderRadius: 20,
                }}>
                  +{totalXp} XP
                </div>
              )}
            </div>
            {/* Milestone track */}
            {todayMissions.length > 0 && (
              <div style={{ position: 'relative', padding: '0 8px 4px' }}>
                <div style={{
                  position: 'absolute', top: 17, left: 26, right: 26,
                  height: 5, background: 'var(--bg3)', borderRadius: 3,
                }} />
                <div style={{
                  position: 'absolute', top: 17, left: 26,
                  width: `calc((100% - 52px) * ${progressPct / 100})`,
                  height: 5,
                  background: 'linear-gradient(90deg, #FF8F44, #FA1462)',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {todayMissions.map((m) => {
                    const isDone = m.completed
                    const isCurrent = !isDone && todayMissions.slice(0, todayMissions.indexOf(m)).every(p => p.completed)
                    return (
                      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button
                        onClick={() => openMission(m)}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          cursor: (isDone || m.type === 'auto' || !m.isActive) ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isDone ? 'linear-gradient(135deg, #FF8F44, #FA1462)' : isCurrent ? 'var(--surface)' : 'var(--bg2)',
                          border: isCurrent ? '2.5px solid var(--pink)' : isDone ? 'none' : '2px solid var(--border)',
                          boxShadow: isDone ? '0 3px 10px rgba(250,20,98,0.28)' : 'none',
                          transition: 'all 0.25s',
                        } as React.CSSProperties} title={m.title}>
                          {isDone ? (
                            <svg viewBox="0 0 14 14" fill="none" width={13} height={13}>
                              <path d="M2.5 7l3 3 6-5.5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isCurrent ? (
                            <div style={{
                              width: 9, height: 9, borderRadius: '50%',
                              background: 'var(--pink)',
                              animation: 'mqPulse 1.5s ease-in-out infinite',
                            }} />
                          ) : null}
                        </button>
                        <span style={{ fontSize: 9, fontWeight: 700, color: isDone ? 'var(--pink)' : 'var(--text3)' }}>
                          {shortLabel(m.title)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Expanded list */}
          <div style={{
            maxHeight: missionsExpanded ? 500 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{ paddingTop: 10 }}>
              {todayMissions.map((m, i) => {
                const isPending = m.status === 'pending'
                const canInteract = !m.completed && m.type !== 'auto' && m.isActive
                return (
                  <div key={m.id}>
                    <div
                      onClick={() => canInteract && openMission(m)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', background: 'var(--surface)',
                        cursor: canInteract ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: m.completed ? 'linear-gradient(135deg, #FF8F44, #FA1462)' : 'var(--bg2)',
                        border: m.completed ? 'none' : '2px solid var(--border)',
                      }}>
                        {m.completed && (
                          <svg viewBox="0 0 12 12" fill="none" width={11} height={11}>
                            <path d="M2 6l2.5 2.5 5.5-5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: m.completed ? 'var(--text3)' : 'var(--text)',
                          textDecoration: m.completed && !isPending ? 'line-through' : 'none',
                          textDecorationColor: 'var(--bg3)',
                        }}>{m.title}</div>
                        <div style={{
                          fontSize: 11, fontWeight: 600, marginTop: 1,
                          color: isPending ? '#F59E0B' : m.completed ? 'var(--green)' : 'var(--text3)',
                        }}>
                          {isPending ? '⏳ Em análise' : m.completed ? 'Concluída' : canInteract ? 'Toque para completar' : 'Não iniciada'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                        padding: '3px 8px', borderRadius: 6,
                        background: m.completed ? 'rgba(26,153,96,0.08)' : 'var(--bg2)',
                        border: `1px solid ${m.completed ? 'rgba(26,153,96,0.2)' : 'var(--border)'}`,
                        color: m.completed ? 'var(--green)' : 'var(--text3)',
                      }}>+{m.xpReward} XP</div>
                    </div>
                    {i < todayMissions.length - 1 && (
                      <div style={{ height: 1, background: 'var(--border2)', margin: '0 14px' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Toggle button */}
          <button
            onClick={() => setMissionsExpanded(v => !v)}
            style={{
              width: '100%', padding: '12px 16px', background: 'none', border: 'none',
              borderTop: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              color: 'var(--text3)', transition: 'color 0.2s',
            }}
          >
            <span>{missionsExpanded ? 'Fechar' : 'Ver todas'}</span>
            <svg viewBox="0 0 12 8" fill="none" width={12} height={8} style={{
              transition: 'transform 0.35s',
              transform: missionsExpanded ? 'rotate(180deg)' : 'none',
            }}>
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* LIVE CARD */}
        {liveSession ? (
          <div style={{
            background: '#1A0D2E',
            borderRadius: 16,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -50, right: -50,
              width: 160, height: 160,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '50%',
            }} />
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#FF4757',
                    animation: 'blink 1.4s ease infinite',
                    boxShadow: '0 0 5px rgba(255,71,87,0.6)',
                  }} className="live-dot" />
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)',
                  }}>Ao vivo</span>
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.3px', lineHeight: 1.2, marginBottom: 3,
                }}>
                  {liveSession.title}
                </div>
                {liveSession.speaker && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {liveSession.speaker}
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 20, padding: '5px 10px',
                fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#FF4757',
                  animation: 'blink 1.4s ease infinite',
                }} />
                <span>Ao vivo</span>
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 14 }} />
            {/* Reactions */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8,
            }}>Reagir</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, scrollbarWidth: 'none' }}>
              {LIVE_REACTIONS.map(r => {
                const active = !!activeReactions[r.emoji]
                return (
                  <button
                    key={r.emoji}
                    onClick={() => setActiveReactions(prev => ({ ...prev, [r.emoji]: !prev[r.emoji] }))}
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: active ? 'rgba(250,20,98,0.3)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${active ? 'rgba(250,20,98,0.5)' : 'rgba(255,255,255,0.14)'}`,
                      borderRadius: 20, padding: '6px 11px',
                      fontSize: 12, fontWeight: 700,
                      color: active ? '#fff' : 'rgba(255,255,255,0.8)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'background 0.15s, border-color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.emoji}
                  </button>
                )
              })}
            </div>
            {/* Inline Q&A — only for plenaria, oficina, talkshow */}
            {liveAllowsQA && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  placeholder="Pergunta para o palestrante..."
                  onFocus={() => setSheet('live-question')}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.18)',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: 10, padding: '10px 12px',
                    fontSize: 13, fontFamily: 'var(--font-body)',
                    color: '#fff', outline: 'none', cursor: 'text',
                  }}
                />
                <button
                  onClick={() => setSheet('live-question')}
                  style={{
                    width: 38, height: 38, background: '#fff', border: 'none',
                    borderRadius: 10, color: 'var(--pink)', fontSize: 18, fontWeight: 900,
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {'\u2191'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '14px 18px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{'\uD83D\uDCE1'}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Nenhuma sessao ao vivo</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {eventConfig?.tagline ?? 'Confira a agenda para os proximos horarios'}
              </div>
            </div>
          </div>
        )}

        {/* FEED */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: 'var(--text)',
            letterSpacing: '-0.2px', marginBottom: 10,
          }}>
            Feed da conferencia
          </div>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 0, background: 'var(--bg2)',
            borderRadius: 12, padding: 3, marginBottom: 12,
          }}>
            {([
              { key: 'comments' as FeedTab, label: '\uD83D\uDCAC Comentarios' },
              { key: 'prayer' as FeedTab, label: '\uD83D\uDE4F Oracoes' },
              { key: 'announcements' as FeedTab, label: '\uD83D\uDCE2 Avisos' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFeedTab(tab.key)}
                style={{
                  flex: 1, padding: '7px 4px', border: 'none', borderRadius: 9,
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
                  cursor: 'pointer', transition: 'all 0.18s',
                  background: feedTab === tab.key ? 'var(--surface)' : 'transparent',
                  color: feedTab === tab.key ? 'var(--text)' : 'var(--text3)',
                  boxShadow: feedTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {sortedFeed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {feedTab === 'comments' ? '\uD83D\uDCAC' : feedTab === 'prayer' ? '\uD83D\uDE4F' : '\uD83D\uDCE2'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum post ainda</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Seja o primeiro!</div>
              </div>
            ) : (
              sortedFeed.map((post) => {
                const isAnnouncement = post.type === 'announcement'
                const isPrayer = post.type === 'prayer'
                const isOwn = post.userId === authUserId
                const repliesCount = post.replies?.length ?? 0
                return (
                  <div key={post.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 12, overflow: 'hidden', position: 'relative' }}>
                    {post.isPinned && (
                      <div style={{ background: 'rgba(250,20,98,0.07)', padding: '5px 14px', fontSize: 11, fontWeight: 700, color: 'var(--pink)', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid rgba(250,20,98,0.1)' }}>
                        📌 Fixado
                      </div>
                    )}
                    {isAnnouncement ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: 'rgba(53,18,106,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>
                          <span>{'\uD83D\uDCE2'}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                            {post.userName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, fontWeight: 500 }}>
                            {post.content}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, fontWeight: 500 }}>
                            {post.createdAt}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => setProfileModal({
                            name: post.userName,
                            initials: post.userInitials,
                            church: post.church,
                            xp: post.userXp,
                            avatar: post.userAvatar,
                          })}
                          style={{
                            display: 'flex', gap: 10, marginBottom: 8,
                            alignItems: 'flex-start', background: 'none', border: 'none',
                            padding: 0, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            textAlign: 'left', width: '100%',
                          }}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                            background: isPrayer ? 'linear-gradient(135deg,#35126A,#FA1462)' : 'var(--grad-warm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 12, color: '#fff', overflow: 'hidden',
                          }}>
                            {post.userAvatar
                              ? <img src={post.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : post.userInitials
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                              {post.userName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                              {post.church} · {post.createdAt}
                            </div>
                          </div>
                        </button>
                        {(isAdmin || (!isAnnouncement && isOwn)) && (
                          <button onClick={() => openMenu(post.id)} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 18, fontFamily: 'var(--font-body)', flexShrink: 0 }}>⋮</button>
                        )}

                        {isPrayer ? (
                          <div style={{
                            background: 'linear-gradient(135deg,rgba(53,18,106,0.06),rgba(77,193,231,0.04))',
                            borderLeft: '3px solid rgba(53,18,106,0.3)',
                            borderRadius: '0 8px 8px 0',
                            padding: '10px 12px',
                            marginBottom: post.imageUrl ? 8 : 10,
                            fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic',
                          }}>
                            {post.content}
                          </div>
                        ) : (
                          <p style={{
                            fontSize: 14, color: 'var(--text2)', lineHeight: 1.6,
                            marginBottom: post.imageUrl ? 8 : 10,
                          }}>
                            {post.content}
                          </p>
                        )}

                        {/* Post image */}
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 260,
                              objectFit: 'cover',
                              borderRadius: 10,
                              marginBottom: 10,
                              display: 'block',
                            }}
                          />
                        )}

                        {/* Actions row */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <button
                            onClick={() => toggleLike(post.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: post.liked ? 'var(--pink)' : 'var(--text3)',
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontWeight: 600, padding: '3px 0', fontFamily: 'var(--font-body)',
                            }}
                          >
                            {post.liked ? '\u2764\ufe0f' : '\uD83E\uDD0D'}
                            <span>{post.likes}</span>
                          </button>
                          {post.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => addReaction(post.id, r.emoji)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 12,
                                color: r.reacted ? 'var(--text)' : 'var(--text3)',
                                background: r.reacted ? 'var(--bg2)' : 'none',
                                border: 'none', cursor: 'pointer', fontWeight: 600,
                                padding: '2px 6px', borderRadius: 20,
                                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                              }}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                          {/* Comment count button */}
                          <button onClick={() => openComments(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: repliesCount > 0 ? 'var(--text2)' : 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '3px 0', fontFamily: 'var(--font-body)', marginLeft: 'auto' }}>
                            <svg viewBox="0 0 16 16" fill="none" width={14} height={14}>
                              <path d="M2 8C2 4.686 4.686 2 8 2h3a5 5 0 0 1 0 10H8l-4 2v-3.5A5.97 5.97 0 0 1 2 8z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
                            </svg>
                            <span>{repliesCount > 0 ? repliesCount : 'Comentar'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

      {/* PROFILE MODAL */}
      {profileModal && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              zIndex: 95, backdropFilter: 'blur(3px)',
            }}
            className="fade-in"
            onClick={() => setProfileModal(null)}
          />
          <div
            className="sheet-up"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--surface)', borderRadius: '24px 24px 0 0',
              zIndex: 96, padding: '0 20px 40px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
              <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--grad-warm)',
                border: '3px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: '#fff',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {profileModal.avatar
                  ? <img src={profileModal.avatar} alt={profileModal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profileModal.initials
                }
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{profileModal.name}</div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--pink)',
                background: 'rgba(250,20,98,0.08)', padding: '4px 12px',
                borderRadius: 20, border: '1px solid rgba(250,20,98,0.15)',
              }}>
                {['Novo','Participante','Engajado','Comprometido','Saturado','Líder'][
                  [0,300,700,1200,2000,3000].reduce((lvl,t,i) => profileModal.xp >= t ? i : lvl, 0)
                ]} · {profileModal.xp} XP
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text3)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span>⛪</span>
                <span>{profileModal.church || 'Igreja não informada'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SHEET BACKDROP */}
      {sheet !== 'none' && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)',
            zIndex: 90, backdropFilter: 'blur(3px)',
          }}
          className="fade-in"
          onClick={closeSheet}
        />
      )}

      {/* Hidden file input for image picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImagePick}
      />

      {/* BOTTOM SHEET */}
      {sheet !== 'none' && (
        <div
          className="sheet-up"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--surface)', borderRadius: '24px 24px 0 0',
            zIndex: 91, boxShadow: '0 -4px 30px rgba(0,0,0,0.12)', padding: 0,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2 }} />
          </div>

          {/* PICK type selection */}
          {sheet === 'pick' && (
            <div>
              <div style={{ padding: '20px 24px 8px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                  letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6,
                }}>Criar</div>
                <div style={{
                  fontSize: 20, fontWeight: 800, color: 'var(--text)',
                  letterSpacing: '-0.3px', lineHeight: 1.2,
                }}>
                  O que deseja<br />compartilhar?
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '12px 16px 24px' }}>
                {[
                  {
                    type: 'comment' as SheetType,
                    icon: '💬',
                    title: 'Comentário no feed',
                    desc: 'Compartilhe um pensamento com todos',
                    gradient: 'rgba(255,143,68,.15),rgba(250,20,98,.12)',
                    disabled: false,
                    adminOnly: false,
                  },
                  {
                    type: 'live-question' as SheetType,
                    icon: '🎤',
                    title: 'Pergunta ao palestrante',
                    desc: 'Envie uma dúvida para a sessão ao vivo',
                    gradient: 'rgba(53,18,106,.12),rgba(77,193,231,.1)',
                    disabled: !liveSession,
                    adminOnly: false,
                  },
                  {
                    type: 'prayer' as SheetType,
                    icon: '🙏',
                    title: 'Pedido de oração',
                    desc: 'Peça apoio da comunidade em oração',
                    gradient: 'rgba(250,20,98,.1),rgba(53,18,106,.08)',
                    disabled: false,
                    adminOnly: false,
                  },
                  {
                    type: 'announcement' as SheetType,
                    icon: '📢',
                    title: 'Aviso da organização',
                    desc: 'Publique um comunicado oficial para todos',
                    gradient: 'rgba(53,18,106,.15),rgba(250,20,98,.1)',
                    disabled: false,
                    adminOnly: true,
                  },
                ].filter(opt => !opt.adminOnly || isAdmin).map((opt, idx, arr) => (
                  <div key={opt.type}>
                    <button
                      onClick={() => !opt.disabled && setSheet(opt.type)}
                      disabled={opt.disabled}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px',
                        background: 'none', border: 'none', borderRadius: 14,
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%',
                        opacity: opt.disabled ? 0.4 : 1, transition: 'background 0.15s',
                      }}
                      onTouchStart={e => { if (!opt.disabled) e.currentTarget.style.background = 'var(--bg2)' }}
                      onTouchEnd={e => { e.currentTarget.style.background = 'none' }}
                    >
                      <div style={{
                        width: 46, height: 46, borderRadius: 13,
                        background: `linear-gradient(135deg,${opt.gradient})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 22,
                      }}>{opt.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{opt.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </button>
                    {idx < arr.length - 1 && (
                      <div style={{ height: 1, background: 'var(--border2)', margin: '0 12px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* REPLIES — comentários de um post */}
          {sheet === 'replies' && commentsPost && (
            <>
              <div style={{ padding: '4px 20px 14px', flexShrink: 0, borderBottom: '1px solid var(--border2)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>💬 Comentários</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {commentsPost.userName} · {commentsPost.replies?.length ?? 0} comentário{(commentsPost.replies?.length ?? 0) !== 1 ? 's' : ''}
                </div>
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg2)', borderRadius: 10, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                  {commentsPost.content}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {!commentsPost.replies || commentsPost.replies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum comentário ainda</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Seja o primeiro!</div>
                  </div>
                ) : (
                  commentsPost.replies.map(reply => (
                    <div key={reply.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--grad-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#fff' }}>{reply.userInitials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ background: 'var(--bg2)', borderRadius: '0 12px 12px 12px', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{reply.userName}</span>
                            {reply.userId === authUserId && (
                              <button onClick={() => deletePost(reply.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: '0 2px', lineHeight: 1, fontFamily: 'var(--font-body)' }}>×</button>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>{reply.content}</p>
                          {reply.imageUrl && <img src={reply.imageUrl} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 6, display: 'block' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, paddingLeft: 4 }}>{reply.createdAt}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ flexShrink: 0, borderTop: '1px solid var(--border2)', padding: '12px 16px 32px', background: 'var(--surface)' }}>
                {imgPreview && (
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <img src={imgPreview} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                    <button onClick={() => { setSelectedImage(null); setImgPreview(null) }} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16}><rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth={1.5}/><circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth={1.5}/></svg>
                  </button>
                  <textarea placeholder="Escreva um comentário..." value={postContent} onChange={e => setPostContent(e.target.value)} rows={1} style={{ flex: 1, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '9px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'var(--font-body)' }} onFocus={e => e.target.style.borderColor = 'var(--pink)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <button onClick={handleSubmitReply} disabled={(!postContent.trim() && !selectedImage) || imgUploading} style={{ width: 36, height: 36, borderRadius: 10, background: (postContent.trim() || selectedImage) && !imgUploading ? 'var(--grad-warm)' : 'var(--bg3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 20 20" fill="none" width={16} height={16}><path d="M3 10l14-7-7 14v-7L3 10z" fill={((postContent.trim() || selectedImage) && !imgUploading) ? '#fff' : 'var(--text3)'}/></svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MENU — opções do post */}
          {sheet === 'menu' && menuPost && (
            <div style={{ padding: '8px 16px 32px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', textAlign: 'center', padding: '8px 0 16px', borderBottom: '1px solid var(--border2)', marginBottom: 8 }}>
                Post de {menuPost.userName}
              </div>
              {(menuPost.userId === authUserId || isAdmin) && (
                <button onClick={handleDeletePost} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗑️</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>Apagar post</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>Esta ação não pode ser desfeita</div>
                  </div>
                </button>
              )}
              {isAdmin && (
                <button onClick={handlePinPost} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(250,20,98,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📌</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{menuPost.isPinned ? 'Desafixar post' : 'Fixar post'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{menuPost.isPinned ? 'Remover do topo' : 'Manter no topo do feed'}</div>
                  </div>
                </button>
              )}
              <div style={{ height: 1, background: 'var(--border2)', margin: '8px 12px' }} />
              <button onClick={closeSheet} style={{ width: '100%', padding: '14px 12px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' }}>Cancelar</button>
            </div>
          )}

          {/* COMMENT */}
          {sheet === 'comment' && (
            <div style={{ padding: '20px 20px 32px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {replyingTo ? '💬 Resposta' : '💬 Comentário'}
              </div>
              {replyingTo ? (
                <div style={{
                  fontSize: 12, color: 'var(--pink)', fontWeight: 600, marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <svg viewBox="0 0 16 16" fill="none" width={12} height={12}>
                    <path d="M2 8C2 4.686 4.686 2 8 2h3a5 5 0 0 1 0 10H8l-4 2v-3.5A5.97 5.97 0 0 1 2 8z"
                      stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
                  </svg>
                  Respondendo a um comentário
                  <button
                    onClick={() => setReplyingTo(null)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text3)', fontSize: 14, padding: '0 2px', lineHeight: 1,
                      fontFamily: 'var(--font-body)',
                    }}
                  >\u00d7</button>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                  Compartilhe seus pensamentos com todos
                </div>
              )}
              <textarea
                placeholder={replyingTo ? 'Escreva sua resposta...' : 'O que você está pensando?'}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                rows={4}
                autoFocus
                style={{
                  width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '13px 15px', color: 'var(--text)', fontSize: 14,
                  outline: 'none', resize: 'none', marginBottom: 8,
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />

              {/* Image preview */}
              {imgPreview && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img
                    src={imgPreview}
                    alt=""
                    style={{
                      width: '100%', maxHeight: 180, objectFit: 'cover',
                      borderRadius: 10, display: 'block',
                    }}
                  />
                  <button
                    onClick={() => { setSelectedImage(null); setImgPreview(null) }}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: 'none',
                      color: '#fff', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >\u00d7</button>
                </div>
              )}

              {/* Image picker button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '7px 12px', marginBottom: 12,
                  fontSize: 12, fontWeight: 600, color: 'var(--text3)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" width={15} height={15}>
                  <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth={1.5} />
                  <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth={1.5} />
                  <path d="M7 5l1.5-2h3L13 5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
                </svg>
                {selectedImage ? 'Trocar foto' : 'Adicionar foto'}
              </button>

              <button
                onClick={handleSubmitPost}
                disabled={(!postContent.trim() && !selectedImage) || imgUploading}
                style={{
                  width: '100%', padding: 14,
                  background: (postContent.trim() || selectedImage) && !imgUploading ? 'var(--grad-warm)' : 'var(--bg3)',
                  border: 'none', borderRadius: 12,
                  color: (postContent.trim() || selectedImage) && !imgUploading ? '#fff' : 'var(--text3)',
                  fontSize: 14, fontWeight: 700,
                  cursor: (postContent.trim() || selectedImage) && !imgUploading ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {imgUploading ? 'Enviando...' : replyingTo ? 'Responder 💬' : 'Publicar 💬'}
              </button>
            </div>
          )}

          {/* LIVE QUESTION */}
          {sheet === 'live-question' && (
            <div style={{ padding: '20px 20px 32px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                🎤 Pergunta ao Palestrante
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                {liveSession ? `Para: ${liveSession.title}` : 'Nenhuma sessão ao vivo no momento'}
              </div>
              {questionSent ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{'\u2705'}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Pergunta enviada!</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>O palestrante pode respondê-la ao vivo</div>
                </div>
              ) : (
                <>
                  <textarea
                    placeholder="Digite sua pergunta..."
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    rows={4}
                    autoFocus
                    style={{
                      width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                      borderRadius: 12, padding: '13px 15px', color: 'var(--text)', fontSize: 14,
                      outline: 'none', resize: 'none', marginBottom: 12,
                      fontFamily: 'var(--font-body)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button
                    onClick={handleSubmitQuestion}
                    disabled={!postContent.trim() || !liveSession}
                    style={{
                      width: '100%', padding: 14,
                      background: postContent.trim() && liveSession ? 'var(--grad-warm)' : 'var(--bg3)',
                      border: 'none', borderRadius: 12,
                      color: postContent.trim() && liveSession ? '#fff' : 'var(--text3)',
                      fontSize: 14, fontWeight: 700,
                      cursor: postContent.trim() && liveSession ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Enviar Pergunta 🎤
                  </button>
                </>
              )}
            </div>
          )}

          {/* PRAYER */}
          {sheet === 'prayer' && (
            <div style={{ padding: '20px 20px 32px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                🙏 Pedido de Oração
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                Compartilhe e receba apoio da comunidade
              </div>
              <textarea
                placeholder="Compartilhe seu pedido de oração..."
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                rows={4}
                autoFocus
                style={{
                  width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '13px 15px', color: 'var(--text)', fontSize: 14,
                  outline: 'none', resize: 'none', marginBottom: 12,
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleSubmitPost}
                disabled={!postContent.trim()}
                style={{
                  width: '100%', padding: 14,
                  background: postContent.trim() ? 'var(--grad-warm)' : 'var(--bg3)',
                  border: 'none', borderRadius: 12,
                  color: postContent.trim() ? '#fff' : 'var(--text3)',
                  fontSize: 14, fontWeight: 700,
                  cursor: postContent.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Enviar Pedido 🙏
              </button>
            </div>
          )}

          {/* ANNOUNCEMENT — admin only */}
          {sheet === 'announcement' && isAdmin && (
            <div style={{ padding: '20px 20px 32px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                📢 Aviso da Organização
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>
                Este aviso será exibido para todos os participantes
              </div>
              <textarea
                placeholder="Digite o comunicado oficial..."
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                rows={4}
                autoFocus
                style={{
                  width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '13px 15px', color: 'var(--text)', fontSize: 14,
                  outline: 'none', resize: 'none', marginBottom: 12,
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleSubmitPost}
                disabled={!postContent.trim()}
                style={{
                  width: '100%', padding: 14,
                  background: postContent.trim() ? 'var(--grad-warm)' : 'var(--bg3)',
                  border: 'none', borderRadius: 12,
                  color: postContent.trim() ? '#fff' : 'var(--text3)',
                  fontSize: 14, fontWeight: 700,
                  cursor: postContent.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Publicar Aviso 📢
              </button>
            </div>
          )}
        </div>
      )}

      {/* MISSION INTERACTION SHEET */}
      {activeMission && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 97, backdropFilter: 'blur(3px)' }}
            className="fade-in"
            onClick={closeMissionSheet}
          />
          <div
            className="sheet-up"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--surface)', borderRadius: '24px 24px 0 0',
              zIndex: 98, padding: '0 20px 48px', maxHeight: '90vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
              <div style={{ width: 36, height: 4, background: 'var(--bg3)', borderRadius: 2 }} />
            </div>

            {/* Mission header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: 'rgba(250,20,98,0.1)', border: '1px solid rgba(250,20,98,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>{activeMission.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{activeMission.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>+{activeMission.xpReward} XP</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
              {activeMission.description}
            </p>

            {/* TYPE: text */}
            {activeMission.type === 'text' && (
              <>
                <textarea
                  placeholder="Digite sua resposta..."
                  value={missionText}
                  onChange={e => setMissionText(e.target.value)}
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%', background: 'var(--bg2)', border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '13px 15px', color: 'var(--text)', fontSize: 14,
                    outline: 'none', resize: 'none', marginBottom: 14, fontFamily: 'var(--font-body)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--pink)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Compartilhar no feed</div>
                  <button
                    onClick={() => setMissionShareToFeed(v => !v)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, padding: 0, flexShrink: 0,
                      background: missionShareToFeed ? 'var(--pink)' : 'var(--bg3)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: missionShareToFeed ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                <button
                  onClick={handleMissionText}
                  disabled={!missionText.trim() || missionUploading}
                  style={{
                    width: '100%', padding: 14,
                    background: missionText.trim() && !missionUploading ? 'var(--grad-warm)' : 'var(--bg3)',
                    border: 'none', borderRadius: 12,
                    color: missionText.trim() && !missionUploading ? '#fff' : 'var(--text3)',
                    fontSize: 14, fontWeight: 700,
                    cursor: missionText.trim() && !missionUploading ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {missionUploading ? 'Salvando...' : `Completar (+${activeMission.xpReward} XP)`}
                </button>
              </>
            )}

            {/* TYPE: evidence */}
            {activeMission.type === 'evidence' && (
              <>
                <input
                  ref={missionFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleMissionFileChange}
                />
                {missionFilePreview ? (
                  <div style={{ marginBottom: 14 }}>
                    <img src={missionFilePreview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
                    <button
                      onClick={() => { setMissionFile(null); setMissionFilePreview(null) }}
                      style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Trocar imagem
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => missionFileInputRef.current?.click()}
                    style={{
                      width: '100%', padding: '18px 0', marginBottom: 14,
                      background: 'var(--bg2)', border: '2px dashed var(--border)',
                      borderRadius: 12, color: 'var(--text3)', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}
                  >
                    📎 Selecionar print / foto
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>Compartilhar no feed</div>
                  <button
                    onClick={() => setMissionShareToFeed(v => !v)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, padding: 0, flexShrink: 0,
                      background: missionShareToFeed ? 'var(--pink)' : 'var(--bg3)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: missionShareToFeed ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                <button
                  onClick={() => handleMissionEvidence(false)}
                  disabled={!missionFile || missionUploading}
                  style={{
                    width: '100%', padding: 14,
                    background: missionFile && !missionUploading ? 'var(--grad-warm)' : 'var(--bg3)',
                    border: 'none', borderRadius: 12,
                    color: missionFile && !missionUploading ? '#fff' : 'var(--text3)',
                    fontSize: 14, fontWeight: 700,
                    cursor: missionFile && !missionUploading ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {missionUploading ? 'Enviando...' : `Enviar e ganhar +${activeMission.xpReward} XP`}
                </button>
              </>
            )}

            {/* TYPE: admin */}
            {activeMission.type === 'admin' && (
              <>
                {missionPending ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Aguardando aprovação</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
                      O admin irá revisar sua submissão e definir o vencedor
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={missionFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleMissionFileChange}
                    />
                    {missionFilePreview ? (
                      <div style={{ marginBottom: 14 }}>
                        <img src={missionFilePreview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
                        <button
                          onClick={() => { setMissionFile(null); setMissionFilePreview(null) }}
                          style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >
                          Trocar imagem
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => missionFileInputRef.current?.click()}
                        style={{
                          width: '100%', padding: '18px 0', marginBottom: 14,
                          background: 'var(--bg2)', border: '2px dashed var(--border)',
                          borderRadius: 12, color: 'var(--text3)', fontSize: 14, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}
                      >
                        📎 Selecionar print do tempo de tela
                      </button>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
                      Sua submissão ficará em análise até o admin definir o vencedor. Participar já vale {activeMission.participationXp} XP.
                    </div>
                    <button
                      onClick={() => handleMissionEvidence(true)}
                      disabled={!missionFile || missionUploading}
                      style={{
                        width: '100%', padding: 14,
                        background: missionFile && !missionUploading ? 'var(--grad-warm)' : 'var(--bg3)',
                        border: 'none', borderRadius: 12,
                        color: missionFile && !missionUploading ? '#fff' : 'var(--text3)',
                        fontSize: 14, fontWeight: 700,
                        cursor: missionFile && !missionUploading ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {missionUploading ? 'Enviando...' : 'Enviar para análise'}
                    </button>
                  </>
                )}
              </>
            )}

            {/* TYPE: checkin */}
            {activeMission.type === 'checkin' && (
              <button
                onClick={() => { completeMission(activeMission.id); closeMissionSheet() }}
                style={{
                  width: '100%', padding: 16,
                  background: 'var(--grad-warm)', border: 'none', borderRadius: 12,
                  color: '#fff', fontSize: 15, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                ✅ Fazer check-in agora (+{activeMission.xpReward} XP)
              </button>
            )}

            {/* TYPE: quiz */}
            {activeMission.type === 'quiz' && (() => {
              const quiz = QUIZ_DATA[activeMission.key] ?? []
              const current = quiz[quizStep]
              if (!current) return null
              const allCorrect = quiz.every((q, i) => quizAnswers[i] === q.correct)
              if (quizSubmitted) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{allCorrect ? '🎉' : '😅'}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                      {allCorrect ? 'Parabéns! Você acertou tudo!' : 'Quase lá...'}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.5 }}>
                      {allCorrect
                        ? `+${activeMission.xpReward} XP creditados!`
                        : 'Você errou pelo menos uma resposta. Tente novamente!'}
                    </div>
                    {!allCorrect && (
                      <button
                        onClick={() => { setQuizStep(0); setQuizAnswers([]); setQuizSubmitted(false) }}
                        style={{
                          marginTop: 16, padding: '12px 28px',
                          background: 'var(--grad-warm)', border: 'none', borderRadius: 12,
                          color: '#fff', fontSize: 14, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                        }}
                      >
                        Tentar novamente
                      </button>
                    )}
                  </div>
                )
              }
              return (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                    Pergunta {quizStep + 1} de {quiz.length}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16, lineHeight: 1.5 }}>
                    {current.question}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {current.options.map((opt, idx) => {
                      const selected = quizAnswers[quizStep] === idx
                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          style={{
                            padding: '13px 16px', textAlign: 'left',
                            background: selected ? 'rgba(250,20,98,0.1)' : 'var(--bg2)',
                            border: `1.5px solid ${selected ? 'var(--pink)' : 'var(--border)'}`,
                            borderRadius: 12, fontSize: 14, color: selected ? 'var(--pink)' : 'var(--text)',
                            fontWeight: selected ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={handleQuizNext}
                    disabled={quizAnswers[quizStep] === undefined}
                    style={{
                      width: '100%', padding: 14,
                      background: quizAnswers[quizStep] !== undefined ? 'var(--grad-warm)' : 'var(--bg3)',
                      border: 'none', borderRadius: 12,
                      color: quizAnswers[quizStep] !== undefined ? '#fff' : 'var(--text3)',
                      fontSize: 14, fontWeight: 700,
                      cursor: quizAnswers[quizStep] !== undefined ? 'pointer' : 'not-allowed',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {quizStep < quiz.length - 1 ? 'Próxima →' : 'Finalizar quiz'}
                  </button>
                </>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
