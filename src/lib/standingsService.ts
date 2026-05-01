import { Match, MatchStatus, GroupStanding, Category } from '../types';

export const computeGroupStandings = (
  allMatches: Match[],
  players: string[],
  group: string,
  category: Category
): GroupStanding[] => {
  const map = new Map<string, GroupStanding>();
  players.forEach(p => map.set(p, {
    player: p, group, category,
    wins: 0, losses: 0, points: 0,
    setsWon: 0, setsLost: 0,
    gamesWon: 0, gamesLost: 0,
    matchesPlayed: 0,
  }));

  const relevant = allMatches.filter(m =>
    m.category === category &&
    m.group === group &&
    m.round === 'Grupos' &&
    m.status === MatchStatus.COMPLETED &&
    m.winner
  );

  relevant.forEach(m => {
    const p1s = map.get(m.p1);
    const p2s = map.get(m.p2);
    if (!p1s || !p2s) return;

    const s1 = m.score1 || [];
    const s2 = m.score2 || [];
    let p1Sets = 0, p2Sets = 0, p1Games = 0, p2Games = 0;

    for (let i = 0; i < Math.max(s1.length, s2.length); i++) {
      const a = s1[i] ?? 0;
      const b = s2[i] ?? 0;
      if (a > b) p1Sets++; else if (b > a) p2Sets++;
      p1Games += a;
      p2Games += b;
    }

    p1s.matchesPlayed++;
    p2s.matchesPlayed++;
    p1s.setsWon += p1Sets; p1s.setsLost += p2Sets;
    p2s.setsWon += p2Sets; p2s.setsLost += p1Sets;
    p1s.gamesWon += p1Games; p1s.gamesLost += p2Games;
    p2s.gamesWon += p2Games; p2s.gamesLost += p1Games;

    if (m.winner === m.p1) {
      p1s.wins++; p1s.points += 2; p2s.losses++;
    } else {
      p2s.wins++; p2s.points += 2; p1s.losses++;
    }
  });

  return sortStandings(Array.from(map.values()), relevant);
};

const headToHead = (a: GroupStanding, b: GroupStanding, matches: Match[]): number => {
  const h2h = matches.find(m =>
    (m.p1 === a.player && m.p2 === b.player) ||
    (m.p1 === b.player && m.p2 === a.player)
  );
  if (!h2h?.winner) return 0;
  if (h2h.winner === a.player) return -1;
  if (h2h.winner === b.player) return 1;
  return 0;
};

export const sortStandings = (standings: GroupStanding[], matches: Match[] = []): GroupStanding[] => {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Head-to-head when tied on points
    if (a.points === b.points && a.matchesPlayed > 0) {
      const h = headToHead(a, b, matches);
      if (h !== 0) return h;
    }
    // Sets ratio
    const aSetTotal = a.setsWon + a.setsLost;
    const bSetTotal = b.setsWon + b.setsLost;
    const aSetRatio = aSetTotal > 0 ? a.setsWon / aSetTotal : 0;
    const bSetRatio = bSetTotal > 0 ? b.setsWon / bSetTotal : 0;
    if (Math.abs(bSetRatio - aSetRatio) > 0.001) return bSetRatio - aSetRatio;
    // Games ratio
    const aGTotal = a.gamesWon + a.gamesLost;
    const bGTotal = b.gamesWon + b.gamesLost;
    const aGRatio = aGTotal > 0 ? a.gamesWon / aGTotal : 0;
    const bGRatio = bGTotal > 0 ? b.gamesWon / bGTotal : 0;
    return bGRatio - aGRatio;
  });
};

// Returns the top-4 best 3rd place finishers for Cat B oitavas
export const getBestThirds = (
  allGroupStandings: Record<number, GroupStanding[]>
): GroupStanding[] => {
  const thirds: GroupStanding[] = [];
  Object.values(allGroupStandings).forEach(standings => {
    if (standings.length >= 3) thirds.push({ ...standings[2] });
  });
  return sortStandings(thirds).slice(0, 4);
};

// Determine winner of sets
export const determineWinner = (
  p1: string,
  p2: string,
  score1: number[],
  score2: number[]
): string | null => {
  let p1Sets = 0, p2Sets = 0;
  for (let i = 0; i < Math.max(score1.length, score2.length); i++) {
    const a = score1[i] ?? 0;
    const b = score2[i] ?? 0;
    if (a > b) p1Sets++; else if (b > a) p2Sets++;
  }
  if (p1Sets > p2Sets) return p1;
  if (p2Sets > p1Sets) return p2;
  return null;
};
