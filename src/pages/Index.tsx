import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Player, Game, Task, Team, mockPlayers } from '@/components/types';
import LeaderboardTab from '@/components/LeaderboardTab';
import EventsTab from '@/components/EventsTab';
import ProfileTab from '@/components/ProfileTab';

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
            <LeaderboardTab players={players} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab currentPlayer={currentPlayer} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
