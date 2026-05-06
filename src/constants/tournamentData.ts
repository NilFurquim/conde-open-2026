import type { Category } from '../types';

export const CATEGORY_A_GROUPS: Record<number, string[]> = {
  1: ['Pedro', 'Fernando', 'Amauri', 'Saito'],
  2: ['Alex', 'Osvaldo', 'Paulo', 'Gustavo'],
  3: ['Thales', 'Ícaro', 'Solera', 'Jeff'],
  4: ['Allan', 'Carol', 'Lamega', 'Adriano'],
};

export const CATEGORY_A_PLAYERS: string[] = Object.values(CATEGORY_A_GROUPS).flat();

export const CATEGORY_B_GROUPS: Record<number, string[]> = {
  1: ['Adriano', 'Alexandre', 'Evandro', 'Cesar'],
  2: ['Lamega', 'Marcos', 'Renato', 'Aninha'],
  3: ['Fernando', 'Xico', 'Fortes', 'JC'],
  4: ['Saito', 'Wilder', 'Roberto', 'Guto'],
  5: ['Osvaldo', 'João Pedro', 'Silvio', 'Carla'],
  6: ['Paulo', 'Matera', 'Flavia', 'Nil'],
};

export const CATEGORY_C_GROUPS: Record<number, string[]> = {
  1: ['João Pedro', 'Eduardo', 'Nil', 'Junior'],
  2: ['Marcos', 'Rodrigo', 'Dudu', 'Alexandre'],
};

export interface DuplasTeam {
  id: string;
  name: string;
  players: string[];
  bye?: boolean;
}

export const DUPLAS_TEAMS: DuplasTeam[] = [
  { id: 't1', name: 'Pedro / Carla', players: ['Pedro', 'Carla'] },
  { id: 't2', name: 'Igor / Fortes', players: ['Igor', 'Fortes'] },
  { id: 't3', name: 'Paulo / Osvaldo', players: ['Paulo', 'Osvaldo'] },
  { id: 't4', name: 'Thales / Marcos', players: ['Thales', 'Marcos'] },
  { id: 't5', name: 'Adriano / Matera', players: ['Adriano', 'Matera'] },
  { id: 't6', name: 'Matheus / Xico', players: ['Matheus', 'Xico'] },
  { id: 't7', name: 'Ícaro / Rodrigo', players: ['Ícaro', 'Rodrigo'] },
  { id: 't8', name: 'Allan / Aninha', players: ['Allan', 'Aninha'] },
  { id: 't9', name: 'Gustavo / João Pedro', players: ['Gustavo', 'João Pedro'] },
  { id: 't10', name: 'Lamega / Alexandre', players: ['Lamega', 'Alexandre'] },
  { id: 't11', name: 'Amauri / Guto', players: ['Amauri', 'Guto'], bye: true },
  { id: 't12', name: 'Alex / Evandro', players: ['Alex', 'Evandro'], bye: true },
  { id: 't13', name: 'Saito / Fernando', players: ['Saito', 'Fernando'], bye: true },
];

export const getAllPlayers = (): string[] => {
  const all = new Set<string>();
  Object.values(CATEGORY_A_GROUPS).flat().forEach(p => all.add(p));
  Object.values(CATEGORY_B_GROUPS).flat().forEach(p => all.add(p));
  Object.values(CATEGORY_C_GROUPS).flat().forEach(p => all.add(p));
  DUPLAS_TEAMS.forEach(t => t.players.forEach(p => all.add(p)));
  return Array.from(all).sort((a, b) => a.localeCompare(b, 'pt-BR'));
};

export const getPlayerCategories = (playerName: string): string[] => {
  const cats: string[] = [];
  if (Object.values(CATEGORY_A_GROUPS).flat().includes(playerName)) cats.push('A');
  if (Object.values(CATEGORY_B_GROUPS).flat().includes(playerName)) cats.push('B');
  if (Object.values(CATEGORY_C_GROUPS).flat().includes(playerName)) cats.push('C');
  if (DUPLAS_TEAMS.some(t => t.players.includes(playerName))) cats.push('Duplas');
  return cats;
};

/** Chip "Todos as categorias" nas telas de filtro */
export type CategoryFilterKey = 'TODOS' | Category;

export const CATEGORY_TAB_ORDER: Category[] = ['A', 'B', 'C', 'Duplas'];

export const CATEGORY_FILTER_DEFS: { key: CategoryFilterKey; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  ...CATEGORY_TAB_ORDER.map((key): { key: CategoryFilterKey; label: string } => ({
    key,
    label: key === 'Duplas' ? 'Duplas' : `Cat ${key}`,
  })),
];

/**
 * Pastéis nos pills (A/B), bronze avermelhado (C), Duplas em laranja pastel um pouco vivo.
 * `bg` + `text` = contraste do chip; `border` = contorno em cards; `light` = blocos suaves.
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; light: string; swatch: string }> = {
  A:      { bg: 'bg-yellow-100',   text: 'text-amber-950',  border: 'border-amber-300/80',  light: 'bg-yellow-50/90',  swatch: 'bg-amber-600' },
  B:      { bg: 'bg-slate-100',    text: 'text-slate-800',  border: 'border-slate-300/80', light: 'bg-slate-50',      swatch: 'bg-slate-500' },
  C:      { bg: 'bg-orange-200',  text: 'text-red-950',    border: 'border-orange-700/40', light: 'bg-orange-50',   swatch: 'bg-orange-900' },
  Duplas: { bg: 'bg-orange-400',  text: 'text-orange-950', border: 'border-orange-500',    light: 'bg-orange-50',   swatch: 'bg-orange-600' },
};

export const GROUP_COLOR_CLASSES: Record<number, { bg: string; text: string; light: string }> = {
  1: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50' },
  2: { bg: 'bg-blue-500',    text: 'text-blue-700',    light: 'bg-blue-50'    },
  3: { bg: 'bg-yellow-500',  text: 'text-yellow-700',  light: 'bg-yellow-50'  },
  4: { bg: 'bg-purple-500',  text: 'text-purple-700',  light: 'bg-purple-50'  },
  5: { bg: 'bg-pink-500',    text: 'text-pink-700',    light: 'bg-pink-50'    },
  6: { bg: 'bg-cyan-500',    text: 'text-cyan-700',    light: 'bg-cyan-50'    },
};

export const ROUND_ORDER: Record<string, number> = {
  'Play-in': 1,
  'Grupos': 1,
  'Oitavas': 2,
  'Quartas': 3,
  'Semifinais': 4,
  'Final': 5,
};
