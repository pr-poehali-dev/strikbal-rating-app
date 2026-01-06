import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type Player = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
};

type Team = {
  id: string;
  name: string;
  color: string;
  players: string[];
};

type Game = {
  id: string;
  name: string;
  status: 'active' | 'completed';
  teams: Team[];
  winnerId?: string;
  createdAt: Date;
};

type Task = {
  id: string;
  name: string;
  points: number;
  playerId: string;
  completed: boolean;
};

const mockPlayers: Player[] = [
  { id: '1', name: 'Дмитрий Ильин', avatar: '', points: 15000, wins: 45, losses: 12 },
  { id: '2', name: 'Алексей Воронов', avatar: '', points: 12500, wins: 38, losses: 15 },
  { id: '3', name: 'Сергей Козлов', avatar: '', points: 8700, wins: 28, losses: 20 },
  { id: '4', name: 'Игорь Петров', avatar: '', points: 6200, wins: 22, losses: 18 },
  { id: '5', name: 'Михаил Сидоров', avatar: '', points: 4100, wins: 15, losses: 25 },
];

const getRankIcon = (points: number) => {
  if (points >= 25000) return '👑';
  if (points >= 20000) return '💀';
  if (points >= 15000) return '🐉';
  if (points >= 10000) return '🦈';
  if (points >= 5000) return '🐺';
  return '🎯';
};

const getRankTitle = (points: number) => {
  if (points >= 25000) return 'Легенда';
  if (points >= 20000) return 'Повелитель';
  if (points >= 15000) return 'Дракон';
  if (points >= 10000) return 'Акула';
  if (points >= 5000) return 'Волк';
  return 'Новичок';
};

