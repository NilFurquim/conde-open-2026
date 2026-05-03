import { Category, Match, MatchStatus } from '../types';

/** Seed oficial: mesmos textos do `DatabaseInitializer` (chave vazia + resolução flexível). */
export const BRACKET_SLOTS: Record<
  string,
  { category: Category; round: string; matchNum: number; p1: string; p2: string }
> = {
  'A-QF-1': { category: 'A', round: 'Quartas', matchNum: 1, p1: '1º Grupo 1', p2: '2º Grupo 2' },
  'A-QF-2': { category: 'A', round: 'Quartas', matchNum: 2, p1: '1º Grupo 2', p2: '2º Grupo 1' },
  'A-QF-3': { category: 'A', round: 'Quartas', matchNum: 3, p1: '1º Grupo 3', p2: '2º Grupo 4' },
  'A-QF-4': { category: 'A', round: 'Quartas', matchNum: 4, p1: '1º Grupo 4', p2: '2º Grupo 3' },
  'A-SF-1': { category: 'A', round: 'Semifinais', matchNum: 5, p1: 'Venc. QF-1', p2: 'Venc. QF-2' },
  'A-SF-2': { category: 'A', round: 'Semifinais', matchNum: 6, p1: 'Venc. QF-3', p2: 'Venc. QF-4' },
  'A-F': { category: 'A', round: 'Final', matchNum: 7, p1: 'Venc. SF-1', p2: 'Venc. SF-2' },
  'B-R16-1': { category: 'B', round: 'Oitavas', matchNum: 1, p1: '1º Grupo 1', p2: 'Melhor 3º #2' },
  'B-R16-2': { category: 'B', round: 'Oitavas', matchNum: 2, p1: '1º Grupo 2', p2: '2º Grupo 5' },
  'B-R16-3': { category: 'B', round: 'Oitavas', matchNum: 3, p1: '1º Grupo 3', p2: 'Melhor 3º #3' },
  'B-R16-4': { category: 'B', round: 'Oitavas', matchNum: 4, p1: '1º Grupo 4', p2: '2º Grupo 1' },
  'B-R16-5': { category: 'B', round: 'Oitavas', matchNum: 5, p1: '1º Grupo 5', p2: '2º Grupo 6' },
  'B-R16-6': { category: 'B', round: 'Oitavas', matchNum: 6, p1: '1º Grupo 6', p2: 'Melhor 3º #1' },
  'B-R16-7': { category: 'B', round: 'Oitavas', matchNum: 7, p1: '2º Grupo 3', p2: '2º Grupo 2' },
  'B-R16-8': { category: 'B', round: 'Oitavas', matchNum: 8, p1: '2º Grupo 4', p2: 'Melhor 3º #4' },
  'B-QF-1': { category: 'B', round: 'Quartas', matchNum: 9, p1: 'Venc. R16-1', p2: 'Venc. R16-8' },
  'B-QF-2': { category: 'B', round: 'Quartas', matchNum: 10, p1: 'Venc. R16-2', p2: 'Venc. R16-7' },
  'B-QF-3': { category: 'B', round: 'Quartas', matchNum: 11, p1: 'Venc. R16-3', p2: 'Venc. R16-6' },
  'B-QF-4': { category: 'B', round: 'Quartas', matchNum: 12, p1: 'Venc. R16-4', p2: 'Venc. R16-5' },
  'B-SF-1': { category: 'B', round: 'Semifinais', matchNum: 13, p1: 'Venc. QF-1', p2: 'Venc. QF-4' },
  'B-SF-2': { category: 'B', round: 'Semifinais', matchNum: 14, p1: 'Venc. QF-2', p2: 'Venc. QF-3' },
  'B-F': { category: 'B', round: 'Final', matchNum: 15, p1: 'Venc. SF-1', p2: 'Venc. SF-2' },
  'C-SF-1': { category: 'C', round: 'Semifinais', matchNum: 1, p1: '1º Grupo 1', p2: '2º Grupo 2' },
  'C-SF-2': { category: 'C', round: 'Semifinais', matchNum: 2, p1: '1º Grupo 2', p2: '2º Grupo 1' },
  'C-F': { category: 'C', round: 'Final', matchNum: 3, p1: 'Venc. SF-1', p2: 'Venc. SF-2' },
  'D-PI-1': { category: 'Duplas', round: 'Play-in', matchNum: 1, p1: 'Pedro / Carla', p2: 'Igor / Fortes' },
  'D-PI-2': { category: 'Duplas', round: 'Play-in', matchNum: 2, p1: 'Paulo / Osvaldo', p2: 'Thales / Marcos' },
  'D-PI-3': { category: 'Duplas', round: 'Play-in', matchNum: 3, p1: 'Adriano / Matera', p2: 'Matheus / Xico' },
  'D-PI-4': { category: 'Duplas', round: 'Play-in', matchNum: 4, p1: 'Ícaro / Rodrigo', p2: 'Allan / Aninha' },
  'D-PI-5': { category: 'Duplas', round: 'Play-in', matchNum: 5, p1: 'Gustavo / João Pedro', p2: 'Lamega / Alexandre' },
  'D-QF-1': { category: 'Duplas', round: 'Quartas', matchNum: 6, p1: 'Amauri / Guto', p2: 'Venc. PI-1' },
  'D-QF-2': { category: 'Duplas', round: 'Quartas', matchNum: 7, p1: 'Venc. PI-2', p2: 'Venc. PI-3' },
  'D-QF-3': { category: 'Duplas', round: 'Quartas', matchNum: 8, p1: 'Alex / Evandro', p2: 'Venc. PI-4' },
  'D-QF-4': { category: 'Duplas', round: 'Quartas', matchNum: 9, p1: 'Saito / Fernando', p2: 'Venc. PI-5' },
  'D-SF-1': { category: 'Duplas', round: 'Semifinais', matchNum: 10, p1: 'Venc. QF-1', p2: 'Venc. QF-2' },
  'D-SF-2': { category: 'Duplas', round: 'Semifinais', matchNum: 11, p1: 'Venc. QF-3', p2: 'Venc. QF-4' },
  'D-F': { category: 'Duplas', round: 'Final', matchNum: 12, p1: 'Venc. SF-1', p2: 'Venc. SF-2' },
};

