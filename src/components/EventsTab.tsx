import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Player, Game, Task } from './types';

type EventsTabProps = {
  isAdmin: boolean;
  players: Player[];
  games: Game[];
  tasks: Task[];
  newGameName: string;
  setNewGameName: (value: string) => void;
  createGame: () => void;
  finishGame: (gameId: string, winnerTeamId: string) => void;
  newTaskName: string;
  setNewTaskName: (value: string) => void;
  newTaskPoints: string;
  setNewTaskPoints: (value: string) => void;
  newTaskPlayer: string;
  setNewTaskPlayer: (value: string) => void;
  createTask: () => void;
  completeTask: (taskId: string) => void;
};

const EventsTab = ({
  isAdmin,
  players,
  games,
  tasks,
  newGameName,
  setNewGameName,
  createGame,
  finishGame,
  newTaskName,
  setNewTaskName,
  newTaskPoints,
  setNewTaskPoints,
  newTaskPlayer,
  setNewTaskPlayer,
  createTask,
  completeTask,
}: EventsTabProps) => {
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="Users" size={24} />
            Доступные игры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Нет активных игр. Ожидайте создания новых событий администратором.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="Plus" size={24} />
            Создать игру
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Название игры</Label>
            <Input
              placeholder="Захват точки Alpha"
              value={newGameName}
              onChange={e => setNewGameName(e.target.value)}
            />
          </div>
          <Button onClick={createGame} className="w-full">
            <Icon name="Plus" size={18} className="mr-2" />
            Создать игру
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="ListChecks" size={24} />
            Дополнительные задачи
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Название задачи</Label>
              <Input
                placeholder="Снайпер дня"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Очки</Label>
              <Input
                type="number"
                placeholder="500"
                value={newTaskPoints}
                onChange={e => setNewTaskPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Игрок</Label>
              <Select value={newTaskPlayer} onValueChange={setNewTaskPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите игрока" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createTask} className="w-full">
            <Icon name="Plus" size={18} className="mr-2" />
            Создать задачу
          </Button>

          {tasks.length > 0 && (
            <div className="mt-6 space-y-3">
              <Separator />
              <h3 className="font-semibold text-lg">Активные задачи</h3>
              {tasks.map(task => (
                <Card key={task.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {players.find(p => p.id === task.playerId)?.name} • {task.points} очков
                        </p>
                      </div>
                      {!task.completed ? (
                        <Button onClick={() => completeTask(task.id)} size="sm">
                          <Icon name="Check" size={16} className="mr-1" />
                          Выполнено
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          <Icon name="CheckCircle2" size={14} className="mr-1" />
                          Завершена
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {games.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icon name="Gamepad2" size={24} />
              Активные игры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {games.map(game => (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{game.name}</CardTitle>
                    <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
                      {game.status === 'active' ? 'Активна' : 'Завершена'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {game.status === 'active' && game.teams.length > 0 && (
                    <div className="space-y-3">
                      {game.teams.map(team => (
                        <div
                          key={team.id}
                          className="p-4 rounded-lg border-2"
                          style={{ borderColor: team.color }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold" style={{ color: team.color }}>
                                {team.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Игроков: {team.players.length}
                              </p>
                            </div>
                            <Button onClick={() => finishGame(game.id, team.id)} variant="default">
                              <Icon name="Trophy" size={16} className="mr-2" />
                              Победа
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default EventsTab;
