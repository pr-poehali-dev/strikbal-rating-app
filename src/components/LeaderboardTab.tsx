import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { Player, getRankIcon, getRankTitle } from './types';
import PlayerProfileView from './PlayerProfileView';

type LeaderboardTabProps = {
  players: Player[];
};

const LeaderboardTab = ({ players }: LeaderboardTabProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (selectedPlayerId) {
    return (
      <PlayerProfileView 
        playerId={selectedPlayerId} 
        onClose={() => setSelectedPlayerId(null)} 
      />
    );
  }

  return (
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
              <TableRow 
                key={player.id} 
                className={`${index === 0 ? 'bg-primary/5' : ''} cursor-pointer hover:bg-muted/50 transition-colors`}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <TableCell className="font-bold">
                  {index === 0 && <Icon name="Crown" size={20} className="text-yellow-500 inline mr-1" />}
                  #{index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {index === 0 ? (
                      <div className="relative">
                        <div className="absolute inset-0 -m-1 animate-flame">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-600 via-purple-400 to-transparent opacity-80 blur-sm"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-violet-600 via-violet-400 to-transparent opacity-60 blur-md animate-pulse"></div>
                        </div>
                        <Avatar className="relative z-10 ring-2 ring-purple-500">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    ) : index === 1 ? (
                      <div className="relative">
                        <div className="absolute -inset-2 animate-red-flame">
                          <div className="absolute left-0 top-0 w-2 h-3 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-sm animate-flicker-1"></div>
                          <div className="absolute right-0 top-1 w-2 h-4 bg-gradient-to-t from-red-700 via-orange-600 to-yellow-500 rounded-full blur-sm animate-flicker-2"></div>
                          <div className="absolute left-2 bottom-0 w-2 h-3 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-sm animate-flicker-3"></div>
                          <div className="absolute right-2 bottom-1 w-2 h-4 bg-gradient-to-t from-red-700 via-orange-600 to-yellow-500 rounded-full blur-sm animate-flicker-1"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-red-600/60 via-orange-500/40 to-transparent blur-md"></div>
                        </div>
                        <Avatar className="relative z-10 ring-2 ring-red-500">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <Avatar>
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
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
  );
};

export default LeaderboardTab;