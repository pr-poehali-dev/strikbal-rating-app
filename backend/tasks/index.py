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
    '''API для управления дополнительными задачами'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
                        SELECT 
                            t.id, 
                            t.name, 
                            t.points, 
                            t.completed, 
                            t.created_at,
                            u.name as player_name,
                            p.id as player_id
                        FROM t_p28902192_strikbal_rating_app.tasks t
                        JOIN t_p28902192_strikbal_rating_app.players p ON t.player_id = p.id
                        JOIN t_p28902192_strikbal_rating_app.users u ON p.user_id = u.id
                        ORDER BY t.completed ASC, t.created_at DESC
                        """
                    )
                    tasks = cur.fetchall()

                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'tasks': [dict(task) for task in tasks]}, default=str),
                        'isBase64Encoded': False
                    }

                elif method == 'POST':
                    body = json.loads(event.get('body', '{}'))
                    name = body.get('name', '').strip()
                    points = body.get('points')
                    player_id = body.get('playerId')

                    if not name or not points or not player_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Заполните все поля'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        INSERT INTO t_p28902192_strikbal_rating_app.tasks (name, points, player_id)
                        VALUES (%s, %s, %s)
                        RETURNING id, name, points, player_id, completed, created_at
                        """,
                        (name, points, player_id)
                    )
                    task = cur.fetchone()
                    conn.commit()

                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'task': dict(task)}, default=str),
                        'isBase64Encoded': False
                    }

                elif method == 'PUT':
                    body = json.loads(event.get('body', '{}'))
                    task_id = body.get('taskId')

                    if not task_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Укажите ID задачи'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        SELECT points, player_id FROM t_p28902192_strikbal_rating_app.tasks
                        WHERE id = %s AND completed = FALSE
                        """,
                        (task_id,)
                    )
                    task = cur.fetchone()

                    if not task:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Задача не найдена или уже выполнена'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.players
                        SET points = points + %s
                        WHERE id = %s
                        """,
                        (task['points'], task['player_id'])
                    )

                    cur.execute(
                        """
                        UPDATE t_p28902192_strikbal_rating_app.tasks
                        SET completed = TRUE
                        WHERE id = %s
                        """,
                        (task_id,)
                    )

                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Задача выполнена, очки начислены'}),
                        'isBase64Encoded': False
                    }

                elif method == 'DELETE':
                    query_params = event.get('queryStringParameters', {}) or {}
                    task_id = query_params.get('taskId')

                    if not task_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Укажите ID задачи'}),
                            'isBase64Encoded': False
                        }

                    cur.execute(
                        """
                        DELETE FROM t_p28902192_strikbal_rating_app.tasks
                        WHERE id = %s
                        """,
                        (task_id,)
                    )

                    conn.commit()

                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'Задача удалена'}),
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