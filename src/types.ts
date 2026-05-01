import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
  GUEST = 'guest'
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  playerName: string;
  whatsapp?: string;
}

export enum MatchStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed'
}

export interface MatchEdit {
  timestamp: Timestamp;
  updatedBy: string;
  score1?: number[];
  score2?: number[];
  tiebreak1?: number;
  tiebreak2?: number;
  winner?: string;
  scheduledAt?: Timestamp;
  court?: string;
  action: 'schedule' | 'result';
}

export type Category = 'A' | 'B' | 'C' | 'Duplas';

export interface Match {
  id: string;
  category: Category;
  round: string;
  group?: string;
  matchNum?: number;
  p1: string;
  p2: string;
  score1?: number[];
  score2?: number[];
  tiebreak1?: number;
  tiebreak2?: number;
  winner?: string;
  status: MatchStatus;
  scheduledAt?: Timestamp;
  court?: string;
  deadline?: Timestamp;
  updatedBy?: string;
  updatedAt?: Timestamp;
  participants: string[];
  history?: MatchEdit[];
}

export interface GroupStanding {
  player: string;
  group: string;
  category: Category;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  matchesPlayed: number;
}

export interface TournamentSettings {
  roundDeadlines?: Record<string, Timestamp>;
}
