-- Migration 3: Populate 9 achievements (delete existing first)

DELETE FROM public.user_achievements;
DELETE FROM public.achievements;

INSERT INTO public.achievements (key, icon, title, description, condition_key, condition_value) VALUES
('missionario',       '🌎', 'Missionário',      'Conversou com pessoas de 3 ou mais estados diferentes', 'states_count', '3'),
('desintoxicado',     '📵', 'Desintoxicado',    'Completou todas as missões do eixo Dopamina', 'eixo_dopamina_complete', '1'),
('conectado',         '🤝', 'Conectado',        'Fez 5 ou mais conexões com pessoas novas', 'connections_count', '5'),
('voz_ativa',         '🎤', 'Voz ativa',        'Enviou perguntas em 2 ou mais palestras', 'questions_count', '2'),
('atento',            '📖', 'Atento',           'Completou todos os quizzes de palestra', 'quizzes_complete', '1'),
('presenca_total',    '🌅', 'Presença total',   'Fez check-in nos 2 momentos de louvor', 'checkins_complete', '1'),
('saturados',         '🏆', 'Saturados',        'Top 3 no ranking ao final da conferência', 'top3_ranking', '1'),
('completo',          '✨', 'Completo',         'Completou 15 ou mais missões ao longo dos dois dias', 'missions_count', '15'),
('menor_tela',        '📱', 'Menor tela',       'Venceu a missão de menor tempo de tela em qualquer dia', 'won_screen_time', '1');
