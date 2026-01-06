import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { getRankIcon, getRankTitle } from './types';

type PlayerProfileData = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  rank: number | null;
  completed_tasks: Array<{
    id: number;
    name: string;
    points: number;
    completed: boolean;
    created_at: string;
  }>;
  games_history: Array<{
    id: number;
    name: string;
    created_at: string;
    team_name: string;
    team_color: string;
    won: boolean;
  }>;
};

type PlayerProfileViewProps = {
  playerId: string;
  onClose: () => void;
};

const PlayerProfileView = ({ playerId, onClose }: PlayerProfileViewProps) => {
  const [profileData, setProfileData] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerProfile = async () => {
      try {
        const url = `https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477?action=player&id=${playerId}`;
        const response = await fetch(url, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerProfile();
  }, [playerId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <p className="text-muted-foreground">Профиль не найден</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="UserCircle" size={24} />
            Профиль игрока
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={profileData.avatar} />
            <AvatarFallback className="text-3xl">
              {profileData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold">{profileData.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-4xl">{getRankIcon(profileData.points)}</span>
                  <span className="text-xl font-semibold text-muted-foreground">
                    {getRankTitle(profileData.points)}
                  </span>
                </div>
                {profileData.rank && (
                  <Badge variant="outline" className="text-base">
                    <Icon name="Trophy" size={16} className="mr-1" />
                    Место #{profileData.rank}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {profileData.points.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Очков</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">{profileData.wins}</p>
                  <p className="text-sm text-muted-foreground mt-1">Побед</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-600">{profileData.losses}</p>
                  <p className="text-sm text-muted-foreground mt-1">Поражений</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator />

        {profileData.games_history && profileData.games_history.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="Swords" size={22} />
                История игр
              </h3>
              <div className="space-y-2">
                {profileData.games_history.map((game) => (
                  <Card key={game.id} className={game.won ? 'border-green-500' : 'border-red-500'}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: game.team_color }}
                          />
                          <div>
                            <p className="font-semibold">{game.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Команда: {game.team_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(game.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={game.won ? 'default' : 'secondary'} className={game.won ? 'bg-green-600' : 'bg-red-600'}>
                          {game.won ? (
                            <>
                              <Icon name="Trophy" size={14} className="mr-1" />
                              Победа
                            </>
                          ) : (
                            <>
                              <Icon name="X" size={14} className="mr-1" />
                              Поражение
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {profileData.completed_tasks.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="CheckCircle" size={22} />
                Дополнительные задания
              </h3>
              <div className="space-y-2">
                {profileData.completed_tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon name="CheckCircle" size={20} className="text-green-600" />
                          <div>
                            <p className="font-semibold">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-bold">
                          +{task.points} очков
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerProfileView;
