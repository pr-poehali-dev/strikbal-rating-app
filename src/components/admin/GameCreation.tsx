import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type GameCreationProps = {
  players: Player[];
  authToken: string;
  onGameCreated: () => void;
};

const GameCreation = ({ players, authToken, onGameCreated }: GameCreationProps) => {
  const [loading, setLoading] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Команда 1', color: '#FF6B00', players: [] },
    { name: 'Команда 2', color: '#00A8FF', players: [] },
  ]);

  const handleTogglePlayer = (teamIndex: number, playerId: number) => {
    setTeams(prev => {
      const newTeams = [...prev];
      
      if (newTeams[teamIndex].players.includes(playerId)) {
        newTeams[teamIndex].players = newTeams[teamIndex].players.filter(id => id !== playerId);
      } else {
        newTeams.forEach((team, idx) => {
          if (idx !== teamIndex) {
            team.players = team.players.filter(id => id !== playerId);
          }
        });
        newTeams[teamIndex].players.push(playerId);
      }
      
      return newTeams;
    });
  };

  const addTeam = () => {
    const teamNumber = teams.length + 1;
    const colors = ['#FF6B00', '#00A8FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444'];
    const newTeam: Team = {
      name: `Команда ${teamNumber}`,
      color: colors[teams.length % colors.length],
      players: [],
    };
    setTeams([...teams, newTeam]);
    toast.success('Команда добавлена');
  };

  const removeTeam = (teamIndex: number) => {
    if (teams.length <= 2) {
      toast.error('Минимум 2 команды');
      return;
    }
    setTeams(teams.filter((_, idx) => idx !== teamIndex));
    toast.success('Команда удалена');
  };

  const createGame = async () => {
    if (!newGameName.trim()) {
      toast.error('Введите название игры');
      return;
    }

    const emptyTeams = teams.filter(t => t.players.length === 0);
    if (emptyTeams.length > 0) {
      toast.error('Добавьте игроков во все команды');
      return;
    }

    setLoading(true);
    try {
      const url = `https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2${authToken ? `?token=${authToken}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        onGameCreated();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icon name="Plus" size={24} />
          Создать новую игру
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gameName">Название игры</Label>
          <Input
            id="gameName"
            placeholder="Турнир выходного дня"
            value={newGameName}
            onChange={e => setNewGameName(e.target.value)}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Команды</h3>
            <Button variant="outline" size="sm" onClick={addTeam}>
              <Icon name="Plus" size={16} />
              Добавить команду
            </Button>
          </div>

          {teams.map((team, teamIndex) => (
            <Card key={teamIndex}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-semibold">{team.name}</span>
                    <Badge variant="secondary">
                      {team.players.length} {team.players.length === 1 ? 'игрок' : 'игроков'}
                    </Badge>
                  </div>
                  {teams.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeam(teamIndex)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {players.map(player => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`player-${teamIndex}-${player.id}`}
                        checked={team.players.includes(player.id)}
                        onCheckedChange={() => handleTogglePlayer(teamIndex, player.id)}
                      />
                      <label
                        htmlFor={`player-${teamIndex}-${player.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {player.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={createGame} disabled={loading}>
          {loading ? 'Создание...' : 'Создать игру'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GameCreation;