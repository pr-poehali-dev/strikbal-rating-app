import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def verify_admin(token: str, dsn: str) -> bool:
    '''Проверка прав администратора'''
    if not token:
        return False
    
    with psycopg2.connect(dsn) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT u.is_admin 
                FROM t_p28902192_strikbal_rating_app.sessions s
                JOIN t_p28902192_strikbal_rating_app.users u ON s.user_id = u.id
                WHERE s.token = %s AND s.expires_at > NOW()
                """,
                (token,)
            )
            result = cur.fetchone()
            return result['is_admin'] if result else False

def handler(event: dict, context) -> dict:
    '''API для управления играми (создание, получение, завершение)'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        headers = event.get('headers', {})
        query_params = event.get('queryStringParameters', {}) or {}
        
        auth_header = headers.get('x-authorization', headers.get('X-Authorization', ''))
        if not auth_header:
            auth_header = headers.get('authorization', headers.get('Authorization', ''))
        token = auth_header.replace('Bearer ', '').strip() if auth_header else ''
        
        if not token:
            token = query_params.get('token', '')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ['DATABASE_URL']
        is_admin = verify_admin(token, dsn)
        
        if method != 'GET' and not is_admin:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуются права администратора'}),
                'isBase64Encoded': False
            }

        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                
                if method == 'GET':
                    cur.execute(
                        """
                        SELECT g.id, g.name, g.status, 
                               (g.status = 'completed') as finished,
                               g.winner_team_id, g.created_at,
                               json_agg(
                                   json_build_object(
                                       'id', t.id,
                                       'name', t.name,
                                       'color', t.color,
                                       'players', COALESCE(
                                           (SELECT json_agg(
                                               json_build_object(
                                                   'id', p.id,
                                                   'name', u.name,
                                                   'points', p.points
                                               )
                                           )
                                           FROM t_p28902192_strikbal_rating_app.team_players tp
                                           JOIN t_p28902192_strikbal_rating_app.players p ON tp.player_id = p.id
                                           JOIN t_p28902192_strikbal_rating_app.users u ON p.user_id = u.id
                                           WHERE tp.team_id = t.id),
                                           '[]'::json
                                       )
                                   )
                               ) FILTER (WHERE t.id IS NOT NULL) as teams
                        FROM t_p28902192_strikbal_rating_app.games g
                        LEFT JOIN t_p28902192_strikbal_rating_app.teams t ON g.id = t.game_id
                        GROUP BY g.id
                        ORDER BY g.created_at DESC
                        """
                    )
                    games = cur.fetchall()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'games': [dict(game) for game in games]}, default=str),
                        'isBase64Encoded': False
                    }

                elif method == 'POST':
                    body = json.loads(event.get('body', '{}'))
                    name = body.get('name', '').strip()
                    teams = body.get('teams', [])

                    if not name:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Укажите название игры'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        INSERT INTO t_p28902192_strikbal_rating_app.games (name, status)
                        VALUES (%s, %s)
                        RETURNING id, name, status, created_at
                        """,
                        (name, 'active')
                    )
                    game = cur.fetchone()

                    for team in teams:
                        cur.execute(
                            """
                            INSERT INTO t_p28902192_strikbal_rating_app.teams (game_id, name, color)
                            VALUES (%s, %s, %s)
                            RETURNING id
                            """,
                            (game['id'], team['name'], team['color'])
                        )
                        team_record = cur.fetchone()

                        for player_id in team.get('players', []):
                            cur.execute(
                                """
                                INSERT INTO t_p28902192_strikbal_rating_app.team_players (team_id, player_id)
                                VALUES (%s, %s)
                                """,
                                (team_record['id'], player_id)
                            )

                    conn.commit()

                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'game': dict(game)}, default=str),
                        'isBase64Encoded': False
                    }

                elif method == 'PUT':
                    body = json.loads(event.get('body', '{}'))
                    game_id = body.get('gameId')
                    winner_team_id = body.get('winnerTeamId')

                    if not game_id or not winner_team_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Укажите ID игры и команды-победителя'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        SELECT t.id FROM t_p28902192_strikbal_rating_app.teams t
                        WHERE t.game_id = %s
                        """,
                        (game_id,)
                    )
                    teams = cur.fetchall()

                    if len(teams) != 2:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'В игре должно быть 2 команды'}),
                            'isBase64Encoded': False
                        }

                    loser_team_id = [t['id'] for t in teams if t['id'] != winner_team_id][0]

                    cur.execute(
                        """
                        SELECT COUNT(*) as count FROM t_p28902192_strikbal_rating_app.team_players
                        WHERE team_id = %s
                        """,
                        (loser_team_id,)
                    )
                    loser_count = cur.fetchone()['count']

                    points_per_winner = loser_count * 100
                    points_per_loser = -100

                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.players
                        SET points = points + %s, wins = wins + 1
                        WHERE id IN (
                            SELECT player_id FROM t_p28902192_strikbal_rating_app.team_players
                            WHERE team_id = %s
                        )
                        """,
                        (points_per_winner, winner_team_id)
                    )

                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.players
                        SET points = GREATEST(points + %s, 0), losses = losses + 1
                        WHERE id IN (
                            SELECT player_id FROM t_p28902192_strikbal_rating_app.team_players
                            WHERE team_id = %s
                        )
                        """,
                        (points_per_loser, loser_team_id)
                    )

                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.games
                        SET status = 'completed', winner_team_id = %s
                        WHERE id = %s
                        """,
                        (winner_team_id, game_id)
                    )

                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Игра завершена, очки начислены'}),
                        'isBase64Encoded': False
                    }

                return {
                    'statusCode': 405,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Метод не разрешен'}),
                    'isBase64Encoded': False
                }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный формат данных'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }