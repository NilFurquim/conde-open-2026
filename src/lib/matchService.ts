import {
  collection, doc, getDocs, updateDoc, Timestamp,
  arrayUnion, query, where, getDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Match, MatchStatus, MatchEdit, TournamentSettings } from '../types';

export const fetchAllMatches = async (): Promise<Match[]> => {
  const snap = await getDocs(collection(db, 'matches'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Match));
};

export const fetchMatchesByCategory = async (category: string): Promise<Match[]> => {
  const q = query(collection(db, 'matches'), where('category', '==', category));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Match));
};

export const fetchMatchesByPlayer = async (playerName: string): Promise<Match[]> => {
  const q = query(collection(db, 'matches'), where('participants', 'array-contains', playerName));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Match));
};

export const fetchMatchById = async (id: string): Promise<Match | null> => {
  const snap = await getDoc(doc(db, 'matches', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Match;
};

export const scheduleMatch = async (
  matchId: string,
  scheduledAt: Date,
  court: string,
  updatedBy: string
): Promise<void> => {
  const ts = Timestamp.fromDate(scheduledAt);
  const histEntry: MatchEdit = {
    timestamp: Timestamp.now(),
    updatedBy,
    scheduledAt: ts,
    court,
    action: 'schedule',
  };
  await updateDoc(doc(db, 'matches', matchId), {
    scheduledAt: ts,
    court,
    status: MatchStatus.SCHEDULED,
    updatedBy,
    updatedAt: Timestamp.now(),
    history: arrayUnion(histEntry),
  });
};

export const saveResult = async (
  matchId: string,
  score1: number[],
  score2: number[],
  tiebreak1: number | undefined,
  tiebreak2: number | undefined,
  winner: string,
  updatedBy: string
): Promise<void> => {
  const histEntry: MatchEdit = {
    timestamp: Timestamp.now(),
    updatedBy,
    score1,
    score2,
    tiebreak1,
    tiebreak2,
    winner,
    action: 'result',
  };
  const update: Record<string, unknown> = {
    score1,
    score2,
    winner,
    status: MatchStatus.COMPLETED,
    updatedBy,
    updatedAt: Timestamp.now(),
    history: arrayUnion(histEntry),
  };
  if (tiebreak1 !== undefined) update.tiebreak1 = tiebreak1;
  if (tiebreak2 !== undefined) update.tiebreak2 = tiebreak2;
  await updateDoc(doc(db, 'matches', matchId), update);
};

export const setKnockoutParticipants = async (
  matchId: string,
  p1: string,
  p2: string,
  participants: string[],
  updatedBy: string
): Promise<void> => {
  await updateDoc(doc(db, 'matches', matchId), {
    p1,
    p2,
    participants,
    status: MatchStatus.PENDING,
    updatedBy,
    updatedAt: Timestamp.now(),
  });
};

export const fetchSettings = async (): Promise<TournamentSettings> => {
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (!snap.exists()) return {};
  return snap.data() as TournamentSettings;
};

export const saveSettings = async (settings: TournamentSettings): Promise<void> => {
  await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
};

export const fetchPlayerContact = async (name: string): Promise<string | null> => {
  const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const snap = await getDoc(doc(db, 'players', key));
  if (!snap.exists()) return null;
  return snap.data().whatsapp || null;
};

export const savePlayerContact = async (name: string, whatsapp: string): Promise<void> => {
  const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  await setDoc(doc(db, 'players', key), { name, whatsapp }, { merge: true });
};

export const deleteAllMatches = async (): Promise<void> => {
  const snap = await getDocs(collection(db, 'matches'));
  const ids = snap.docs.map(d => d.id);
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    ids.slice(i, i + 400).forEach(id => batch.delete(doc(db, 'matches', id)));
    await batch.commit();
  }
};

export const isDeadlinePassed = (
  match: Match,
  settings: TournamentSettings,
  isAdmin: boolean
): boolean => {
  if (isAdmin) return false;
  const key = `${match.category}-${match.round}`;
  const deadline = settings.roundDeadlines?.[key];
  if (!deadline) return false;
  return new Date() > deadline.toDate();
};
