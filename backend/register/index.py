import json
import os
import hashlib
import re
import psycopg2
from psycopg2.extras import RealDictCursor

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def handler(event: dict, context) -> dict:
    '''API для регистрации пользователей по email'''
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
        name = body.get('name', '').strip()

        if not email or not password or not name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Заполните все поля'}),
                'isBase64Encoded': False
            }

        if not validate_email(email):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный формат email'}),
                'isBase64Encoded': False
            }

        if len(password) < 6:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'}),
                'isBase64Encoded': False
            }

        password_hash = hash_password(password)
        dsn = os.environ['DATABASE_URL']

        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id FROM t_p28902192_strikbal_rating_app.users WHERE email = %s",
                    (email,)
                )
                existing = cur.fetchone()

                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь с таким email уже существует'}),
                        'isBase64Encoded': False
                    }

                cur.execute(
                    """
                    INSERT INTO t_p28902192_strikbal_rating_app.users 
                    (email, password_hash, name, avatar, is_admin)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, email, name, is_admin
                    """,
                    (email, password_hash, name, '', False)
                )
                user = cur.fetchone()

                cur.execute(
                    """
                    INSERT INTO t_p28902192_strikbal_rating_app.players 
                    (user_id, points, wins, losses)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (user['id'], 0, 0, 0)
                )
                player = cur.fetchone()

                conn.commit()

                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Регистрация прошла успешно',
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'name': user['name'],
                            'isAdmin': user['is_admin'],
                            'playerId': player['id']
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
