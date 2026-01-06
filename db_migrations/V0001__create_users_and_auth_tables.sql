-- Таблица пользователей
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица игроков (рейтинг)
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.players (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.users(id),
    points INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS t_p28902192_strikbal_rating_app.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p28902192_strikbal_rating_app.users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p28902192_strikbal_rating_app.users(email);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON t_p28902192_strikbal_rating_app.players(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p28902192_strikbal_rating_app.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON t_p28902192_strikbal_rating_app.sessions(user_id);