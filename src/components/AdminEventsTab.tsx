import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Player = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
};

type Team = {
  name: string;
  color: string;
  players: number[];
};

type AdminEventsTabProps = {
  authToken: string;
};

const AdminEventsTab = ({ authToken }: AdminEventsTabProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [newGameName, setNewGameName] = useState('');
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Команда 1', color: '#FF6B00', players: [] },
    { name: 'Команда 2', color: '#00A8FF', players: [] },
  ]);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  useEffect(() => {
    loadPlayers();
    loadGames();
    loadTasks();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setPlayers(data.players);
      }
    } catch (error) {
      toast.error('Ошибка загрузки игроков');
    }
  };

  const loadGames = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setGames(data.games);
      }
    } catch (error) {
      toast.error('Ошибка загрузки игр');
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(data.tasks);
      }
    } catch (error) {
      toast.error('Ошибка загрузки задач');
    }
  };

  const handleTogglePlayer = (teamIndex: number, playerId: number) => {
    setTeams(prev => {
      const newTeams = [...prev];
      const otherTeamIndex = teamIndex === 0 ? 1 : 0;
      
      if (newTeams[teamIndex].players.includes(playerId)) {
        newTeams[teamIndex].players = newTeams[teamIndex].players.filter(id => id !== playerId);
      } else {
        newTeams[otherTeamIndex].players = newTeams[otherTeamIndex].players.filter(id => id !== playerId);
        newTeams[teamIndex].players.push(playerId);
      }
      
      return newTeams;
    });
  };

  const createGame = async () => {
    if (!newGameName.trim()) {
      toast.error('Введите название игры');
      return;
    }

    if (teams[0].players.length === 0 || teams[1].players.length === 0) {
      toast.error('Добавьте игроков в обе команды');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: newGameName, teams }),
      });

      if (response.ok) {
        toast.success('Игра создана');
        setNewGameName('');
        setTeams([
          { name: 'Команда 1', color: '#FF6B00', players: [] },
          { name: 'Команда 2', color: '#00A8FF', players: [] },
        ]);
        loadGames();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка создания игры');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const finishGame = async (gameId: number, winnerTeamId: number) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameId, winnerTeamId }),
      });

      if (response.ok) {
        toast.success('Игра завершена, очки распределены');
        loadGames();
        loadPlayers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка завершения игры');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!newTaskName.trim() || !newTaskPoints || !selectedPlayerId) {
      toast.error('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newTaskName,
          points: parseInt(newTaskPoints),
          playerId: parseInt(selectedPlayerId),
        }),
      });

      if (response.ok) {
        toast.success('Задача создана');
        setNewTaskName('');
        setNewTaskPoints('');
        setSelectedPlayerId('');
        loadTasks();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка создания задачи');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        toast.success('Задача выполнена, очки начислены');
        loadTasks();
        loadPlayers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка выполнения задачи');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

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

          <Separator />

          {teams.map((team, teamIndex) => (
            <div key={teamIndex} className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: team.color }}
                />
                <Input
                  value={team.name}
                  onChange={e => {
                    const newTeams = [...teams];
                    newTeams[teamIndex].name = e.target.value;
                    setTeams(newTeams);
                  }}
                  placeholder="Название команды"
                />
                <Input
                  type="color"
                  value={team.color}
                  onChange={e => {
                    const newTeams = [...teams];
                    newTeams[teamIndex].color = e.target.value;
                    setTeams(newTeams);
                  }}
                  className="w-20"
                />
              </div>

              <div className="ml-9 space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={team.players.includes(player.id)}
                      onCheckedChange={() => handleTogglePlayer(teamIndex, player.id)}
                    />
                    <span className="text-sm">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={createGame} className="w-full" disabled={loading}>
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
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите игрока" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createTask} className="w-full" disabled={loading}>
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
                          {task.player_name} • {task.points} очков
                        </p>
                      </div>
                      {!task.completed ? (
                        <Button onClick={() => completeTask(task.id)} size="sm" disabled={loading}>
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
                  {game.status === 'active' && game.teams && game.teams.length > 0 && (
                    <div className="space-y-3">
                      {game.teams.map((team: any) => (
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
                                Игроков: {team.players?.length || 0}
                              </p>
                              {team.players && team.players.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {team.players.map((p: any) => (
                                    <Badge key={p.id} variant="outline">
                                      {p.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => finishGame(game.id, team.id)}
                              variant="default"
                              disabled={loading}
                            >
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

export default AdminEventsTab;
