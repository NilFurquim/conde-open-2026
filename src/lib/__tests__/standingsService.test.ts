import { describe, it, expect } from 'vitest';
import {
  computeGroupStandings,
  sortStandings,
  getBestThirds,
  determineWinner,
} from '../standingsService';
import { Match, MatchStatus, GroupStanding } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMatch(overrides: Partial<Match> & Pick<Match, 'p1' | 'p2' | 'winner'>): Match {
  return {
    id: `${overrides.p1}-${overrides.p2}`,
    category: 'A',
    round: 'Grupos',
    group: '1',
    status: MatchStatus.COMPLETED,
    participants: [overrides.p1, overrides.p2],
    score1: [6, 6],
    score2: [3, 3],
    ...overrides,
  };
}

function makeStanding(player: string, overrides: Partial<GroupStanding> = {}): GroupStanding {
  return {
    player,
    group: '1',
    category: 'A',
    wins: 0,
    losses: 0,
    points: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    matchesPlayed: 0,
    ...overrides,
  };
}

// ── determineWinner ───────────────────────────────────────────────────────────

describe('determineWinner', () => {
  it('returns p1 when p1 wins more sets', () => {
    expect(determineWinner('Alice', 'Bob', [6, 6], [3, 4])).toBe('Alice');
  });

  it('returns p2 when p2 wins more sets', () => {
    expect(determineWinner('Alice', 'Bob', [3, 4], [6, 6])).toBe('Bob');
  });

  it('returns p1 on a 2-1 set victory', () => {
    expect(determineWinner('Alice', 'Bob', [6, 3, 6], [3, 6, 4])).toBe('Alice');
  });

  it('returns p2 on a 2-1 set victory', () => {
    expect(determineWinner('Alice', 'Bob', [3, 6, 4], [6, 3, 6])).toBe('Bob');
  });

  it('returns null when sets are tied (should not happen in practice)', () => {
    expect(determineWinner('Alice', 'Bob', [6, 3], [3, 6])).toBeNull();
  });

  it('handles a single-set match correctly', () => {
    expect(determineWinner('Alice', 'Bob', [7], [5])).toBe('Alice');
  });
});

// ── computeGroupStandings ─────────────────────────────────────────────────────

