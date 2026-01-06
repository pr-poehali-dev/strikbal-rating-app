import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Player, Game, Task, Team, mockPlayers } from '@/components/types';
import LeaderboardTab from '@/components/LeaderboardTab';
import EventsTab from '@/components/EventsTab';
import ProfileTab from '@/components/ProfileTab';
import AuthPage from '@/components/AuthPage';
import AdminEventsTab from '@/components/AdminEventsTab';
import PlayerEventsTab from '@/components/PlayerEventsTab';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [newGameName, setNewGameName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#0EA5E9');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskPlayer, setNewTaskPlayer] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      const parsedUser = JSON.parse(user);
      setAuthToken(token);
      setCurrentUser(parsedUser);
      setIsAdmin(parsedUser.isAdmin);
      setIsAuthenticated(true);
      if (parsedUser.player) {
        setCurrentPlayer({
          id: parsedUser.player.id.toString(),
          name: parsedUser.name,
          avatar: parsedUser.avatar || '',
          points: parsedUser.player.points,
          wins: parsedUser.player.wins,
          losses: parsedUser.player.losses,
        });
      }
      loadPlayers(token);
    }
  }, []);

  const loadPlayers = async (token?: string) => {
    try {
      console.log('Загрузка игроков...');
      const response = await fetch('https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477', {
        method: 'GET',
      });
      
      console.log('Ответ получен:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend error:', response.status, errorData);
        return;
      }
      
      const data = await response.json();
      console.log('Данные получены:', data);
      if (data.players) {
        const formattedPlayers: Player[] = data.players.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          avatar: p.avatar || '',
          points: p.points,
          wins: p.wins,
          losses: p.losses,
        }));
        setPlayers(formattedPlayers);
      }
    } catch (error) {
      console.error('Ошибка загрузки игроков:', error);
    }
  };

  const handleLogin = (token: string, user: any) => {
    setAuthToken(token);
    setCurrentUser(user);
    setIsAdmin(user.isAdmin);
    setIsAuthenticated(true);
    if (user.player) {
      setCurrentPlayer({
        id: user.player.id.toString(),
        name: user.name,
        avatar: user.avatar || '',
        points: user.player.points,
        wins: user.player.wins,
        losses: user.player.losses,
      });
    }
    loadPlayers(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setCurrentPlayer(null);
    toast.success('Вы вышли из системы');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

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
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-orange-950 blur-3xl animate-gradient-pulse -z-10"></div>
      <div className="fixed inset-0 bg-black/40 -z-10"></div>
      <div className="container mx-auto py-4 md:py-6 px-3 md:px-4 max-w-7xl relative z-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1 md:mb-2 flex items-center gap-2 md:gap-3">
              <Icon name="Target" size={28} className="text-primary md:w-10 md:h-10" />
              Страйкбол Рейтинг
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">Система рейтинга от Дмитрия Ильина</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            {isAdmin && (
              <Badge variant="default" className="text-xs md:text-base px-2 md:px-4 py-1 md:py-2">
                <Icon name="Shield" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
                Админ
              </Badge>
            )}
            <Button variant="outline" onClick={handleLogout} className="text-xs md:text-base">
              <Icon name="LogOut" size={14} className="mr-1 md:mr-2 md:w-4 md:h-4" />
              Выход
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-8">
            <TabsTrigger value="leaderboard" className="text-xs md:text-base px-2 md:px-4">
              <Icon name="Trophy" size={16} className="mr-1 md:mr-2 md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Рейтинг</span>
              <span className="sm:hidden">🏆</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs md:text-base px-2 md:px-4">
              <Icon name="Sword" size={16} className="mr-1 md:mr-2 md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">События</span>
              <span className="sm:hidden">⚔️</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs md:text-base px-2 md:px-4">
              <Icon name="User" size={16} className="mr-1 md:mr-2 md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Профиль</span>
              <span className="sm:hidden">👤</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            <LeaderboardTab players={players} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            {isAdmin && authToken ? (
              <AdminEventsTab authToken={authToken} />
            ) : authToken && currentUser ? (
              <PlayerEventsTab authToken={authToken} currentUserId={currentUser.id} />
            ) : (
              <EventsTab
                isAdmin={isAdmin}
                players={players}
                games={games}
                tasks={tasks}
                newGameName={newGameName}
                setNewGameName={setNewGameName}
                createGame={createGame}
                finishGame={finishGame}
                newTaskName={newTaskName}
                setNewTaskName={setNewTaskName}
                newTaskPoints={newTaskPoints}
                setNewTaskPoints={setNewTaskPoints}
                newTaskPlayer={newTaskPlayer}
                setNewTaskPlayer={setNewTaskPlayer}
                createTask={createTask}
                completeTask={completeTask}
              />
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {currentPlayer && <ProfileTab currentPlayer={currentPlayer} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;