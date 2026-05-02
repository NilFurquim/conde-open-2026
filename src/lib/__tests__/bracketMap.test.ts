import { describe, it, expect } from 'vitest';
import { KO_PROPAGATION, getParticipantsFromName } from '../bracketMap';

// All match IDs that exist in the tournament (KO only)
const ALL_KO_IDS = new Set([
  // Cat A
  'A-QF-1', 'A-QF-2', 'A-QF-3', 'A-QF-4',
  'A-SF-1', 'A-SF-2',
  'A-F',
  // Cat B
  'B-R16-1', 'B-R16-2', 'B-R16-3', 'B-R16-4',
  'B-R16-5', 'B-R16-6', 'B-R16-7', 'B-R16-8',
  'B-QF-1', 'B-QF-2', 'B-QF-3', 'B-QF-4',
  'B-SF-1', 'B-SF-2',
  'B-F',
  // Cat C
  'C-SF-1', 'C-SF-2',
  'C-F',
  // Duplas
  'D-PI-1', 'D-PI-2', 'D-PI-3', 'D-PI-4', 'D-PI-5',
  'D-QF-1', 'D-QF-2', 'D-QF-3', 'D-QF-4',
  'D-SF-1', 'D-SF-2',
  'D-F',
]);

// Finals should NOT be in the propagation map (no next match)
const FINALS = new Set(['A-F', 'B-F', 'C-F', 'D-F']);

