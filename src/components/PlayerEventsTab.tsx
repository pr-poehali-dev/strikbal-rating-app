import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type PlayerEventsTabProps = {
  authToken: string;
  currentUserId: number;
};

const PlayerEventsTab = ({ authToken, currentUserId }: PlayerEventsTabProps) => {
  const [games, setGames] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGames();
    loadTasks();
  }, []);

  const loadGames = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2', {
        method: 'GET',
        headers: {
          'X-Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.games) {
        const myGames = data.games.filter((game: any) => 
          game.status === 'active' && 
          game.teams?.some((team: any) => 
            team.players?.some((p: any) => p.id === currentUserId)
          )
        );
        setGames(myGames);
      }
    } catch (error) {
      console.error('Ошибка загрузки игр:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1', {
        method: 'GET',
        headers: {
          'X-Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.tasks) {
        const myTasks = data.tasks.filter((task: any) => 
          task.player_id === currentUserId && !task.completed
        );
        setTasks(myTasks);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const getMyTeam = (game: any) => {
    return game.teams?.find((team: any) => 
      team.players?.some((p: any) => p.id === currentUserId)
    );
  };

  const getOpponentTeams = (game: any) => {
    const myTeam = getMyTeam(game);
    return game.teams?.filter((team: any) => team.id !== myTeam?.id) || [];
  };

  if (games.length === 0 && tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="Calendar" size={24} />
            Мои события
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Icon name="Inbox" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              У вас пока нет активных игр или задач
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Ожидайте, когда администратор добавит вас в игру
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {games.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icon name="Gamepad2" size={24} />
              Мои активные игры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {games.map(game => {
              const myTeam = getMyTeam(game);
              const opponentTeams = getOpponentTeams(game);

              return (
                <Card key={game.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{game.name}</CardTitle>
                      <Badge variant="default">
                        <Icon name="Zap" size={14} className="mr-1" />
                        Активна
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {myTeam && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Icon name="Users" size={18} />
                          Моя команда
                        </h3>
                        <div
                          className="p-4 rounded-lg border-2"
                          style={{ borderColor: myTeam.color }}
                        >
                          <p className="font-semibold mb-3" style={{ color: myTeam.color }}>
                            {myTeam.name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {myTeam.players?.map((player: any) => (
                              <div key={player.id} className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={player.avatar} />
                                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {player.name}
                                  {player.id === currentUserId && ' (вы)'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {opponentTeams.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Icon name="Swords" size={18} />
                          Противники
                        </h3>
                        <div className="space-y-3">
                          {opponentTeams.map((team: any) => (
                            <div
                              key={team.id}
                              className="p-4 rounded-lg border-2"
                              style={{ borderColor: team.color }}
                            >
                              <p className="font-semibold mb-3" style={{ color: team.color }}>
                                {team.name}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {team.players?.map((player: any) => (
                                  <div key={player.id} className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={player.avatar} />
                                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{player.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icon name="Target" size={24} />
              Мои дополнительные задачи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map(task => (
              <Card key={task.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{task.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="font-semibold">
                          <Icon name="Award" size={14} className="mr-1" />
                          +{task.points} очков
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <Icon name="Clock" size={14} className="mr-1" />
                      Ожидает
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Info" size={16} />
                Выполняйте задачи, чтобы заработать дополнительные очки. Администратор отметит их как выполненные.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerEventsTab;
