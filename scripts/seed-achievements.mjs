import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lrpjeqlnztpbjmashctv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxycGplcWxuenRwYmptYXNoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTAxMjEsImV4cCI6MjA5MTM2NjEyMX0.W7Ku2cLgatnfZOCAhRF3d6tBTQb8K7_5Jo4NyY7c1Sk'
)

// condition_key encoding:
//   mission_key:<mission_key>                         → verifica se completou missão com esse key
//   mission_key_any_evidence:<k1,k2,...>              → verifica se completou QUALQUER missão com esses keys
//   missions_count                                     → usa condition_value como mínimo de missões
const achievements = [
  { key: 'desconectado', icon: '🔕', title: 'Desconectado',    description: 'Ficou sem redes sociais até o almoço no dia 1',         condition_key: 'mission_key:sem_redes_almoco',                                           condition_value: null },
  { key: 'quebra_bolha', icon: '🤝', title: 'Quebra de bolha', description: 'Conversou com alguém de outra igreja',                  condition_key: 'mission_key:primeiro_contato',                                           condition_value: null },
  { key: 'lucido',       icon: '🧠', title: 'Lúcido',          description: 'Completou o quiz da palestra do Dia 1',                 condition_key: 'mission_key:quiz_saturados',                                             condition_value: null },
  { key: 'chamado',      icon: '✉️', title: 'Chamado',          description: 'Respondeu ao chamado missionário',                     condition_key: 'mission_key:chamado_missionario',                                        condition_value: null },
  { key: 'ate_o_fim',    icon: '🏁', title: 'Até o fim',       description: 'Fez check-in no encerramento da conferência',           condition_key: 'mission_key:checkin_encerramento',                                       condition_value: null },
  { key: 'reflexivo',    icon: '🧠', title: 'Reflexivo',       description: 'Completou o quiz da palestra do Dia 2',                 condition_key: 'mission_key:quiz_sentido',                                               condition_value: null },
  { key: 'voz_ativa',   icon: '💬', title: 'Voz ativa',       description: 'Enviou uma pergunta ao palestrante ao vivo',            condition_key: 'mission_key:pergunta_palestra',                                          condition_value: null },
  { key: 'presente',     icon: '📸', title: 'Presente',        description: 'Registrou um momento da conferência no feed',           condition_key: 'mission_key_any_evidence:selfie_amizade,sem_redes_almoco,celular_bolso', condition_value: null },
  { key: 'saturado',     icon: '✨', title: 'Saturado',        description: 'Completou 10 ou mais missões',                          condition_key: 'missions_count',                                                         condition_value: 10   },
]

async function run() {
  console.log('🗑️  Limpando user_achievements...')
  const { error: e1 } = await supabase.from('user_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e1) { console.error('Erro:', e1.message); process.exit(1) }
  console.log('   OK')

  console.log('🗑️  Limpando achievements...')
  const { error: e2 } = await supabase.from('achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e2) { console.error('Erro:', e2.message); process.exit(1) }
  console.log('   OK')

  console.log('✅ Inserindo 9 novas conquistas...')
  const { error: e3 } = await supabase.from('achievements').insert(
    achievements.map(a => ({
      key: a.key,
      icon: a.icon,
      title: a.title,
      description: a.description,
      condition_key: a.condition_key,
      condition_value: a.condition_value,
    }))
  )
  if (e3) { console.error('Erro:', e3.message); process.exit(1) }
  console.log('   OK — 9 conquistas criadas')

  const { data } = await supabase.from('achievements').select('key, title, condition_key, condition_value').order('created_at')
  console.log('\n📋 Conquistas no banco:')
  data?.forEach(a => console.log(`  [${a.key}] ${a.title} | ${a.condition_key} | val=${a.condition_value}`))
}

run().catch(err => { console.error(err); process.exit(1) })