const Index = () => {
  const [isAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [games, setGames] = useState<Game[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPlayer] = useState(players[0]);

  const [newGameName, setNewGameName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#0EA5E9');

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskPlayer, setNewTaskPlayer] = useState('');

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  const createGame = () => {
    if (!newGameName.trim()) {
      toast.error('Введите название игры');
      return;
    }

    const game: Game = {
      id: Date.now().toString(),
      name: newGameName,
      status: 'active',
      teams: [],
      createdAt: new Date(),
    };

    setGames([...games, game]);
    setNewGameName('');
    toast.success('Игра создана');
  };

  const addTeam = () => {
    if (!newTeamName.trim()) {
      toast.error('Введите название команды');
      return;
    }

    const team: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      color: newTeamColor,
      players: [],
    };

    setTeams([...teams, team]);
    setNewTeamName('');
    toast.success('Команда создана');
  };

  const finishGame = (gameId: string, winnerTeamId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const winnerTeam = game.teams.find(t => t.id === winnerTeamId);
    const loserTeam = game.teams.find(t => t.id !== winnerTeamId);

    if (!winnerTeam || !loserTeam) return;

    const pointsPerWinner = loserTeam.players.length * 100;
    const pointsPerLoser = -100;

    setPlayers(prevPlayers =>
      prevPlayers.map(player => {
        if (winnerTeam.players.includes(player.id)) {
          return {
            ...player,
            points: player.points + pointsPerWinner,
            wins: player.wins + 1,
          };
        }
        if (loserTeam.players.includes(player.id)) {
          return {
            ...player,
            points: Math.max(0, player.points + pointsPerLoser),
            losses: player.losses + 1,
          };
        }
        return player;
      })
    );

    setGames(prevGames =>
      prevGames.map(g =>
        g.id === gameId ? { ...g, status: 'completed' as const, winnerId: winnerTeamId } : g
      )
    );

    toast.success('Игра завершена, очки распределены');
  };

  const createTask = () => {
    if (!newTaskName.trim() || !newTaskPoints || !newTaskPlayer) {
      toast.error('Заполните все поля задачи');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      points: parseInt(newTaskPoints),
      playerId: newTaskPlayer,
      completed: false,
    };

    setTasks([...tasks, task]);
    setNewTaskName('');
    setNewTaskPoints('');
    setNewTaskPlayer('');
    toast.success('Задача создана');
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === task.playerId
          ? { ...player, points: player.points + task.points }
          : player
      )
    );

    setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? { ...t, completed: true } : t)));
    toast.success(`Задача выполнена! +${task.points} очков`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Icon name="Target" size={40} className="text-primary" />
              Страйкбол Рейтинг
            </h1>
            <p className="text-muted-foreground">Система рейтинга от Дмитрия Ильина</p>
          </div>
          {isAdmin && (
            <Badge variant="default" className="text-base px-4 py-2">
              <Icon name="Shield" size={16} className="mr-2" />
              Администратор
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="leaderboard" className="text-base">
              <Icon name="Trophy" size={18} className="mr-2" />
              Рейтинг
            </TabsTrigger>
            <TabsTrigger value="events" className="text-base">
              <Icon name="Sword" size={18} className="mr-2" />
              События
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-base">
              <Icon name="User" size={18} className="mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="Medal" size={24} />
                  Таблица лидеров
                </CardTitle>
                <CardDescription>Лучшие игроки по количеству очков</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Место</TableHead>
                      <TableHead>Игрок</TableHead>
                      <TableHead className="text-center">Ранг</TableHead>
                      <TableHead className="text-center">Очки</TableHead>
                      <TableHead className="text-center">Победы</TableHead>
                      <TableHead className="text-center">Поражения</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayers.map((player, index) => (
                      <TableRow key={player.id} className={index === 0 ? 'bg-primary/5' : ''}>
                        <TableCell className="font-bold">
                          {index === 0 && <Icon name="Crown" size={20} className="text-yellow-500 inline mr-1" />}
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">{getRankIcon(player.points)}</span>
                            <span className="text-sm text-muted-foreground">
                              {getRankTitle(player.points)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-bold text-base">
                            {player.points.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-green-600 font-semibold">
                          {player.wins}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-semibold">
                          {player.losses}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            {isAdmin ? (
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
                                    {players.find(p => p.id === task.playerId)?.name} • {task.points}{' '}
                                    очков
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
                                      <Button
                                        onClick={() => finishGame(game.id, team.id)}
                                        variant="default"
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
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Icon name="UserCircle" size={24} />
                  Мой профиль
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative cursor-pointer group">
                        <Avatar className="w-32 h-32">
                          <AvatarImage src={currentPlayer.avatar} />
                          <AvatarFallback className="text-3xl">
                            {currentPlayer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Icon name="Camera" size={32} className="text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Изменить аватар</DialogTitle>
                        <DialogDescription>
                          Загрузите новое фото профиля
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input type="file" accept="image/*" />
                        <Button className="w-full">Сохранить</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold">{currentPlayer.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-4xl">{getRankIcon(currentPlayer.points)}</span>
                        <span className="text-xl font-semibold text-muted-foreground">
                          {getRankTitle(currentPlayer.points)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-primary">
                            {currentPlayer.points.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Очков</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-green-600">{currentPlayer.wins}</p>
                          <p className="text-sm text-muted-foreground mt-1">Побед</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-red-600">{currentPlayer.losses}</p>
                          <p className="text-sm text-muted-foreground mt-1">Поражений</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Icon name="Award" size={22} />
                    Система достижений
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { points: 5000, icon: '🐺', title: 'Волк', locked: currentPlayer.points < 5000 },
                      {
                        points: 10000,
                        icon: '🦈',
                        title: 'Акула',
                        locked: currentPlayer.points < 10000,
                      },
                      {
                        points: 15000,
                        icon: '🐉',
                        title: 'Дракон',
                        locked: currentPlayer.points < 15000,
                      },
                      {
                        points: 20000,
                        icon: '💀',
                        title: 'Повелитель',
                        locked: currentPlayer.points < 20000,
                      },
                      {
                        points: 25000,
                        icon: '👑',
                        title: 'Легенда',
                        locked: currentPlayer.points < 25000,
                      },
                    ].map(achievement => (
                      <Card
                        key={achievement.points}
                        className={achievement.locked ? 'opacity-50' : 'border-primary'}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <span className="text-5xl">{achievement.icon}</span>
                            <div className="flex-1">
                              <p className="font-bold text-lg">{achievement.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {achievement.points.toLocaleString()} очков
                              </p>
                              {achievement.locked && (
                                <Badge variant="secondary" className="mt-2">
                                  <Icon name="Lock" size={12} className="mr-1" />
                                  Заблокировано
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