/** Compat: só metadados numéricos (ex.: testes). */
export const BRACKET_SLOT_META: Record<string, { category: Category; round: string; matchNum: number }> =
  Object.fromEntries(
    Object.entries(BRACKET_SLOTS).map(([id, s]) => [id, { category: s.category, round: s.round, matchNum: s.matchNum }])
  );

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Categoria lógica para comparação (Firestore às vezes vem em outro casing). */
export function normalizeCategory(c: string | undefined): string {
  const x = stripDiacritics(String(c ?? '').trim().toLowerCase());
  if (x === 'duplas' || x === 'dupla' || x === 'd' || x === 'doubles' || x === 'double') return 'duplas';
  return x;
}

/** Fase canónica para casar variações de texto. */
export function canonicalRound(round: string): string {
  const r = stripDiacritics(round.trim().toLowerCase());
  const compact = r.replace(/[\s-]/g, '');
  if ((r.includes('play') && r.includes('in')) || compact === 'playin') return 'play-in';
  if (r.includes('oitava')) return 'oitavas';
  if (r.includes('quarta') && !r.includes('semi')) return 'quartas';
  if (r.includes('semi')) return 'semifinais';
  if (r === 'final' || r.startsWith('final ') || r.endsWith(' final')) return 'final';
  if (r.includes('final') && r.includes('grande')) return 'final';
  return r;
}

function sameCategory(db: string | undefined, expected: Category): boolean {
  return normalizeCategory(db) === normalizeCategory(expected);
}

function sameRoundCanon(db: string, expected: string): boolean {
  return canonicalRound(db) === canonicalRound(expected);
}

function buildSlotOrderByRound(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const [slotId, info] of Object.entries(BRACKET_SLOTS)) {
    const k = `${normalizeCategory(info.category)}|${canonicalRound(info.round)}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(slotId);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => BRACKET_SLOTS[a].matchNum - BRACKET_SLOTS[b].matchNum);
  }
  return m;
}

const SLOT_ORDER_BY_ROUND = buildSlotOrderByRound();

/**
 * Partida “mínima” para exibir a célula da chave quando ainda não há doc no Firestore
 * (ou só para mesclar id canónico na UI).
 */
export function buildSkeletonMatch(slotId: string): Match {
  const s = BRACKET_SLOTS[slotId];
  if (!s) {
    return {
      id: slotId,
      category: 'A',
      round: '?',
      matchNum: 0,
      p1: '—',
      p2: '—',
      status: MatchStatus.PENDING,
      participants: [],
    };
  }
  return {
    id: slotId,
    category: s.category,
    round: s.round,
    matchNum: s.matchNum,
    p1: s.p1,
    p2: s.p2,
    status: MatchStatus.PENDING,
    participants: [],
  };
}

/** Partida real se existir; senão esqueleto com placeholders do regulamento. */
export function getBracketSlotDisplayMatch(slotId: string, matches: Match[]): Match {
  return resolveBracketSlotMatch(slotId, matches) ?? buildSkeletonMatch(slotId);
}

/**
 * Resolve uma célula da chave: id do documento OU (categoria + fase + número)
 * OU, em último caso, posição na fase quando todos os `matchNum` faltam mas a contagem bate.
 */
export function resolveBracketSlotMatch(slotId: string, matches: Match[]): Match | undefined {
  const direct = matches.find(m => m.id === slotId);
  if (direct) return direct;

  const meta = BRACKET_SLOTS[slotId];
  if (!meta) return undefined;

  const byMeta = matches.find(
    m =>
      sameCategory(m.category, meta.category) &&
      sameRoundCanon(m.round, meta.round) &&
      (m.matchNum ?? -999999) === meta.matchNum
  );
  if (byMeta) return byMeta;

  // Alguns seeds usam J1–J4 nas quartas de duplas em vez de matchNum 6–9.
  if (
    normalizeCategory(meta.category) === 'duplas' &&
    canonicalRound(meta.round) === 'quartas' &&
    meta.matchNum >= 6 &&
    meta.matchNum <= 9
  ) {
    const altNum = meta.matchNum - 5;
    const alt = matches.find(
      m =>
        sameCategory(m.category, meta.category) &&
        sameRoundCanon(m.round, meta.round) &&
        (m.matchNum ?? -999999) === altNum
    );
    if (alt) return alt;
  }

  const orderKey = `${normalizeCategory(meta.category)}|${canonicalRound(meta.round)}`;
  const slotOrder = SLOT_ORDER_BY_ROUND.get(orderKey);
  const idx = slotOrder?.indexOf(slotId) ?? -1;
  if (idx < 0 || !slotOrder) return undefined;

  const cands = matches
    .filter(m => sameCategory(m.category, meta.category) && sameRoundCanon(m.round, meta.round))
    .sort((a, b) => (a.matchNum ?? 1e9) - (b.matchNum ?? 1e9));

  if (cands.length !== slotOrder.length) return undefined;

  const allMissingNum = cands.every(m => m.matchNum == null);
  if (allMissingNum) return cands[idx];

  return undefined;
}
