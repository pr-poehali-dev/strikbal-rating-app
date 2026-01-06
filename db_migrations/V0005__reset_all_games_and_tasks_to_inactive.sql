-- Сброс всех игр в неактивное состояние и очистка победителей
UPDATE t_p28902192_strikbal_rating_app.games
SET status = 'cancelled',
    winner_team_id = NULL;

-- Сброс всех заданий в невыполненное состояние
UPDATE t_p28902192_strikbal_rating_app.tasks
SET completed = FALSE;