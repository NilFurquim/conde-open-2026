import { describe, it, expect } from 'vitest';
import { MatchStatus } from '../../types';
import {
  resolveBracketSlotMatch,
  buildSkeletonMatch,
  getBracketSlotDisplayMatch,
} from '../koSlotResolver';

describe('resolveBracketSlotMatch', () => {
  it('encontra por id do documento', () => {
    const m: Parameters<typeof resolveBracketSlotMatch>[1] = [
      { id: 'A-QF-1', category: 'A', round: 'Quartas', matchNum: 1, p1: 'a', p2: 'b', status: MatchStatus.PENDING, participants: [] },
    ];
    expect(resolveBracketSlotMatch('A-QF-1', m)?.id).toBe('A-QF-1');
  });

  it('resolve por categoria + fase + número quando o id do doc é outro', () => {
    const m = [
      {
        id: 'auto123',
        category: 'A' as const,
        round: 'Quartas',
        matchNum: 1,
        p1: 'x',
        p2: 'y',
        status: MatchStatus.PENDING,
        participants: [],
      },
    ];
    expect(resolveBracketSlotMatch('A-QF-1', m)?.id).toBe('auto123');
  });

  it('aceita categoria duplas em minúsculas', () => {
    const m = [
      {
        id: 'doc1',
        category: 'duplas' as unknown as 'Duplas',
        round: 'Play-in',
        matchNum: 1,
        p1: 'A',
        p2: 'B',
        status: MatchStatus.PENDING,
        participants: [],
      },
    ];
    expect(resolveBracketSlotMatch('D-PI-1', m as never)?.id).toBe('doc1');
  });

  it('emparelha play-in só por ordem quando não há matchNum', () => {
    const mk = (i: number, p1: string) => ({
      id: `id${i}`,
      category: 'Duplas' as const,
      round: 'Play-in',
      matchNum: undefined as unknown as number,
      p1,
      p2: 'x',
      status: MatchStatus.PENDING,
      participants: [],
    });
    const m = [mk(0, 'a'), mk(1, 'b'), mk(2, 'c'), mk(3, 'd'), mk(4, 'e')];
    expect(resolveBracketSlotMatch('D-PI-3', m)?.p1).toBe('c');
  });
});

describe('buildSkeletonMatch / getBracketSlotDisplayMatch', () => {
  it('esqueleto traz placeholders do regulamento', () => {
    const s = buildSkeletonMatch('A-QF-1');
    expect(s.p1).toContain('Grupo');
    expect(s.id).toBe('A-QF-1');
  });

  it('display prefere partida do banco', () => {
    const db = {
      id: 'x',
      category: 'A' as const,
      round: 'Quartas',
      matchNum: 1,
      p1: 'Pedro',
      p2: 'Fernando',
      status: MatchStatus.PENDING,
      participants: [],
    };
    expect(getBracketSlotDisplayMatch('A-QF-1', [db]).p1).toBe('Pedro');
  });

  it('display cai no esqueleto sem banco', () => {
    expect(getBracketSlotDisplayMatch('B-R16-8', []).p2).toContain('Melhor');
  });
});
