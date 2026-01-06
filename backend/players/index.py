import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def verify_admin(token: str, dsn: str) -> bool:
    '''Проверка прав администратора по токену'''
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
    '''API для получения списка всех игроков (только для админа)'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'}),
            'isBase64Encoded': False
        }

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', headers.get('Authorization', ''))
        token = auth_header.replace('Bearer ', '').strip()

        dsn = os.environ['DATABASE_URL']

        if not verify_admin(token, dsn):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен. Требуются права администратора'}),
                'isBase64Encoded': False
            }

        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT 
                        u.id, 
                        u.name, 
                        u.email, 
                        u.avatar,
                        COALESCE(p.points, 0) as points, 
                        COALESCE(p.wins, 0) as wins, 
                        COALESCE(p.losses, 0) as losses
                    FROM t_p28902192_strikbal_rating_app.users u
                    LEFT JOIN t_p28902192_strikbal_rating_app.players p ON p.user_id = u.id
                    ORDER BY COALESCE(p.points, 0) DESC
                    """
                )
                players = cur.fetchall()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'players': [dict(player) for player in players]
                    }),
                    'isBase64Encoded': False
                }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }