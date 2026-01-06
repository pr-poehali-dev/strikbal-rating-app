import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import GameCreation from './admin/GameCreation';
import GamesList from './admin/GamesList';
import TasksSection from './admin/TasksSection';

type Player = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
};

type AdminEventsTabProps = {
  authToken: string;
};

const AdminEventsTab = ({ authToken }: AdminEventsTabProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadPlayers();
    loadGames();
    loadTasks();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/6013caed-cf4a-4a7f-8f68-0cc2d40ca477', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Ошибка: ${errorData.error || response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.players) {
        setPlayers(data.players);
      }
    } catch (error) {
      toast.error('Ошибка загрузки игроков');
    }
  };

  const loadGames = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/5d6c5d79-2e2f-4d81-9cba-09e58c1435d2', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Ошибка: ${errorData.error || response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.games) {
        setGames(data.games);
      }
    } catch (error) {
      toast.error('Ошибка загрузки игр');
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/f3163ce6-2de5-435f-989d-d7026066ddb1', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(`Ошибка: ${errorData.error || response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      toast.error('Ошибка загрузки задач');
    }
  };

  const handleGameCreated = () => {
    loadGames();
    loadPlayers();
  };

  const handleGameFinished = () => {
    loadGames();
    loadPlayers();
  };

  const handleTaskCreated = () => {
    loadTasks();
  };

  return (
    <div className="space-y-6">
      <GameCreation 
        players={players} 
        authToken={authToken} 
        onGameCreated={handleGameCreated} 
      />
      
      <GamesList 
        games={games} 
        authToken={authToken} 
        onGameFinished={handleGameFinished} 
      />
      
      <TasksSection 
        tasks={tasks} 
        players={players} 
        authToken={authToken} 
        onTaskCreated={handleTaskCreated} 
      />
    </div>
  );
};

export default AdminEventsTab;