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
    '''API для получения списка всех игроков (админ - полный доступ, обычный - рейтинг)'''
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
        auth_header = headers.get('x-authorization', headers.get('X-Authorization', ''))
        if not auth_header:
            auth_header = headers.get('authorization', headers.get('Authorization', ''))
        token = auth_header.replace('Bearer ', '').strip()

        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }

        dsn = os.environ['DATABASE_URL']
        is_admin = verify_admin(token, dsn)

        with psycopg2.connect(dsn) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if is_admin:
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
                        ORDER BY COALESCE(p.points, 0) DESC, u.name ASC
                        """
                    )
                else:
                    cur.execute(
                        """
                        SELECT 
                            u.id, 
                            u.name, 
                            u.avatar,
                            COALESCE(p.points, 0) as points, 
                            COALESCE(p.wins, 0) as wins, 
                            COALESCE(p.losses, 0) as losses
                        FROM t_p28902192_strikbal_rating_app.users u
                        LEFT JOIN t_p28902192_strikbal_rating_app.players p ON p.user_id = u.id
                        ORDER BY COALESCE(p.points, 0) DESC, u.name ASC
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