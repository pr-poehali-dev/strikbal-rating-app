import json
import os
import base64
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

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
    '''API для получения списка игроков и загрузки аватаров'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method == 'POST':
        try:
            headers = event.get('headers', {})
            print(f"Headers received: {headers}")
            
            auth_header = headers.get('x-authorization', headers.get('X-Authorization', ''))
            if not auth_header:
                auth_header = headers.get('authorization', headers.get('Authorization', ''))
            
            print(f"Auth header: {auth_header}")
            token = auth_header.replace('Bearer ', '').replace('bearer ', '').strip() if auth_header else ''

            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }

            dsn = os.environ['DATABASE_URL']
            body = json.loads(event.get('body', '{}'))
            avatar_base64 = body.get('avatar_base64', '')

            if not avatar_base64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется avatar_base64'}),
                    'isBase64Encoded': False
                }

            print(f"Token from request: {token[:20]}...")

            with psycopg2.connect(dsn) as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        """
                        SELECT u.id, u.name
                        FROM t_p28902192_strikbal_rating_app.sessions s
                        JOIN t_p28902192_strikbal_rating_app.users u ON s.user_id = u.id
                        WHERE s.token = %s AND s.expires_at > NOW()
                        """,
                        (token,)
                    )
                    result = cur.fetchone()
                    print(f"Database query result: {result}")
                    
                    if not result:
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Нет доступа - токен не найден или истёк'}),
                            'isBase64Encoded': False
                        }
                    
                    player_id = result['id']
                    print(f"User found: {result['name']} (ID: {player_id})")

            if avatar_base64.startswith('data:image'):
                avatar_base64 = avatar_base64.split(',')[1]

            image_data = base64.b64decode(avatar_base64)
            file_key = f'avatars/{uuid.uuid4()}.png'

            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )

            s3.put_object(
                Bucket='files',
                Key=file_key,
                Body=image_data,
                ContentType='image/png'
            )

            avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"

            with psycopg2.connect(dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.users
                        SET avatar = %s
                        WHERE id = %s
                        """,
                        (avatar_url, player_id)
                    )
                    conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'avatar_url': avatar_url}),
                'isBase64Encoded': False
            }

        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Ошибка загрузки: {str(e)}'}),
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