import { useAppStore } from '../store/appStore'

const PODIUM_COLORS = [
  { bg: 'var(--grad-warm)', outline: 'var(--orange)', barH: 48 },
  { bg: 'linear-gradient(135deg, #9A9590, #6A6560)', outline: '#aaa', barH: 34 },
  { bg: 'linear-gradient(135deg, #C47A00, #A06000)', outline: '#C47A00', barH: 22 },
]
const MEDALS = ['🥇', '🥈', '🥉']

export function RankingScreen() {
  const { ranking, user, rankingLoading } = useAppStore()
  const myRank = ranking.find(r => r.id === user.id)
  const top3 = ranking.slice(0, 3)
  const allZeroXp = ranking.length > 0 && ranking.every(r => r.xp === 0)

  const MysteryAvatar = ({ size, colorIdx }: { size: number; colorIdx: number }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: PODIUM_COLORS[colorIdx].bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.3, color: 'rgba(255,255,255,0.5)',
      boxShadow: colorIdx === 0 ? `0 0 0 3px ${PODIUM_COLORS[0].outline}` : undefined,
    }}>
      ?
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 16px',
        background: 'var(--grad-hero)',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#fff' }}>Ranking 🏆</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
          Top participantes por XP
        </div>
      </div>

      <div className="scroll-area">
        {rankingLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 15 }}>
            ⏳ Carregando ranking...
          </div>
        )}
        {!rankingLoading && ranking.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12 }}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Ranking ainda vazio</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>Participe das missões para aparecer aqui!</div>
          </div>
        )}
        {/* Podium */}
        {!rankingLoading && ranking.length > 0 && (
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
            {allZeroXp && (
              <div style={{ textAlign: 'center', padding: '12px 20px 0', fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
                O ranking será revelado quando o evento começar!
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10, padding: '24px 20px 0' }}>
              {/* 2nd */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ fontSize: 16 }}>🥈</div>
                {allZeroXp ? (
                  <MysteryAvatar size={50} colorIdx={1} />
                ) : top3[1] ? (
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: PODIUM_COLORS[1].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 15, color: '#fff',
                    overflow: 'hidden',
                  }}>
                    {top3[1].avatar
                      ? <img src={top3[1].avatar} alt={top3[1].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : top3[1].initials
                    }
                  </div>
                ) : null}
                <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: 'var(--text)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {allZeroXp ? '?' : top3[1]?.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--xp)', fontWeight: 700 }}>{allZeroXp ? '? XP' : top3[1] ? top3[1].xp.toLocaleString('pt-BR') : ''}</div>
                <div style={{ width: 64, height: PODIUM_COLORS[1].barH, background: 'var(--bg3)', borderRadius: '6px 6px 0 0' }} />
              </div>

              {/* 1st */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ fontSize: 20 }}>👑</div>
                {allZeroXp ? (
                  <MysteryAvatar size={64} colorIdx={0} />
                ) : top3[0] ? (
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: PODIUM_COLORS[0].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 19, color: '#fff',
                    boxShadow: `0 0 0 3px ${PODIUM_COLORS[0].outline}`,
                    overflow: 'hidden',
                  }}>
                    {top3[0].avatar
                      ? <img src={top3[0].avatar} alt={top3[0].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : top3[0].initials
                    }
                  </div>
                ) : null}
                <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--text)', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {allZeroXp ? '?' : top3[0]?.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 12, color: 'var(--xp)', fontWeight: 700 }}>{allZeroXp ? '? XP' : top3[0] ? top3[0].xp.toLocaleString('pt-BR') : ''}</div>
                <div style={{
                  width: 64, height: PODIUM_COLORS[0].barH,
                  background: 'var(--grad-warm)', borderRadius: '6px 6px 0 0', opacity: 0.25,
                }} />
              </div>

              {/* 3rd */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ fontSize: 16 }}>🥉</div>
                {allZeroXp ? (
                  <MysteryAvatar size={50} colorIdx={2} />
                ) : top3[2] ? (
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: PODIUM_COLORS[2].bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 15, color: '#fff',
                    overflow: 'hidden',
                  }}>
                    {top3[2].avatar
                      ? <img src={top3[2].avatar} alt={top3[2].name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : top3[2].initials
                    }
                  </div>
                ) : null}
                <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: 'var(--text)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {allZeroXp ? '?' : top3[2]?.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--xp)', fontWeight: 700 }}>{allZeroXp ? '? XP' : top3[2] ? top3[2].xp.toLocaleString('pt-BR') : ''}</div>
                <div style={{ width: 64, height: PODIUM_COLORS[2].barH, background: 'var(--bg3)', borderRadius: '6px 6px 0 0' }} />
              </div>
            </div>
          </div>
        )}

        {/* My position */}
        {myRank && (
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              background: 'rgba(250,20,98,0.06)', border: '1.5px solid rgba(250,20,98,0.2)',
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {myRank.position}
              </div>
              {/* Use live user.avatar so it updates immediately after profile changes */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, color: '#fff', overflow: 'hidden', flexShrink: 0,
              }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : myRank.initials
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{myRank.name} <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600 }}>(você)</span></div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{myRank.church}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--xp)' }}>
                ⚡ {myRank.xp.toLocaleString('pt-BR')} XP
              </div>
            </div>
          </div>
        )}

        {/* Full list — hidden when all XP is 0 */}
        {!allZeroXp && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, margin: '0 16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {ranking.map((r, idx) => {
              const isMe = r.id === user.id
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: idx < ranking.length - 1 ? '1px solid var(--border2)' : 'none',
                    background: isMe ? 'rgba(250,20,98,0.03)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Position */}
                  <div style={{ width: 28, textAlign: 'center', fontWeight: 700, fontSize: 13, color: idx < 3 ? 'var(--text)' : 'var(--text3)', flexShrink: 0 }}>
                    {idx < 3 ? MEDALS[idx] : r.position}
                  </div>

                  {/* Avatar — show photo if available, else initials */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: isMe ? 'var(--grad-warm)' : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12, color: isMe ? '#fff' : 'var(--text2)',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {(isMe ? user.avatar : r.avatar)
                      ? <img src={isMe ? user.avatar : r.avatar} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : r.initials
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                      {r.name} {isMe && <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 600 }}>(você)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.church}</div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--xp)' }}>
                    {r.xp.toLocaleString('pt-BR')}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty bottom space */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
