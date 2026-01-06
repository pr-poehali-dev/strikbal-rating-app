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
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
          <Icon name="Medal" size={20} className="md:w-6 md:h-6" />
          Таблица лидеров
        </CardTitle>
        <CardDescription className="text-sm">Лучшие игроки по количеству очков</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 md:w-16 text-xs md:text-sm">Место</TableHead>
              <TableHead className="text-xs md:text-sm">Игрок</TableHead>
              <TableHead className="text-center text-xs md:text-sm hidden sm:table-cell">Ранг</TableHead>
              <TableHead className="text-center text-xs md:text-sm">Очки</TableHead>
              <TableHead className="text-center text-xs md:text-sm hidden md:table-cell">Победы</TableHead>
              <TableHead className="text-center text-xs md:text-sm hidden md:table-cell">Поражения</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player, index) => (
              <TableRow 
                key={player.id} 
                className={`${index === 0 ? 'bg-primary/5' : ''} cursor-pointer hover:bg-muted/50 transition-colors`}
                onClick={() => setSelectedPlayerId(player.id)}
              >
                <TableCell className="font-bold text-xs md:text-base">
                  {index === 0 && <Icon name="Crown" size={16} className="text-yellow-500 inline mr-0.5 md:mr-1 md:w-5 md:h-5" />}
                  <span className="hidden sm:inline">#{index + 1}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 md:gap-3">
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
                    ) : index === 2 ? (
                      <div className="relative">
                        <div className="absolute -inset-2 animate-bronze-flame">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 opacity-60 blur-md animate-bronze-glow"></div>
                          <div className="absolute left-1 top-0 w-1.5 h-2 bg-gradient-to-t from-amber-800 via-amber-500 to-yellow-200 rounded-full blur-sm animate-bronze-flicker-1"></div>
                          <div className="absolute right-1 top-1 w-1.5 h-2.5 bg-gradient-to-t from-amber-900 via-amber-600 to-yellow-300 rounded-full blur-sm animate-bronze-flicker-2"></div>
                          <div className="absolute bottom-0 left-0 w-1.5 h-2 bg-gradient-to-t from-amber-800 via-amber-500 to-yellow-200 rounded-full blur-sm animate-bronze-flicker-3"></div>
                          <div className="absolute bottom-1 right-0 w-1.5 h-2.5 bg-gradient-to-t from-amber-900 via-amber-600 to-yellow-300 rounded-full blur-sm animate-bronze-flicker-1"></div>
                        </div>
                        <Avatar className="relative z-10 ring-2 ring-amber-600">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <Avatar className="w-8 h-8 md:w-10 md:h-10">
                        <AvatarImage src={player.avatar} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-medium text-xs md:text-base truncate max-w-[100px] md:max-w-none">{player.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <span className="text-xl md:text-2xl">{getRankIcon(player.points)}</span>
                    <span className="text-xs md:text-sm text-muted-foreground hidden lg:inline">
                      {getRankTitle(player.points)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-bold text-xs md:text-base px-1.5 md:px-2.5">
                    {player.points.toLocaleString()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-green-600 font-semibold text-xs md:text-base hidden md:table-cell">
                  {player.wins}
                </TableCell>
                <TableCell className="text-center text-red-600 font-semibold text-xs md:text-base hidden md:table-cell">
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