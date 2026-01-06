import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    '''API для авторизации пользователей'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'}),
            'isBase64Encoded': False
        }

    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email', '').strip().lower()
        password = body.get('password', '').strip()

        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Введите email и пароль'}),
                'isBase64Encoded': False
            }

        password_hash = hash_password(password)
        dsn = os.environ['DATABASE_URL']

        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT u.id, u.email, u.name, u.avatar, u.is_admin, p.id as player_id, p.points, p.wins, p.losses
                    FROM t_p28902192_strikbal_rating_app.users u
                    LEFT JOIN t_p28902192_strikbal_rating_app.players p ON u.id = p.user_id
                    WHERE u.email = %s AND u.password_hash = %s
                    """,
                    (email, password_hash)
                )
                user = cur.fetchone()

                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }

                token = generate_token()
                expires_at = datetime.utcnow() + timedelta(days=30)

                cur.execute(
                    """
                    INSERT INTO t_p28902192_strikbal_rating_app.sessions 
                    (user_id, token, expires_at)
                    VALUES (%s, %s, %s)
                    """,
                    (user['id'], token, expires_at)
                )
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'name': user['name'],
                            'avatar': user['avatar'],
                            'isAdmin': user['is_admin'],
                            'player': {
                                'id': user['player_id'],
                                'points': user['points'],
                                'wins': user['wins'],
                                'losses': user['losses']
                            }
                        }
                    }),
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
