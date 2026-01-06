export type Player = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
};

export type Team = {
  id: string;
  name: string;
  color: string;
  players: string[];
};

export type Game = {
  id: string;
  name: string;
  status: 'active' | 'completed';
  teams: Team[];
  winnerId?: string;
  createdAt: Date;
};

export type Task = {
  id: string;
  name: string;
  points: number;
  playerId: string;
  completed: boolean;
};

export const mockPlayers: Player[] = [
  { id: '1', name: 'Дмитрий Ильин', avatar: '', points: 15000, wins: 45, losses: 12 },
  { id: '2', name: 'Алексей Воронов', avatar: '', points: 12500, wins: 38, losses: 15 },
  { id: '3', name: 'Сергей Козлов', avatar: '', points: 8700, wins: 28, losses: 20 },
  { id: '4', name: 'Игорь Петров', avatar: '', points: 6200, wins: 22, losses: 18 },
  { id: '5', name: 'Михаил Сидоров', avatar: '', points: 4100, wins: 15, losses: 25 },
];

export const getRankIcon = (points: number) => {
  if (points >= 25000) return '👑';
  if (points >= 20000) return '💀';
  if (points >= 15000) return '🐉';
  if (points >= 10000) return '🦈';
  if (points >= 5000) return '🐺';
  return '🎯';
};

export const getRankTitle = (points: number) => {
  if (points >= 25000) return 'Легенда';
  if (points >= 20000) return 'Повелитель';
  if (points >= 15000) return 'Дракон';
  if (points >= 10000) return 'Акула';
  if (points >= 5000) return 'Волк';
  return 'Новичок';
};
