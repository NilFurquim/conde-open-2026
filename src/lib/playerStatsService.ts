import { Match, Category } from '../types';
import {
  CATEGORY_A_GROUPS,
  CATEGORY_B_GROUPS,
  CATEGORY_C_GROUPS,
  DUPLAS_TEAMS,
} from '../constants/tournamentData';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

/** Partida com placar válido e lados definidos (não placeholder). */
export function matchCountsForStats(m: Match): boolean {
  if (!m.winner || isTBD(m.p1) || isTBD(m.p2)) return false;
  const s1 = m.score1 ?? [];
  const s2 = m.score2 ?? [];
  if (s1.length === 0 || s2.length === 0) return false;
  return true;
}

export interface PlayerCategoryStats {
  entityLabel: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

function tallySetsGames(score1: number[], score2: number[]) {
  let p1Sets = 0;
  let p2Sets = 0;
  let p1Games = 0;
  let p2Games = 0;
  for (let i = 0; i < Math.max(score1.length, score2.length); i++) {
    const a = score1[i] ?? 0;
    const b = score2[i] ?? 0;
    if (a > b) p1Sets++;
    else if (b > a) p2Sets++;
    p1Games += a;
    p2Games += b;
  }
  return { p1Sets, p2Sets, p1Games, p2Games };
}

function emptyRow(label: string): PlayerCategoryStats {
  return {
    entityLabel: label,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };
}

export function getEntitiesInCategory(category: Category): string[] {
  if (category === 'A') {
    return Array.from(new Set(Object.values(CATEGORY_A_GROUPS).flat())).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }
  if (category === 'B') {
    return Array.from(new Set(Object.values(CATEGORY_B_GROUPS).flat())).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }
  if (category === 'C') {
    return Array.from(new Set(Object.values(CATEGORY_C_GROUPS).flat())).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }
  return DUPLAS_TEAMS.map(t => t.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function applyMatchToRow(m: Match, entity: string, row: PlayerCategoryStats) {
  if (m.p1 !== entity && m.p2 !== entity) return;
  const onP1 = m.p1 === entity;
  const s1 = m.score1 ?? [];
  const s2 = m.score2 ?? [];
  const { p1Sets, p2Sets, p1Games, p2Games } = tallySetsGames(s1, s2);
  row.matchesPlayed++;
  if (m.winner === entity) {
    row.wins++;
  } else {
    row.losses++;
  }
  if (onP1) {
    row.setsWon += p1Sets;
    row.setsLost += p2Sets;
    row.gamesWon += p1Games;
    row.gamesLost += p2Games;
  } else {
    row.setsWon += p2Sets;
    row.setsLost += p1Sets;
    row.gamesWon += p2Games;
    row.gamesLost += p1Games;
  }
}

/** Estatísticas de uma entidade (jogador ou nome da dupla) na categoria. */
export function computeEntityStats(
  allMatches: Match[],
  category: Category,
  entity: string,
): PlayerCategoryStats {
  const row = emptyRow(entity);
  const relevant = allMatches.filter(
    m => m.category === category && matchCountsForStats(m),
  );
  relevant.forEach(m => applyMatchToRow(m, entity, row));
  return row;
}

/** Tabela ordenada: vitórias, saldo de sets, saldo de games, nome. */
export function computeCategoryLeaderboard(
  allMatches: Match[],
  category: Category,
): PlayerCategoryStats[] {
  const entities = getEntitiesInCategory(category);
  const rows = entities.map(e => computeEntityStats(allMatches, category, e));
  return rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aSetBal = a.setsWon - a.setsLost;
    const bSetBal = b.setsWon - b.setsLost;
    if (bSetBal !== aSetBal) return bSetBal - aSetBal;
    const aGameBal = a.gamesWon - a.gamesLost;
    const bGameBal = b.gamesWon - b.gamesLost;
    if (bGameBal !== aGameBal) return bGameBal - aGameBal;
    return a.entityLabel.localeCompare(b.entityLabel, 'pt-BR');
  });
}
