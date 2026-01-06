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
      const response = await fetch(
        'https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477?action=profile',
        {
          method: 'GET',
        }
      );

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="UserCircle" size={24} />
            Мой профиль
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Icon name="RefreshCw" size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Обновление...' : 'Обновить'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={displayData.avatar} />
                  <AvatarFallback className="text-3xl">
                    {displayData.name.charAt(0)}
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

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold">{displayData.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-4xl">{getRankIcon(displayData.points)}</span>
                  <span className="text-xl font-semibold text-muted-foreground">
                    {getRankTitle(displayData.points)}
                  </span>
                </div>
                {profileData?.rank && (
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
                    {displayData.points.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Очков</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">{displayData.wins}</p>
                  <p className="text-sm text-muted-foreground mt-1">Побед</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-600">{displayData.losses}</p>
                  <p className="text-sm text-muted-foreground mt-1">Поражений</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator />

        {profileData && profileData.completed_tasks.length > 0 && (
          <>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Icon name="CheckCircle" size={22} />
                Выполненные задачи
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
            <Separator />
          </>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Icon name="Award" size={22} />
            Система достижений
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { points: 5000, icon: '🐺', title: 'Волк', locked: displayData.points < 5000 },
              {
                points: 10000,
                icon: '🦈',
                title: 'Акула',
                locked: displayData.points < 10000,
              },
              {
                points: 15000,
                icon: '🐉',
                title: 'Дракон',
                locked: displayData.points < 15000,
              },
              {
                points: 20000,
                icon: '💀',
                title: 'Повелитель',
                locked: displayData.points < 20000,
              },
              {
                points: 25000,
                icon: '👑',
                title: 'Легенда',
                locked: displayData.points < 25000,
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
  );
};

export default ProfileTab;