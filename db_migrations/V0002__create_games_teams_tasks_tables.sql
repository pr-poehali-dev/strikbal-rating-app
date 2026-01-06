-- Таблица игр
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    winner_team_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица команд
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.teams (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.games(id),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь игроков и команд
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.team_players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.teams(id),
    player_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.players(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица дополнительных задач
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    player_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.players(id),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_teams_game_id ON t_p28902192_strikbal_rating_app.teams(game_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON t_p28902192_strikbal_rating_app.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON t_p28902192_strikbal_rating_app.team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tasks_player_id ON t_p28902192_strikbal_rating_app.tasks(player_id);