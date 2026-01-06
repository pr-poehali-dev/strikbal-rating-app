import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Player, getRankIcon, getRankTitle } from './types';

type ProfileTabProps = {
  currentPlayer: Player;
};

type ProfileData = {
  id: string;
  name: string;
  email: string;
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

const ProfileTab = ({ currentPlayer }: ProfileTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const url = `https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477?action=profile${token ? `&token=${token}` : ''}`;
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    const reader = new FileReader();
    
    reader.onerror = () => {
      console.error('Ошибка чтения файла');
      alert('Не удалось прочитать файл');
      setUploading(false);
    };
    
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const token = localStorage.getItem('auth_token');
        
        console.log('Отправка запроса на загрузку аватара...');
        console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
        
        const response = await fetch('https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            avatar_base64: base64,
          }),
        });

        console.log('Ответ сервера:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка загрузки');
        }

        const data = await response.json();
        console.log('Аватар загружен:', data.avatar_url);
        
        currentPlayer.avatar = data.avatar_url;
        setIsDialogOpen(false);
        setSelectedFile(null);
        window.location.reload();
      } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        alert(`Не удалось загрузить аватар: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        setUploading(false);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const displayData = profileData || currentPlayer;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Icon name="UserCircle" size={20} className="md:w-6 md:h-6" />
            Мой профиль
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs md:text-sm w-full sm:w-auto"
          >
            <Icon name="RefreshCw" size={14} className={`${refreshing ? 'animate-spin' : ''} md:w-4 md:h-4`} />
            <span className="ml-1 md:ml-2">{refreshing ? 'Обновление...' : 'Обновить'}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                {profileData?.rank === 1 ? (
                  <div className="relative">
                    <div className="absolute inset-0 -m-2 animate-flame">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-600 via-purple-400 to-transparent opacity-80 blur-sm"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-violet-600 via-violet-400 to-transparent opacity-60 blur-md animate-pulse"></div>
                    </div>
                    <Avatar className="w-32 h-32 relative z-10 ring-4 ring-purple-500">
                      <AvatarImage src={displayData.avatar} />
                      <AvatarFallback className="text-3xl">
                        {displayData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <Icon name="Camera" size={32} className="text-white" />
                    </div>
                  </div>
                ) : profileData?.rank === 2 ? (
                  <div className="relative">
                    <div className="absolute -inset-3 animate-red-flame">
                      <div className="absolute left-0 top-0 w-3 h-4 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-sm animate-flicker-1"></div>
                      <div className="absolute right-0 top-2 w-3 h-5 bg-gradient-to-t from-red-700 via-orange-600 to-yellow-500 rounded-full blur-sm animate-flicker-2"></div>
                      <div className="absolute left-3 bottom-0 w-3 h-4 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-sm animate-flicker-3"></div>
                      <div className="absolute right-3 bottom-2 w-3 h-5 bg-gradient-to-t from-red-700 via-orange-600 to-yellow-500 rounded-full blur-sm animate-flicker-1"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-red-600/60 via-orange-500/40 to-transparent blur-md"></div>
                    </div>
                    <Avatar className="w-32 h-32 relative z-10 ring-4 ring-red-500">
                      <AvatarImage src={displayData.avatar} />
                      <AvatarFallback className="text-3xl">
                        {displayData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <Icon name="Camera" size={32} className="text-white" />
                    </div>
                  </div>
                ) : profileData?.rank === 3 ? (
                  <div className="relative">
                    <div className="absolute -inset-3 animate-bronze-flame">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 opacity-60 blur-md animate-bronze-glow"></div>
                      <div className="absolute left-2 top-0 w-2.5 h-3 bg-gradient-to-t from-amber-800 via-amber-500 to-yellow-200 rounded-full blur-sm animate-bronze-flicker-1"></div>
                      <div className="absolute right-2 top-2 w-2.5 h-4 bg-gradient-to-t from-amber-900 via-amber-600 to-yellow-300 rounded-full blur-sm animate-bronze-flicker-2"></div>
                      <div className="absolute bottom-0 left-0 w-2.5 h-3 bg-gradient-to-t from-amber-800 via-amber-500 to-yellow-200 rounded-full blur-sm animate-bronze-flicker-3"></div>
                      <div className="absolute bottom-2 right-0 w-2.5 h-4 bg-gradient-to-t from-amber-900 via-amber-600 to-yellow-300 rounded-full blur-sm animate-bronze-flicker-1"></div>
                    </div>
                    <Avatar className="w-32 h-32 relative z-10 ring-4 ring-amber-600">
                      <AvatarImage src={displayData.avatar} />
                      <AvatarFallback className="text-3xl">
                        {displayData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <Icon name="Camera" size={32} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={displayData.avatar} />
                      <AvatarFallback className="text-3xl">
                        {displayData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icon name="Camera" size={32} className="text-white" />
                    </div>
                  </>
                )}
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Изменить аватар</DialogTitle>
                <DialogDescription>Загрузите новое фото профиля</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Выбран файл: {selectedFile.name}
                  </p>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Загрузка...' : 'Сохранить'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex-1 space-y-3 md:space-y-4 w-full">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl md:text-3xl font-bold">{displayData.name}</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 md:gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl md:text-4xl">{getRankIcon(displayData.points)}</span>
                  <span className="text-base md:text-xl font-semibold text-muted-foreground">
                    {getRankTitle(displayData.points)}
                  </span>
                </div>
                {profileData?.rank && (
                  <Badge variant="outline" className="text-sm md:text-base">
                    <Icon name="Trophy" size={14} className="mr-1 md:w-4 md:h-4" />
                    Место #{profileData.rank}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <Card>
                <CardContent className="pt-3 md:pt-6 text-center">
                  <p className="text-xl md:text-3xl font-bold text-primary">
                    {displayData.points.toLocaleString()}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Очков</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 md:pt-6 text-center">
                  <p className="text-xl md:text-3xl font-bold text-green-600">{displayData.wins}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Побед</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 md:pt-6 text-center">
                  <p className="text-xl md:text-3xl font-bold text-red-600">{displayData.losses}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Поражений</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator />

        {profileData && profileData.games_history && profileData.games_history.length > 0 && (
          <>
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                <Icon name="Swords" size={18} className="md:w-[22px] md:h-[22px]" />
                История игр
              </h3>
              <div className="space-y-2">
                {profileData.games_history.map((game) => (
                  <Card key={game.id} className={game.won ? 'border-green-500' : 'border-red-500'}>
                    <CardContent className="pt-3 md:pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: game.team_color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base truncate">{game.name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {game.team_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(game.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={game.won ? 'default' : 'secondary'} className={`${game.won ? 'bg-green-600' : 'bg-red-600'} text-xs md:text-sm flex-shrink-0`}>
                          {game.won ? (
                            <>
                              <Icon name="Trophy" size={12} className="mr-0.5 md:mr-1 md:w-[14px] md:h-[14px]" />
                              <span className="hidden sm:inline">Победа</span>
                              <span className="sm:hidden">🏆</span>
                            </>
                          ) : (
                            <>
                              <Icon name="X" size={12} className="mr-0.5 md:mr-1 md:w-[14px] md:h-[14px]" />
                              <span className="hidden sm:inline">Поражение</span>
                              <span className="sm:hidden">❌</span>
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

        {profileData && profileData.completed_tasks.length > 0 && (
          <>
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                <Icon name="CheckCircle" size={18} className="md:w-[22px] md:h-[22px]" />
                Дополнительные задания
              </h3>
              <div className="space-y-2">
                {profileData.completed_tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-3 md:pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <Icon name="CheckCircle" size={16} className="text-green-600 flex-shrink-0 md:w-5 md:h-5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base truncate">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.created_at).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-bold text-xs md:text-sm flex-shrink-0">
                          +{task.points}
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

        <div className="space-y-3 md:space-y-4">
          <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <Icon name="Award" size={18} className="md:w-[22px] md:h-[22px]" />
            Система достижений
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {[
              { points: 5000, icon: 'https://cdn.poehali.dev/files/1344ab0f-f5b2-4a69-b71b-ac2b87e8aeb5_35beca51-5ad3-4002-8ac5-6c18ba8c6adf (2).png', title: 'Волк', locked: displayData.points < 5000, isImage: true },
              {
                points: 10000,
                icon: '🦈',
                title: 'Акула',
                locked: displayData.points < 10000,
                isImage: false,
              },
              {
                points: 15000,
                icon: '🐉',
                title: 'Дракон',
                locked: displayData.points < 15000,
                isImage: false,
              },
              {
                points: 20000,
                icon: '💀',
                title: 'Повелитель',
                locked: displayData.points < 20000,
                isImage: false,
              },
              {
                points: 25000,
                icon: '👑',
                title: 'Легенда',
                locked: displayData.points < 25000,
                isImage: false,
              },
            ].map(achievement => (
              <Card
                key={achievement.points}
                className={achievement.locked ? 'opacity-50' : 'border-primary'}
              >
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    {achievement.isImage ? (
                      <img 
                        src={achievement.icon} 
                        alt={achievement.title}
                        className="w-12 h-12 md:w-16 md:h-16 object-contain flex-shrink-0"
                      />
                    ) : (
                      <span className="text-3xl md:text-5xl flex-shrink-0">{achievement.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base md:text-lg">{achievement.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {achievement.points.toLocaleString()} очков
                      </p>
                      {achievement.locked && (
                        <Badge variant="secondary" className="mt-1 md:mt-2 text-xs">
                          <Icon name="Lock" size={10} className="mr-0.5 md:mr-1 md:w-3 md:h-3" />
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
  );
};

export default ProfileTab;