describe('computeGroupStandings', () => {
  const players = ['Pedro', 'Fernando', 'Amauri', 'Saito'];

  it('returns all players with zero stats when no matches are completed', () => {
    const standings = computeGroupStandings([], players, '1', 'A');
    expect(standings).toHaveLength(4);
    standings.forEach(s => {
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.points).toBe(0);
    });
  });

  it('awards 2 points to winner and 0 to loser', () => {
    const matches = [makeMatch({ p1: 'Pedro', p2: 'Fernando', winner: 'Pedro', score1: [6], score2: [3] })];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    const pedro = standings.find(s => s.player === 'Pedro')!;
    const fernando = standings.find(s => s.player === 'Fernando')!;
    expect(pedro.points).toBe(2);
    expect(pedro.wins).toBe(1);
    expect(fernando.points).toBe(0);
    expect(fernando.losses).toBe(1);
  });

  it('counts sets and games correctly', () => {
    const matches = [
      makeMatch({ p1: 'Pedro', p2: 'Fernando', winner: 'Pedro', score1: [6, 6], score2: [3, 4] }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    const pedro = standings.find(s => s.player === 'Pedro')!;
    const fernando = standings.find(s => s.player === 'Fernando')!;
    expect(pedro.setsWon).toBe(2);
    expect(pedro.setsLost).toBe(0);
    expect(pedro.gamesWon).toBe(12);
    expect(pedro.gamesLost).toBe(7);
    expect(fernando.setsWon).toBe(0);
    expect(fernando.setsLost).toBe(2);
  });

  it('ignores matches from other categories', () => {
    const matches = [
      makeMatch({ p1: 'Pedro', p2: 'Fernando', winner: 'Pedro', category: 'B' }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    const pedro = standings.find(s => s.player === 'Pedro')!;
    expect(pedro.wins).toBe(0);
  });

  it('ignores matches from other groups', () => {
    const matches = [
      makeMatch({ p1: 'Pedro', p2: 'Fernando', winner: 'Pedro', group: '2' }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    const pedro = standings.find(s => s.player === 'Pedro')!;
    expect(pedro.wins).toBe(0);
  });

  it('ignores non-group rounds', () => {
    const matches = [
      makeMatch({ p1: 'Pedro', p2: 'Fernando', winner: 'Pedro', round: 'Quartas' }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    expect(standings.find(s => s.player === 'Pedro')!.wins).toBe(0);
  });

  it('ranks players by points descending', () => {
    // Pedro beats everyone, Fernando beats Amauri and Saito, Amauri beats Saito
    const matches = [
      makeMatch({ p1: 'Pedro',   p2: 'Fernando', winner: 'Pedro',   score1: [6], score2: [3] }),
      makeMatch({ p1: 'Pedro',   p2: 'Amauri',   winner: 'Pedro',   score1: [6], score2: [3] }),
      makeMatch({ p1: 'Pedro',   p2: 'Saito',    winner: 'Pedro',   score1: [6], score2: [3] }),
      makeMatch({ p1: 'Fernando',p2: 'Amauri',   winner: 'Fernando',score1: [6], score2: [3] }),
      makeMatch({ p1: 'Fernando',p2: 'Saito',    winner: 'Fernando',score1: [6], score2: [3] }),
      makeMatch({ p1: 'Amauri',  p2: 'Saito',    winner: 'Amauri',  score1: [6], score2: [3] }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    expect(standings[0].player).toBe('Pedro');     // 6 pts
    expect(standings[1].player).toBe('Fernando');  // 4 pts
    expect(standings[2].player).toBe('Amauri');    // 2 pts
    expect(standings[3].player).toBe('Saito');     // 0 pts
  });

  it('breaks ties by head-to-head', () => {
    // Pedro and Fernando both beat Amauri and Saito (tied on points)
    // But Fernando beat Pedro head-to-head → Fernando ranks 1st
    const matches = [
      makeMatch({ p1: 'Pedro',   p2: 'Fernando', winner: 'Fernando', score1: [3], score2: [6] }),
      makeMatch({ p1: 'Pedro',   p2: 'Amauri',   winner: 'Pedro',    score1: [6], score2: [3] }),
      makeMatch({ p1: 'Pedro',   p2: 'Saito',    winner: 'Pedro',    score1: [6], score2: [3] }),
      makeMatch({ p1: 'Fernando',p2: 'Amauri',   winner: 'Fernando', score1: [6], score2: [3] }),
      makeMatch({ p1: 'Fernando',p2: 'Saito',    winner: 'Fernando', score1: [6], score2: [3] }),
      makeMatch({ p1: 'Amauri',  p2: 'Saito',    winner: 'Amauri',   score1: [6], score2: [3] }),
    ];
    const standings = computeGroupStandings(matches, players, '1', 'A');
    expect(standings[0].player).toBe('Fernando'); // 6 pts + H2H win over Pedro
    expect(standings[1].player).toBe('Pedro');    // 4 pts
  });
});

// ── sortStandings ─────────────────────────────────────────────────────────────

describe('sortStandings', () => {
  it('sorts by points descending', () => {
    const standings = [
      makeStanding('C', { points: 2 }),
      makeStanding('A', { points: 6 }),
      makeStanding('B', { points: 4 }),
    ];
    const sorted = sortStandings(standings);
    expect(sorted.map(s => s.player)).toEqual(['A', 'B', 'C']);
  });

  it('uses sets ratio as secondary tiebreaker when points are equal', () => {
    const standings = [
      makeStanding('X', { points: 2, setsWon: 1, setsLost: 1, matchesPlayed: 1 }),
      makeStanding('Y', { points: 2, setsWon: 2, setsLost: 0, matchesPlayed: 1 }),
    ];
    const sorted = sortStandings(standings);
    expect(sorted[0].player).toBe('Y'); // better sets ratio
  });

  it('uses games ratio as tertiary tiebreaker', () => {
    const standings = [
      makeStanding('X', { points: 2, setsWon: 1, setsLost: 1, gamesWon: 9, gamesLost: 9, matchesPlayed: 1 }),
      makeStanding('Y', { points: 2, setsWon: 1, setsLost: 1, gamesWon: 12, gamesLost: 6, matchesPlayed: 1 }),
    ];
    const sorted = sortStandings(standings);
    expect(sorted[0].player).toBe('Y'); // better games ratio
  });
});

// ── getBestThirds ─────────────────────────────────────────────────────────────

describe('getBestThirds', () => {
  it('returns empty array when no standings have a 3rd place', () => {
    const input = { 1: [makeStanding('A'), makeStanding('B')] };
    expect(getBestThirds(input)).toEqual([]);
  });

  it('picks the 3rd from each group', () => {
    const input = {
      1: [
        makeStanding('A', { points: 6 }),
        makeStanding('B', { points: 4 }),
        makeStanding('C', { points: 2 }),
        makeStanding('D', { points: 0 }),
      ],
      2: [
        makeStanding('E', { points: 6 }),
        makeStanding('F', { points: 4 }),
        makeStanding('G', { points: 2 }),
        makeStanding('H', { points: 0 }),
      ],
    };
    const thirds = getBestThirds(input);
    expect(thirds.map(s => s.player)).toContain('C');
    expect(thirds.map(s => s.player)).toContain('G');
  });

  it('returns at most 4 thirds (for Cat B oitavas)', () => {
    // 6 groups → 6 thirds → we want the best 4
    const input: Record<number, GroupStanding[]> = {};
    for (let g = 1; g <= 6; g++) {
      input[g] = [
        makeStanding(`${g}A`, { points: 6, group: String(g) }),
        makeStanding(`${g}B`, { points: 4, group: String(g) }),
        makeStanding(`${g}C`, { points: g, gamesWon: g * 10, gamesLost: 0, setsWon: g, setsLost: 0, matchesPlayed: 1, group: String(g) }),
        makeStanding(`${g}D`, { points: 0, group: String(g) }),
      ];
    }
    const thirds = getBestThirds(input);
    expect(thirds).toHaveLength(4);
    // The four best thirds should have the highest points (groups 6,5,4,3)
    const thirdPoints = thirds.map(s => s.points);
    expect(Math.min(...thirdPoints)).toBeGreaterThanOrEqual(3);
  });

  it('sorts thirds by points so the best one comes first', () => {
    const input = {
      1: [
        makeStanding('A', { points: 6 }),
        makeStanding('B', { points: 4 }),
        makeStanding('C', { points: 2, gamesWon: 5, gamesLost: 5, setsWon: 1, setsLost: 1, matchesPlayed: 1 }),
      ],
      2: [
        makeStanding('D', { points: 6 }),
        makeStanding('E', { points: 4 }),
        makeStanding('F', { points: 4, gamesWon: 10, gamesLost: 2, setsWon: 2, setsLost: 0, matchesPlayed: 1 }),
      ],
    };
    const thirds = getBestThirds(input);
    expect(thirds[0].player).toBe('F'); // 4 pts > 2 pts
    expect(thirds[1].player).toBe('C');
  });
});
