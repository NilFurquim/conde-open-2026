import { describe, it, expect } from 'vitest';
import { Match, MatchStatus } from '../../types';
import {
  matchCountsForStats,
  computeEntityStats,
  computeCategoryLeaderboard,
} from '../playerStatsService';

const baseMatch = (over: Partial<Match>): Match => ({
  id: 'm1',
  category: 'A',
  round: 'Grupos',
  group: '1',
  p1: 'Alice',
  p2: 'Bob',
  status: MatchStatus.COMPLETED,
  participants: ['Alice', 'Bob'],
  ...over,
} as Match);

describe('matchCountsForStats', () => {
  it('returns false for TBD sides', () => {
    expect(
      matchCountsForStats(
        baseMatch({ p2: 'Venc. QF-1', winner: 'Alice', score1: [6], score2: [4] }),
      ),
    ).toBe(false);
  });

  it('returns true when completed with scores and winner', () => {
    expect(
      matchCountsForStats(
        baseMatch({ winner: 'Alice', score1: [6, 4], score2: [3, 6] }),
      ),
    ).toBe(true);
  });
});

describe('computeEntityStats', () => {
  it('aggregates wins and sets for one player', () => {
    const matches: Match[] = [
      baseMatch({
        id: 'a',
        winner: 'Alice',
        score1: [6, 6],
        score2: [2, 3],
      }),
      baseMatch({
        id: 'b',
        p1: 'Bob',
        p2: 'Alice',
        winner: 'Alice',
        score1: [2, 2],
        score2: [6, 6],
      }),
    ];
    const s = computeEntityStats(matches, 'A', 'Alice');
    expect(s.matchesPlayed).toBe(2);
    expect(s.wins).toBe(2);
    expect(s.losses).toBe(0);
    expect(s.setsWon).toBe(4);
    expect(s.gamesWon).toBeGreaterThan(10);
  });
});

describe('computeCategoryLeaderboard', () => {
  it('sorts by wins', () => {
    const matches: Match[] = [
      baseMatch({
        id: 'x',
        p1: 'Pedro',
        p2: 'Fernando',
        winner: 'Pedro',
        score1: [4, 4, 10],
        score2: [4, 4, 8],
        participants: ['Pedro', 'Fernando'],
      }),
    ];
    const board = computeCategoryLeaderboard(matches, 'A');
    const pedro = board.find(r => r.entityLabel === 'Pedro');
    const fernando = board.find(r => r.entityLabel === 'Fernando');
    expect(pedro?.wins).toBe(1);
    expect(fernando?.losses).toBe(1);
    expect(board[0].wins).toBeGreaterThanOrEqual(board[board.length - 1].wins);
  });
});
