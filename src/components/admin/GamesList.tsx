import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type GamesListProps = {
  games: any[];
  authToken: string;
  onGameFinished: () => void;
};

const GamesList = ({ games, authToken, onGameFinished }: GamesListProps) => {
  const [loading, setLoading] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

  const finishGame = async (gameId: number, winnerTeamId: number) => {
    setLoading(true);
    try {
      const url = `https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2${authToken ? `?token=${authToken}` : ''}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId, winnerTeamId }),
      });

      if (response.ok) {
        toast.success('Игра завершена! Очки распределены');
        onGameFinished();
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

  const deleteGame = async (gameId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту игру?')) {
      return;
    }

    setDeletingGameId(gameId);
    try {
      const url = `https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2?token=${authToken}&gameId=${gameId}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Игра удалена');
        onGameFinished();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления игры');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setDeletingGameId(null);
    }
  };

  const activeGames = games.filter(g => !g.finished);
  const finishedGames = games.filter(g => g.finished);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icon name="Trophy" size={24} />
          Игры
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeGames.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Активные игры</h3>
              {activeGames.map(game => (
                <Card key={game.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold">{game.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge>
                          {new Date(game.created_at).toLocaleDateString('ru-RU')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGame(game.id)}
                          disabled={deletingGameId === game.id}
                        >
                          <Icon name="Trash2" size={18} className="text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {game.teams.map((team: any) => (
                        <div
                          key={team.id}
                          className="p-4 rounded-lg border"
                          style={{ borderLeftWidth: '4px', borderLeftColor: team.color }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{team.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {team.players.map((player: any) => (
                              <Badge key={player.id} variant="secondary">
                                {player.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Завершить игру</label>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => finishGame(game.id, parseInt(value))}
                          disabled={loading}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Выберите победителя" />
                          </SelectTrigger>
                          <SelectContent>
                            {game.teams.map((team: any) => (
                              <SelectItem key={team.id} value={String(team.id)}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: team.color }}
                                  />
                                  {team.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {finishedGames.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Завершённые игры</h3>
              {finishedGames.map(game => {
                const winnerTeam = game.teams.find((t: any) => t.id === game.winner_team_id);
                return (
                  <Card key={game.id} className="opacity-75">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold">{game.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {new Date(game.created_at).toLocaleDateString('ru-RU')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGame(game.id)}
                            disabled={deletingGameId === game.id}
                          >
                            <Icon name="Trash2" size={18} className="text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {game.teams.map((team: any) => (
                          <div
                            key={team.id}
                            className={`p-4 rounded-lg border ${
                              team.id === game.winner_team_id ? 'bg-green-50 border-green-500' : ''
                            }`}
                            style={{
                              borderLeftWidth: '4px',
                              borderLeftColor: team.color,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{team.name}</span>
                              {team.id === game.winner_team_id && (
                                <Badge className="bg-green-600">
                                  <Icon name="Trophy" size={14} className="mr-1" />
                                  Победитель
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {team.players.map((player: any) => (
                                <Badge key={player.id} variant="secondary">
                                  {player.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {games.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="Trophy" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Игр пока нет</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GamesList;