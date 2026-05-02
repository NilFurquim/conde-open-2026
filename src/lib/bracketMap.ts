/**
 * Static propagation map for the knockout bracket.
 * For each match ID that can have a winner, defines which match slot
 * receives that winner.
 *
 * Cat A  : QF(1-4) → SF(1-2) → F
 * Cat B  : R16(1-8) → QF(1-4) → SF(1-2) → F
 * Cat C  : SF(1-2) → F
 * Duplas : PI(1-5) → QF(1-4) → SF(1-2) → F
 */
export const KO_PROPAGATION: Record<string, { nextMatchId: string; slot: 'p1' | 'p2' }> = {
  // ── Cat A ──────────────────────────────────────────────────────────────────
  // Quartas → Semifinais
  'A-QF-1': { nextMatchId: 'A-SF-1', slot: 'p1' },
  'A-QF-2': { nextMatchId: 'A-SF-1', slot: 'p2' },
  'A-QF-3': { nextMatchId: 'A-SF-2', slot: 'p1' },
  'A-QF-4': { nextMatchId: 'A-SF-2', slot: 'p2' },
  // Semifinais → Final
  'A-SF-1': { nextMatchId: 'A-F', slot: 'p1' },
  'A-SF-2': { nextMatchId: 'A-F', slot: 'p2' },

  // ── Cat B ──────────────────────────────────────────────────────────────────
  // Oitavas → Quartas
  // J9  = B-QF-1 : W(J1) vs W(J8)
  'B-R16-1': { nextMatchId: 'B-QF-1', slot: 'p1' },
  'B-R16-8': { nextMatchId: 'B-QF-1', slot: 'p2' },
  // J10 = B-QF-2 : W(J2) vs W(J7)
  'B-R16-2': { nextMatchId: 'B-QF-2', slot: 'p1' },
  'B-R16-7': { nextMatchId: 'B-QF-2', slot: 'p2' },
  // J11 = B-QF-3 : W(J3) vs W(J6)
  'B-R16-3': { nextMatchId: 'B-QF-3', slot: 'p1' },
  'B-R16-6': { nextMatchId: 'B-QF-3', slot: 'p2' },
  // J12 = B-QF-4 : W(J4) vs W(J5)
  'B-R16-4': { nextMatchId: 'B-QF-4', slot: 'p1' },
  'B-R16-5': { nextMatchId: 'B-QF-4', slot: 'p2' },
  // Quartas → Semifinais
  // J13 = B-SF-1 : W(J9) vs W(J12)
  'B-QF-1': { nextMatchId: 'B-SF-1', slot: 'p1' },
  'B-QF-4': { nextMatchId: 'B-SF-1', slot: 'p2' },
  // J14 = B-SF-2 : W(J10) vs W(J11)
  'B-QF-2': { nextMatchId: 'B-SF-2', slot: 'p1' },
  'B-QF-3': { nextMatchId: 'B-SF-2', slot: 'p2' },
  // Semifinais → Final
  'B-SF-1': { nextMatchId: 'B-F', slot: 'p1' },
  'B-SF-2': { nextMatchId: 'B-F', slot: 'p2' },

  // ── Cat C ──────────────────────────────────────────────────────────────────
  'C-SF-1': { nextMatchId: 'C-F', slot: 'p1' },
  'C-SF-2': { nextMatchId: 'C-F', slot: 'p2' },

  // ── Duplas ─────────────────────────────────────────────────────────────────
  // Play-in → Quartas
  // J6 = D-QF-1 : Amauri/Guto (p1/BYE) vs W(PI-1)
  'D-PI-1': { nextMatchId: 'D-QF-1', slot: 'p2' },
  // J7 = D-QF-2 : W(PI-2) vs W(PI-3)
  'D-PI-2': { nextMatchId: 'D-QF-2', slot: 'p1' },
  'D-PI-3': { nextMatchId: 'D-QF-2', slot: 'p2' },
  // J8 = D-QF-3 : Alex/Evandro (p1/BYE) vs W(PI-4)
  'D-PI-4': { nextMatchId: 'D-QF-3', slot: 'p2' },
  // J9 = D-QF-4 : Saito/Fernando (p1/BYE) vs W(PI-5)
  'D-PI-5': { nextMatchId: 'D-QF-4', slot: 'p2' },
  // Quartas → Semifinais
  // J10 = D-SF-1 : W(J6) vs W(J7)
  'D-QF-1': { nextMatchId: 'D-SF-1', slot: 'p1' },
  'D-QF-2': { nextMatchId: 'D-SF-1', slot: 'p2' },
  // J11 = D-SF-2 : W(J8) vs W(J9)
  'D-QF-3': { nextMatchId: 'D-SF-2', slot: 'p1' },
  'D-QF-4': { nextMatchId: 'D-SF-2', slot: 'p2' },
  // Semifinais → Final
  'D-SF-1': { nextMatchId: 'D-F', slot: 'p1' },
  'D-SF-2': { nextMatchId: 'D-F', slot: 'p2' },
};

/**
 * Extracts individual player names from a match slot.
 * Handles both singles ("Pedro") and doubles ("Pedro / Carla").
 */
export const getParticipantsFromName = (name: string): string[] =>
  name.includes(' / ') ? name.split(' / ').map(s => s.trim()) : [name];
