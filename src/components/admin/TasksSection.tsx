import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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

type TasksSectionProps = {
  tasks: any[];
  players: Player[];
  authToken: string;
  onTaskCreated: () => void;
};

const TasksSection = ({ tasks, players, authToken, onTaskCreated }: TasksSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const createTask = async () => {
    if (!newTaskName.trim() || !newTaskPoints || !selectedPlayerId) {
      toast.error('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const url = `https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1${authToken ? `?token=${authToken}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTaskName,
          points: parseInt(newTaskPoints),
          playerId: parseInt(selectedPlayerId),
        }),
      });

      if (response.ok) {
        toast.success('Задача создана');
        setNewTaskName('');
        setNewTaskPoints('');
        setSelectedPlayerId('');
        onTaskCreated();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка создания задачи');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    setLoading(true);
    try {
      const url = `https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1${authToken ? `?token=${authToken}` : ''}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        toast.success('Задача выполнена, очки начислены');
        onTaskCreated();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка выполнения задачи');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }

    setDeletingTaskId(taskId);
    try {
      const url = `https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1?token=${authToken}&taskId=${taskId}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Задача удалена');
        onTaskCreated();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка удаления задачи');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Icon name="ListChecks" size={24} />
          Задачи
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Создать задачу</h3>
          
          <div className="space-y-2">
            <Label htmlFor="taskName">Название задачи</Label>
            <Input
              id="taskName"
              placeholder="Организовать мероприятие"
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskPoints">Количество очков</Label>
              <Input
                id="taskPoints"
                type="number"
                placeholder="100"
                value={newTaskPoints}
                onChange={e => setNewTaskPoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskPlayer">Игрок</Label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger id="taskPlayer">
                  <SelectValue placeholder="Выберите игрока" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={String(player.id)}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={createTask} disabled={loading}>
            {loading ? 'Создание...' : 'Создать задачу'}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Активные задачи</h3>
          {tasks.filter(t => !t.completed).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="ListChecks" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Активных задач нет</p>
            </div>
          ) : (
            tasks
              .filter(t => !t.completed)
              .map(task => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{task.name}</h4>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            <Icon name="User" size={14} className="mr-1" />
                            {task.player_name}
                          </Badge>
                          <Badge>
                            <Icon name="Star" size={14} className="mr-1" />
                            {task.points} очков
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => completeTask(task.id)}
                          disabled={loading}
                        >
                          <Icon name="CheckCircle" size={16} />
                          Выполнить
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                        >
                          <Icon name="Trash2" size={18} className="text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {tasks.filter(t => t.completed).length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Завершённые задачи</h3>
              {tasks
                .filter(t => t.completed)
                .map(task => (
                  <Card key={task.id} className="opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{task.name}</h4>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">
                              <Icon name="User" size={14} className="mr-1" />
                              {task.player_name}
                            </Badge>
                            <Badge>
                              <Icon name="Star" size={14} className="mr-1" />
                              {task.points} очков
                            </Badge>
                            <Badge className="bg-green-600">
                              <Icon name="CheckCircle" size={14} className="mr-1" />
                              Выполнена
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                        >
                          <Icon name="Trash2" size={18} className="text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksSection;