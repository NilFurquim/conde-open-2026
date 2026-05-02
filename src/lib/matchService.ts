import {
  collection, doc, getDocs, updateDoc, deleteField, Timestamp,
  arrayUnion, query, where, getDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Match, MatchStatus, MatchEdit, TournamentSettings, Category } from '../types';
import { KO_PROPAGATION, getParticipantsFromName } from './bracketMap';
import {
  computeGroupStandings, getBestThirds,
} from './standingsService';
import {
  CATEGORY_A_GROUPS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS,
} from '../constants/tournamentData';

// ─── Fetch helpers ────────────────────────────────────────────────────────────

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

// ─── Scheduling ───────────────────────────────────────────────────────────────

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

// ─── KO propagation ──────────────────────────────────────────────────────────

/**
 * After a KO match is completed, writes the winner into the correct slot
 * (p1 or p2) of the next match, updating participants accordingly.
 * If the next match already had a result it is reset to PENDING so
 * the affected players can re-enter their score.
 */
const propagateKOWinner = async (
  matchId: string,
  winner: string,
  updatedBy: string
): Promise<void> => {
  const rule = KO_PROPAGATION[matchId];
  if (!rule) return; // Final or unknown — nothing to propagate

  const nextMatch = await fetchMatchById(rule.nextMatchId);
  if (!nextMatch) return;

  // Build new participants: keep the other slot's players, add winner's players
  const otherSlotName = rule.slot === 'p1' ? nextMatch.p2 : nextMatch.p1;
  const otherParticipants = getParticipantsFromName(otherSlotName).filter(
    p => !p.includes('º') && !p.startsWith('Venc.') && !p.startsWith('Melhor')
  );
  const winnerParticipants = getParticipantsFromName(winner);
  const newParticipants = [...new Set([...otherParticipants, ...winnerParticipants])];

  const wasCompleted = nextMatch.status === MatchStatus.COMPLETED;

  await updateDoc(doc(db, 'matches', rule.nextMatchId), {
    [rule.slot]: winner,
    participants: newParticipants,
    // If the next match had a result, reset it — score is now invalid
    ...(wasCompleted ? {
      status: MatchStatus.PENDING,
      score1: deleteField(),
      score2: deleteField(),
      tiebreak1: deleteField(),
      tiebreak2: deleteField(),
      winner: deleteField(),
    } : {}),
    updatedBy,
    updatedAt: Timestamp.now(),
  });

  // If the next match was completed and had a winner, cascade one more level
  // so the slot after it is also cleared (its participants would be wrong)
  if (wasCompleted && nextMatch.winner) {
    const downstreamRule = KO_PROPAGATION[rule.nextMatchId];
    if (downstreamRule) {
      const downstream = await fetchMatchById(downstreamRule.nextMatchId);
      if (downstream && downstream.status === MatchStatus.COMPLETED) {
        await updateDoc(doc(db, 'matches', downstreamRule.nextMatchId), {
          status: MatchStatus.PENDING,
          score1: deleteField(),
          score2: deleteField(),
          tiebreak1: deleteField(),
          tiebreak2: deleteField(),
          winner: deleteField(),
          updatedBy,
          updatedAt: Timestamp.now(),
        });
      }
    }
  }
};

// ─── Group stage auto-advance ─────────────────────────────────────────────────

/**
 * Called after every group-stage match result is saved.
 * If ALL group matches for the category are COMPLETED, automatically fills
 * the first knockout round with the computed standings.
 */
