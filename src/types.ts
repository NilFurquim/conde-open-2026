import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player',
  GUEST = 'guest'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  whatsapp?: string;
  playerName?: string; // Link to a static player name
}

export enum MatchStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed'
}

export interface Match {
  id: string;
  category: string;
  round: string;
  group?: string;
  p1: string; // Player name or Team name
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
  participants: string[]; // List of player names involved
}

export interface TournamentSettings {
  currentRoundDeadline: Timestamp;
  adminEmails: string[];
}