describe('KO_PROPAGATION map', () => {
  it('all source match IDs belong to the known tournament match list', () => {
    for (const id of Object.keys(KO_PROPAGATION)) {
      expect(ALL_KO_IDS.has(id), `Source "${id}" not in tournament`).toBe(true);
    }
  });

  it('all nextMatchId values belong to the known tournament match list', () => {
    for (const { nextMatchId } of Object.values(KO_PROPAGATION)) {
      expect(ALL_KO_IDS.has(nextMatchId), `Target "${nextMatchId}" not in tournament`).toBe(true);
    }
  });

  it('finals are not in the propagation map', () => {
    for (const finalId of FINALS) {
      expect(KO_PROPAGATION).not.toHaveProperty(finalId);
    }
  });

  it('each nextMatchId receives exactly one p1 and one p2 entry (BYE slots excluded)', () => {
    // D-QF-1, D-QF-3, D-QF-4 have their p1 pre-filled with BYE teams
    // (Amauri/Guto, Alex/Evandro, Saito/Fernando) — no propagation entry needed for p1
    const BYE_P1_MATCHES = new Set(['D-QF-1', 'D-QF-3', 'D-QF-4']);

    const slotCount: Record<string, { p1: number; p2: number }> = {};
    for (const { nextMatchId, slot } of Object.values(KO_PROPAGATION)) {
      if (!slotCount[nextMatchId]) slotCount[nextMatchId] = { p1: 0, p2: 0 };
      slotCount[nextMatchId][slot]++;
    }
    for (const [id, counts] of Object.entries(slotCount)) {
      if (BYE_P1_MATCHES.has(id)) {
        expect(counts.p1, `${id} p1 (BYE) should have 0 propagation entries`).toBe(0);
        expect(counts.p2, `${id} p2 count`).toBe(1);
      } else {
        expect(counts.p1, `${id} p1 count`).toBe(1);
        expect(counts.p2, `${id} p2 count`).toBe(1);
      }
    }
  });

  // ── Cat A propagation chain ─────────────────────────────────────────────
  describe('Cat A chain', () => {
    it('A-QF-1 winner goes to A-SF-1 as p1', () => {
      expect(KO_PROPAGATION['A-QF-1']).toEqual({ nextMatchId: 'A-SF-1', slot: 'p1' });
    });
    it('A-QF-2 winner goes to A-SF-1 as p2', () => {
      expect(KO_PROPAGATION['A-QF-2']).toEqual({ nextMatchId: 'A-SF-1', slot: 'p2' });
    });
    it('A-QF-3 winner goes to A-SF-2 as p1', () => {
      expect(KO_PROPAGATION['A-QF-3']).toEqual({ nextMatchId: 'A-SF-2', slot: 'p1' });
    });
    it('A-QF-4 winner goes to A-SF-2 as p2', () => {
      expect(KO_PROPAGATION['A-QF-4']).toEqual({ nextMatchId: 'A-SF-2', slot: 'p2' });
    });
    it('A-SF-1 winner goes to A-F as p1', () => {
      expect(KO_PROPAGATION['A-SF-1']).toEqual({ nextMatchId: 'A-F', slot: 'p1' });
    });
    it('A-SF-2 winner goes to A-F as p2', () => {
      expect(KO_PROPAGATION['A-SF-2']).toEqual({ nextMatchId: 'A-F', slot: 'p2' });
    });
  });

  // ── Cat B oitavas → quartas (spec: J9=W(J1)vW(J8), J10=W(J2)vW(J7), etc.)
  describe('Cat B R16 → QF cross mapping', () => {
    it('J1 winner (B-R16-1) and J8 winner (B-R16-8) meet in B-QF-1', () => {
      expect(KO_PROPAGATION['B-R16-1']).toEqual({ nextMatchId: 'B-QF-1', slot: 'p1' });
      expect(KO_PROPAGATION['B-R16-8']).toEqual({ nextMatchId: 'B-QF-1', slot: 'p2' });
    });
    it('J2 winner (B-R16-2) and J7 winner (B-R16-7) meet in B-QF-2', () => {
      expect(KO_PROPAGATION['B-R16-2']).toEqual({ nextMatchId: 'B-QF-2', slot: 'p1' });
      expect(KO_PROPAGATION['B-R16-7']).toEqual({ nextMatchId: 'B-QF-2', slot: 'p2' });
    });
    it('J3 winner (B-R16-3) and J6 winner (B-R16-6) meet in B-QF-3', () => {
      expect(KO_PROPAGATION['B-R16-3']).toEqual({ nextMatchId: 'B-QF-3', slot: 'p1' });
      expect(KO_PROPAGATION['B-R16-6']).toEqual({ nextMatchId: 'B-QF-3', slot: 'p2' });
    });
    it('J4 winner (B-R16-4) and J5 winner (B-R16-5) meet in B-QF-4', () => {
      expect(KO_PROPAGATION['B-R16-4']).toEqual({ nextMatchId: 'B-QF-4', slot: 'p1' });
      expect(KO_PROPAGATION['B-R16-5']).toEqual({ nextMatchId: 'B-QF-4', slot: 'p2' });
    });
  });

  describe('Cat B QF → SF (spec: J13=W(J9)vW(J12), J14=W(J10)vW(J11))', () => {
    it('B-QF-1 and B-QF-4 meet in B-SF-1', () => {
      expect(KO_PROPAGATION['B-QF-1']).toEqual({ nextMatchId: 'B-SF-1', slot: 'p1' });
      expect(KO_PROPAGATION['B-QF-4']).toEqual({ nextMatchId: 'B-SF-1', slot: 'p2' });
    });
    it('B-QF-2 and B-QF-3 meet in B-SF-2', () => {
      expect(KO_PROPAGATION['B-QF-2']).toEqual({ nextMatchId: 'B-SF-2', slot: 'p1' });
      expect(KO_PROPAGATION['B-QF-3']).toEqual({ nextMatchId: 'B-SF-2', slot: 'p2' });
    });
  });

  // ── Duplas Play-in → QF (BYE slots are p1; play-in winners go to p2)
  describe('Duplas Play-in → QF mapping', () => {
    it('D-PI-1 winner goes to D-QF-1 as p2 (Amauri/Guto have BYE as p1)', () => {
      expect(KO_PROPAGATION['D-PI-1']).toEqual({ nextMatchId: 'D-QF-1', slot: 'p2' });
    });
    it('D-PI-2 and D-PI-3 winners meet each other in D-QF-2', () => {
      expect(KO_PROPAGATION['D-PI-2']).toEqual({ nextMatchId: 'D-QF-2', slot: 'p1' });
      expect(KO_PROPAGATION['D-PI-3']).toEqual({ nextMatchId: 'D-QF-2', slot: 'p2' });
    });
    it('D-PI-4 winner goes to D-QF-3 as p2 (Alex/Evandro have BYE as p1)', () => {
      expect(KO_PROPAGATION['D-PI-4']).toEqual({ nextMatchId: 'D-QF-3', slot: 'p2' });
    });
    it('D-PI-5 winner goes to D-QF-4 as p2 (Saito/Fernando have BYE as p1)', () => {
      expect(KO_PROPAGATION['D-PI-5']).toEqual({ nextMatchId: 'D-QF-4', slot: 'p2' });
    });
  });
});

// ── getParticipantsFromName ───────────────────────────────────────────────────
describe('getParticipantsFromName', () => {
  it('returns single-element array for a singles player', () => {
    expect(getParticipantsFromName('Pedro')).toEqual(['Pedro']);
  });

  it('splits a doubles team name into two players', () => {
    expect(getParticipantsFromName('Pedro / Carla')).toEqual(['Pedro', 'Carla']);
  });

  it('trims spaces around the separator', () => {
    expect(getParticipantsFromName('Amauri / Guto')).toEqual(['Amauri', 'Guto']);
  });

  it('handles three-word player names without splitting', () => {
    expect(getParticipantsFromName('João Pedro')).toEqual(['João Pedro']);
  });

  it('handles double with multi-word names', () => {
    expect(getParticipantsFromName('Gustavo / João Pedro')).toEqual(['Gustavo', 'João Pedro']);
  });
});