const checkAndAdvanceGroupStage = async (
  category: Category,
  updatedBy: string
): Promise<void> => {
  const allCatMatches = await fetchMatchesByCategory(category);
  const groupMatches = allCatMatches.filter(m => m.round === 'Grupos');

  // Not all group matches completed yet — nothing to do
  if (groupMatches.length === 0 || groupMatches.some(m => m.status !== MatchStatus.COMPLETED)) return;

  if (category === 'A') {
    const standings: Record<number, ReturnType<typeof computeGroupStandings>> = {};
    Object.entries(CATEGORY_A_GROUPS).forEach(([g, players]) => {
      standings[Number(g)] = computeGroupStandings(allCatMatches, players, g, 'A');
    });
    const updates = [
      { id: 'A-QF-1', p1: standings[1][0].player, p2: standings[2][1].player },
      { id: 'A-QF-2', p1: standings[2][0].player, p2: standings[1][1].player },
      { id: 'A-QF-3', p1: standings[3][0].player, p2: standings[4][1].player },
      { id: 'A-QF-4', p1: standings[4][0].player, p2: standings[3][1].player },
    ];
    for (const u of updates) {
      await setKnockoutParticipants(u.id, u.p1, u.p2, [u.p1, u.p2], updatedBy);
    }
  }

  if (category === 'B') {
    const standings: Record<number, ReturnType<typeof computeGroupStandings>> = {};
    Object.entries(CATEGORY_B_GROUPS).forEach(([g, players]) => {
      standings[Number(g)] = computeGroupStandings(allCatMatches, players, g, 'B');
    });
    const thirds = getBestThirds(standings);
    const t = (i: number) => thirds[i]?.player ?? `Melhor 3º #${i + 1}`;
    const g = (n: number, pos: number) => standings[n]?.[pos]?.player ?? `${pos + 1}º G${n}`;
    const updates = [
      { id: 'B-R16-1', p1: g(1, 0), p2: t(1) },
      { id: 'B-R16-2', p1: g(2, 0), p2: g(5, 1) },
      { id: 'B-R16-3', p1: g(3, 0), p2: t(2) },
      { id: 'B-R16-4', p1: g(4, 0), p2: g(1, 1) },
      { id: 'B-R16-5', p1: g(5, 0), p2: g(6, 1) },
      { id: 'B-R16-6', p1: g(6, 0), p2: t(0) },
      { id: 'B-R16-7', p1: g(3, 1), p2: g(2, 1) },
      { id: 'B-R16-8', p1: g(4, 1), p2: t(3) },
    ];
    for (const u of updates) {
      await setKnockoutParticipants(u.id, u.p1, u.p2, [u.p1, u.p2], updatedBy);
    }
  }

  if (category === 'C') {
    const s1 = computeGroupStandings(allCatMatches, CATEGORY_C_GROUPS[1], '1', 'C');
    const s2 = computeGroupStandings(allCatMatches, CATEGORY_C_GROUPS[2], '2', 'C');
    const updates = [
      { id: 'C-SF-1', p1: s1[0].player, p2: s2[1].player },
      { id: 'C-SF-2', p1: s2[0].player, p2: s1[1].player },
    ];
    for (const u of updates) {
      await setKnockoutParticipants(u.id, u.p1, u.p2, [u.p1, u.p2], updatedBy);
    }
  }
  // Duplas has no group stage — handled entirely by KO_PROPAGATION
};

// ─── Knockout participant setter ──────────────────────────────────────────────

/**
 * Sets the two participants of a KO match. If the match already has a result
 * it is reset to PENDING so the new participants play fresh.
 */
export const setKnockoutParticipants = async (
  matchId: string,
  p1: string,
  p2: string,
  participants: string[],
  updatedBy: string
): Promise<void> => {
  const current = await fetchMatchById(matchId);
  const wasCompleted = current?.status === MatchStatus.COMPLETED;

  await updateDoc(doc(db, 'matches', matchId), {
    p1,
    p2,
    participants,
    status: MatchStatus.PENDING,
    updatedBy,
    updatedAt: Timestamp.now(),
    ...(wasCompleted ? {
      score1: deleteField(),
      score2: deleteField(),
      tiebreak1: deleteField(),
      tiebreak2: deleteField(),
      winner: deleteField(),
    } : {}),
  });
};

// ─── Result saving ────────────────────────────────────────────────────────────

/**
 * Saves (or overwrites) a match result, then automatically:
 * - Propagates the winner to the next KO slot, or
 * - Re-computes group standings and fills the first KO round if all
 *   group matches in the category are now complete.
 */
export const saveResult = async (
  matchId: string,
  category: Category,
  round: string,
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

  // Auto-advance bracket
  if (round === 'Grupos') {
    await checkAndAdvanceGroupStage(category, updatedBy);
  } else if (round === 'Play-in') {
    // Play-in uses the same KO propagation as other KO rounds
    await propagateKOWinner(matchId, winner, updatedBy);
  } else {
    await propagateKOWinner(matchId, winner, updatedBy);
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const fetchSettings = async (): Promise<TournamentSettings> => {
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (!snap.exists()) return {};
  return snap.data() as TournamentSettings;
};

export const saveSettings = async (settings: TournamentSettings): Promise<void> => {
  await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
};

// ─── Player contact ───────────────────────────────────────────────────────────

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

// ─── Database management ──────────────────────────────────────────────────────

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
