/**
 * Tests for matchService.ts
 *
 * Strategy: mock firebase/firestore at the module level so no real network
 * calls are made. We capture every updateDoc / getDoc call and assert that
 * saveResult triggers the correct cascade of writes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

// ── Firestore mock ────────────────────────────────────────────────────────────

// In-memory store: matchId → document data
let firestoreStore: Record<string, Record<string, unknown>> = {};

// Track calls for assertion
const updateDocCalls: Array<{ id: string; data: Record<string, unknown> }> = [];

vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db: unknown, name: string) => ({ _col: name })),
    doc: vi.fn((_db: unknown, col: string, id: string) => ({ _col: col, _id: id })),
    getDoc: vi.fn(async (ref: { _col: string; _id: string }) => {
      const data = firestoreStore[ref._id];
      return {
        exists: () => Boolean(data),
        id: ref._id,
        data: () => data,
      };
    }),
    getDocs: vi.fn(async (query: { _col: string; _cat?: string }) => {
      const docs = Object.entries(firestoreStore)
        .filter(([, d]) => !query._cat || d['category'] === query._cat)
        .map(([id, data]) => ({ id, data: () => data, exists: () => true }));
      return { docs };
    }),
    query: vi.fn((_col: unknown, ..._args: unknown[]) => {
      // capture category filter for getDocs mock
      const whereArg = _args.find((a: unknown) => typeof a === 'object' && a !== null && '_cat' in (a as object)) as { _cat: string } | undefined;
      return { _col: (_col as { _col: string })._col, _cat: whereArg?._cat };
    }),
    where: vi.fn((_field: string, _op: string, value: unknown) => ({ _cat: value })),
    updateDoc: vi.fn(async (ref: { _col: string; _id: string }, data: Record<string, unknown>) => {
      updateDocCalls.push({ id: ref._id, data });
      firestoreStore[ref._id] = { ...(firestoreStore[ref._id] || {}), ...data };
    }),
    setDoc: vi.fn(),
    writeBatch: vi.fn(),
    arrayUnion: vi.fn((...items: unknown[]) => items),
    deleteField: vi.fn(() => undefined),
    Timestamp: actual.Timestamp,
  };
});

// Import AFTER mocking
const { saveResult, setKnockoutParticipants } = await import('../matchService');
import { MatchStatus } from '../../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    category: 'A',
    round: 'Quartas',
    p1: 'PlayerOne',
    p2: 'PlayerTwo',
    status: MatchStatus.PENDING,
    participants: ['PlayerOne', 'PlayerTwo'],
    ...overrides,
  };
}

// ── saveResult: KO propagation ────────────────────────────────────────────────

describe('saveResult – KO propagation', () => {
  beforeEach(() => {
    firestoreStore = {};
    updateDocCalls.length = 0;
  });

  it('writes result to the current match', async () => {
    firestoreStore['A-QF-1'] = makeDoc('A-QF-1', { category: 'A', round: 'Quartas' });
    firestoreStore['A-SF-1'] = makeDoc('A-SF-1', {
      category: 'A', round: 'Semifinais',
      p1: '1º Grupo 1', p2: '1º Grupo 2', participants: [],
    });

    await saveResult('A-QF-1', 'A', 'Quartas', [6, 6], [3, 4], undefined, undefined, 'PlayerOne', 'TestUser');

    const resultCall = updateDocCalls.find(c => c.id === 'A-QF-1');
    expect(resultCall).toBeDefined();
    expect(resultCall!.data.winner).toBe('PlayerOne');
    expect(resultCall!.data.status).toBe(MatchStatus.COMPLETED);
  });

  it('propagates winner to the next KO match slot', async () => {
    firestoreStore['A-QF-1'] = makeDoc('A-QF-1', { category: 'A', round: 'Quartas' });
    firestoreStore['A-SF-1'] = makeDoc('A-SF-1', {
      category: 'A', round: 'Semifinais',
      p1: 'Venc. QF-1', p2: 'Venc. QF-2', participants: [],
    });

    await saveResult('A-QF-1', 'A', 'Quartas', [6, 6], [3, 4], undefined, undefined, 'PlayerOne', 'TestUser');

    const propagateCall = updateDocCalls.find(c => c.id === 'A-SF-1');
    expect(propagateCall).toBeDefined();
    expect(propagateCall!.data['p1']).toBe('PlayerOne');
    expect((propagateCall!.data['participants'] as string[])).toContain('PlayerOne');
  });

  it('does not propagate when match has no entry in KO_PROPAGATION (final)', async () => {
    firestoreStore['A-F'] = makeDoc('A-F', { category: 'A', round: 'Final' });
    updateDocCalls.length = 0;

    await saveResult('A-F', 'A', 'Final', [6], [3], undefined, undefined, 'PlayerOne', 'TestUser');

    // Only the result write itself — no propagation update
    const otherCalls = updateDocCalls.filter(c => c.id !== 'A-F');
    expect(otherCalls).toHaveLength(0);
  });

  it('resets the next match to PENDING when it was already COMPLETED', async () => {
    firestoreStore['A-QF-1'] = makeDoc('A-QF-1', { category: 'A', round: 'Quartas' });
    // Next match already has a result
    firestoreStore['A-SF-1'] = makeDoc('A-SF-1', {
      category: 'A', round: 'Semifinais',
      p1: 'OldWinner', p2: 'Venc. QF-2',
      status: MatchStatus.COMPLETED,
      winner: 'OldWinner',
      score1: [6], score2: [3],
      participants: ['OldWinner'],
    });

    await saveResult('A-QF-1', 'A', 'Quartas', [6, 6], [3, 4], undefined, undefined, 'PlayerOne', 'TestUser');

    const resetCall = updateDocCalls.find(c => c.id === 'A-SF-1');
    expect(resetCall).toBeDefined();
    expect(resetCall!.data['status']).toBe(MatchStatus.PENDING);
  });
});

// ── saveResult: group stage auto-advance ──────────────────────────────────────

describe('saveResult – group stage auto-advance (Cat C, simplest case)', () => {
  beforeEach(() => {
    firestoreStore = {};
    updateDocCalls.length = 0;
  });

  it('fills C-SF-1 and C-SF-2 when the last Cat C group match is saved', async () => {
    // Cat C group players
    const g1 = ['João Pedro', 'Eduardo', 'Nil', 'Junior'];
    const g2 = ['Marcos', 'Rodrigo', 'Dudu', 'Alexandre'];

    // Pre-seed: all group matches completed except one
    const completedMatchId = 'C-G1-0-1';
    let matchNum = 0;
    for (let i = 0; i < g1.length; i++) {
      for (let j = i + 1; j < g1.length; j++) {
        const id = `C-G1-${i}-${j}`;
        const winner = g1[i]; // first player always wins
        firestoreStore[id] = {
          id,
          category: 'C',
          round: 'Grupos',
          group: '1',
          status: id === completedMatchId ? MatchStatus.PENDING : MatchStatus.COMPLETED,
          p1: g1[i],
          p2: g1[j],
          winner: id === completedMatchId ? undefined : winner,
          score1: [6],
          score2: [3],
          participants: [g1[i], g1[j]],
        };
        matchNum++;
      }
    }
    for (let i = 0; i < g2.length; i++) {
      for (let j = i + 1; j < g2.length; j++) {
        const id = `C-G2-${i}-${j}`;
        const winner = g2[i];
        firestoreStore[id] = {
          id,
          category: 'C',
          round: 'Grupos',
          group: '2',
          status: MatchStatus.COMPLETED,
          p1: g2[i],
          p2: g2[j],
          winner,
          score1: [6],
          score2: [3],
          participants: [g2[i], g2[j]],
        };
      }
    }

    // Seed the KO stubs
    firestoreStore['C-SF-1'] = { id: 'C-SF-1', category: 'C', round: 'Semifinais', p1: '1º Grupo 1', p2: '2º Grupo 2', status: MatchStatus.PENDING, participants: [] };
    firestoreStore['C-SF-2'] = { id: 'C-SF-2', category: 'C', round: 'Semifinais', p1: '1º Grupo 2', p2: '2º Grupo 1', status: MatchStatus.PENDING, participants: [] };
    firestoreStore['C-F']    = { id: 'C-F',    category: 'C', round: 'Final',     p1: 'Venc. SF-1', p2: 'Venc. SF-2', status: MatchStatus.PENDING, participants: [] };

    // Save the last pending group match — this should trigger auto-advance
    await saveResult(
      completedMatchId, 'C', 'Grupos',
      [6], [3],
      undefined, undefined,
      'João Pedro',
      'TestUser'
    );

    const sf1Call = updateDocCalls.find(c => c.id === 'C-SF-1');
    const sf2Call = updateDocCalls.find(c => c.id === 'C-SF-2');

    expect(sf1Call).toBeDefined();
    expect(sf2Call).toBeDefined();
    // Both semi slots should now have real player names (not placeholders)
    expect(sf1Call!.data['p1']).not.toContain('º');
    expect(sf2Call!.data['p1']).not.toContain('º');
  });
});

// ── setKnockoutParticipants ───────────────────────────────────────────────────

describe('setKnockoutParticipants', () => {
  beforeEach(() => {
    firestoreStore = {};
    updateDocCalls.length = 0;
  });

  it('sets p1, p2, participants and status PENDING', async () => {
    firestoreStore['A-QF-1'] = makeDoc('A-QF-1', { status: MatchStatus.PENDING });

    await setKnockoutParticipants('A-QF-1', 'Alice', 'Bob', ['Alice', 'Bob'], 'Admin');

    const call = updateDocCalls.find(c => c.id === 'A-QF-1');
    expect(call!.data['p1']).toBe('Alice');
    expect(call!.data['p2']).toBe('Bob');
    expect(call!.data['participants']).toEqual(['Alice', 'Bob']);
    expect(call!.data['status']).toBe(MatchStatus.PENDING);
  });

  it('clears score and winner when overwriting a completed match', async () => {
    firestoreStore['A-QF-1'] = makeDoc('A-QF-1', {
      status: MatchStatus.COMPLETED,
      winner: 'OldPlayer',
      score1: [6],
      score2: [3],
    });

    await setKnockoutParticipants('A-QF-1', 'Alice', 'Bob', ['Alice', 'Bob'], 'Admin');

    const call = updateDocCalls.find(c => c.id === 'A-QF-1');
    expect(call).toBeDefined();
    // deleteField() returns undefined in our mock
    expect(call!.data['winner']).toBeUndefined();
    expect(call!.data['score1']).toBeUndefined();
    expect(call!.data['score2']).toBeUndefined();
  });
});

// ── Duplas play-in propagation ────────────────────────────────────────────────

describe('saveResult – Duplas play-in propagation', () => {
  beforeEach(() => {
    firestoreStore = {};
    updateDocCalls.length = 0;
  });

  it('D-PI-1 winner is written to D-QF-1 as p2 (Amauri/Guto hold p1 BYE)', async () => {
    firestoreStore['D-PI-1'] = makeDoc('D-PI-1', {
      category: 'Duplas', round: 'Play-in',
      p1: 'Pedro / Carla', p2: 'Igor / Fortes',
      participants: ['Pedro', 'Carla', 'Igor', 'Fortes'],
    });
    firestoreStore['D-QF-1'] = makeDoc('D-QF-1', {
      category: 'Duplas', round: 'Quartas',
      p1: 'Amauri / Guto', p2: 'Venc. PI-1',
      participants: ['Amauri', 'Guto'],
      status: MatchStatus.PENDING,
    });

    await saveResult(
      'D-PI-1', 'Duplas', 'Play-in',
      [6], [3],
      undefined, undefined,
      'Pedro / Carla',
      'TestUser'
    );

    const qfCall = updateDocCalls.find(c => c.id === 'D-QF-1');
    expect(qfCall).toBeDefined();
    expect(qfCall!.data['p2']).toBe('Pedro / Carla');
    const participants = qfCall!.data['participants'] as string[];
    expect(participants).toContain('Pedro');
    expect(participants).toContain('Carla');
    expect(participants).toContain('Amauri');
    expect(participants).toContain('Guto');
  });
});
