export enum CategoryType {
  A = 'A',
  B = 'B',
  C = 'C',
  Duplas = 'Duplas'
}

export interface Player {
  id: string;
  name: string;
  category: CategoryType;
}

export interface Team {
  id: string;
  name: string; // "Player 1 / Player 2"
  players: string[];
}

export const CATEGORY_A_PLAYERS: string[] = [
  'Pedro', 'Fernando', 'Amauri', 'Saito',
  'Alex', 'Osvaldo', 'Paulo', 'Gustavo',
  'Thales', 'Ícaro', 'Solera', 'Jeff',
  'Allan', 'Carol', 'Lamega', 'Adriano'
];

export const CATEGORY_B_GROUPS = {
  1: ['Adriano', 'Alexandre', 'Evandro', 'Cesar'],
  2: ['Lamega', 'Marcos', 'Renato', 'Aninha'],
  3: ['Fernando', 'Xico', 'Fortes', 'JC'],
  4: ['Saito', 'Wilder', 'Roberto', 'Guto'],
  5: ['Osvaldo', 'João Pedro', 'Silvio', 'Carla'],
  6: ['Paulo', 'Matera', 'Flavia', 'Nil']
};

export const CATEGORY_C_GROUPS = {
  1: ['João Pedro', 'Eduardo', 'Nil', 'Junior'],
  2: ['Marcos', 'Rodrigo', 'Dudu', 'Alexandre']
};

export const DUPLAS_TEAMS = [
  { id: 't1', name: 'Pedro / Carla' },
  { id: 't2', name: 'Igor / Fortes' },
  { id: 't3', name: 'Paulo / Osvaldo' },
  { id: 't4', name: 'Thales / Marcos' },
  { id: 't5', name: 'Adriano / Matera' },
  { id: 't6', name: 'Matheus / Xico' },
  { id: 't7', name: 'Icaro / Rodrigo' },
  { id: 't8', name: 'Allan / Aninha' },
  { id: 't9', name: 'Gustavo / Joao Pedro' },
  { id: 't10', name: 'Lamega / Alexandre' },
  { id: 't11', name: 'Amauri / Guto', bye: true },
  { id: 't12', name: 'Alex / Evandro', bye: true },
  { id: 't13', name: 'Saito / Fernando', bye: true }
];
