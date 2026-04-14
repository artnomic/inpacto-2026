-- Migration 2: Populate 18 missions (delete existing first)

DELETE FROM public.user_missions;
DELETE FROM public.missions;

INSERT INTO public.missions (key, icon, title, description, xp_reward, day, order_index, type, eixo, participation_xp, is_active) VALUES
-- DIA 1
('primeiro_contato',    '🤝', 'Primeiro contato',               'Converse com alguém de outra igreja e registre o nome dela.', 50, 1, 1, 'text', 'integracao', 0, false),
('selfie_amizade',      '📸', 'Selfie da amizade nova',          'Tire uma foto com alguém de outro estado ou cidade.', 80, 1, 2, 'evidence', 'integracao', 0, false),
('sem_redes_almoco',    '📵', 'Sem redes até o almoço',          'Não abra redes sociais até o almoço. Envie o print do tempo de tela da manhã.', 100, 1, 3, 'evidence', 'dopamina', 0, false),
('quiz_saturados',      '🧠', 'Quiz: Saturados do quê?',         'Responda o quiz de 3 perguntas sobre a palestra de Claudia Lotti.', 60, 1, 4, 'quiz', 'palestra', 0, false),
('checkin_louvor_d1',   '🎵', 'Presente no louvor — noite D1',   'Faça check-in no louvor do Baruk (19h, noite do dia 1).', 40, 1, 5, 'checkin', 'presenca', 0, false),
('maior_distracao',     '📱', 'Minha maior distração',           'Responda: qual app você mais usa e por quê? (reflexão pós-palestra de Raphael Abdalla)', 70, 1, 6, 'text', 'dopamina', 0, false),
('fuga_sofrimento',     '🕊️', 'Fuga do sofrimento',              'Responda: o que você usa para fugir do desconforto no dia a dia? (reflexão pós-palestra de Fernanda Witwytsky)', 60, 1, 7, 'text', 'palestra', 0, false),
('menor_tela_d1',       '⏱️', 'Menor tempo de tela — D1',        'Envie o print do seu tempo de tela total do dia. Admin define o vencedor.', 200, 1, 8, 'admin', 'dopamina', 30, false),
-- DIA 2
('mesa_misturada',      '🍽️', 'Mesa misturada',                  'Almoce com 2+ pessoas que não conhecia. Registre os nomes.', 80, 2, 1, 'text', 'integracao', 0, false),
('quiz_sentido',        '🧠', 'Quiz: Sentido do Trabalho',       'Responda o quiz de 3 perguntas sobre a palestra de Pedro Pamplona.', 60, 2, 2, 'quiz', 'palestra', 0, false),
('celular_bolso',       '🔕', 'Celular no bolso',                'Durante o Talkshow "Vivendo em comunhão", não abra o celular. Envie o print do tempo de tela.', 120, 2, 3, 'evidence', 'dopamina', 0, false),
('chamado_missionario', '✉️', 'Chamado missionário',             'Responda: onde você sente que Deus te chamou a ser missionário? (reflexão pós-palestra do Pr. Arival)', 70, 2, 4, 'text', 'palestra', 0, false),
('checkin_encerramento','🏁', 'Presente no encerramento',        'Faça check-in no encerramento da conferência (19h30, dia 2).', 100, 2, 5, 'checkin', 'presenca', 0, false),
('menor_tela_d2',       '⏱️', 'Menor tempo de tela — D2',        'Envie o print do seu tempo de tela total do dia. Admin define o vencedor geral.', 200, 2, 6, 'admin', 'dopamina', 30, false),
-- AMBOS OS DIAS (day NULL = disponível sempre)
('conexao_real',        '🌍', 'Conexão real',                    'Troque contato com alguém de outra cidade ao longo da conferência.', 150, NULL, 1, 'text', 'integracao', 0, true),
('pergunta_palestra',   '🎤', 'Pergunta na palestra',            'Envie uma pergunta para qualquer palestrante via app durante o evento.', 150, NULL, 2, 'auto', 'engajamento', 0, true),
('mapa_conferencia',    '🗺️', 'Mapa da conferência',             'Converse com participantes de pelo menos 3 estados diferentes e registre.', 110, NULL, 3, 'text', 'integracao', 0, true);
