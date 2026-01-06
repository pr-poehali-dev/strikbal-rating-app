import { useState } from 'react';
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

const ProfileTab = ({ currentPlayer }: ProfileTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
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
        const token = localStorage.getItem('authToken');
        
        console.log('Отправка запроса на загрузку аватара...');
        
        const response = await fetch('https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            player_id: currentPlayer.id,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icon name="UserCircle" size={24} />
          Мой профиль
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={currentPlayer.avatar} />
                  <AvatarFallback className="text-3xl">
                    {currentPlayer.name.charAt(0)}
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
              <h2 className="text-3xl font-bold">{currentPlayer.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-4xl">{getRankIcon(currentPlayer.points)}</span>
                <span className="text-xl font-semibold text-muted-foreground">
                  {getRankTitle(currentPlayer.points)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {currentPlayer.points.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Очков</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">{currentPlayer.wins}</p>
                  <p className="text-sm text-muted-foreground mt-1">Побед</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-600">{currentPlayer.losses}</p>
                  <p className="text-sm text-muted-foreground mt-1">Поражений</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Icon name="Award" size={22} />
            Система достижений
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { points: 5000, icon: '🐺', title: 'Волк', locked: currentPlayer.points < 5000 },
              {
                points: 10000,
                icon: '🦈',
                title: 'Акула',
                locked: currentPlayer.points < 10000,
              },
              {
                points: 15000,
                icon: '🐉',
                title: 'Дракон',
                locked: currentPlayer.points < 15000,
              },
              {
                points: 20000,
                icon: '💀',
                title: 'Повелитель',
                locked: currentPlayer.points < 20000,
              },
              {
                points: 25000,
                icon: '👑',
                title: 'Легенда',
                locked: currentPlayer.points < 25000,
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