-- Обнуление статистики всех игроков
UPDATE t_p28902192_strikbal_rating_app.players
SET points = 0,
    wins = 0,
    losses = 0,
    updated_at = NOW();