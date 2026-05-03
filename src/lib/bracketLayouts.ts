/** Colunas da chave: cada grupo = bloco vertical (par de oitavas ou uma partida). */
export type BracketColumnDef = {
  title: string;
  /**
   * Cada item é um grupo de slots que alimenta UMA partida na próxima coluna.
   * A ordem dos grupos dentro do array define a posição visual de cima para baixo.
   * Para um bracket com cruzamento (ex.: QF-1 e QF-4 → SF-1), os dois slots
   * do mesmo destino devem aparecer JUNTOS no mesmo grupo ou em posições adjacentes.
   */
  groups: string[][];
};

export const LAYOUT_SINGLES: Record<'A' | 'B' | 'C', BracketColumnDef[]> = {
  // ── Cat A: 4 QFs → 2 SFs → F (sequential, sem cruzamento) ──────────────
  A: [
    { title: 'Quartas',    groups: [['A-QF-1', 'A-QF-2'], ['A-QF-3', 'A-QF-4']] },
    { title: 'Semifinais', groups: [['A-SF-1'], ['A-SF-2']] },
    { title: 'Final',      groups: [['A-F']] },
  ],

  // ── Cat B: chave seeded 8 → 4 → 2 → 1 ──────────────────────────────────
  //
  //  Regra de cruzamento:
  //    QF-1 (W J1 × W J8) + QF-4 (W J4 × W J5) → SF-1
  //    QF-2 (W J2 × W J7) + QF-3 (W J3 × W J6) → SF-2
  //
  //  Para que as linhas não se cruzem, os grupos de R16 e QF precisam ser
  //  reordenados de forma que pares que se encontram na mesma SF fiquem
  //  na mesma metade vertical:
  //
  //  Metade SUPERIOR (rows 0-3): R16-1/R16-8 e R16-4/R16-5 → QF-1 e QF-4 → SF-1
  //  Metade INFERIOR (rows 4-7): R16-2/R16-7 e R16-3/R16-6 → QF-2 e QF-3 → SF-2
  //
  B: [
    {
      title: 'Oitavas',
      groups: [
        ['B-R16-1', 'B-R16-8'],   // → QF-1  (top)
        ['B-R16-4', 'B-R16-5'],   // → QF-4  (top)
        ['B-R16-2', 'B-R16-7'],   // → QF-2  (bottom)
        ['B-R16-3', 'B-R16-6'],   // → QF-3  (bottom)
      ],
    },
    {
      title: 'Quartas',
      // QF-1 e QF-4 ficam juntos (ambos alimentam SF-1)
      // QF-2 e QF-3 ficam juntos (ambos alimentam SF-2)
      groups: [['B-QF-1', 'B-QF-4'], ['B-QF-2', 'B-QF-3']],
    },
    { title: 'Semifinais', groups: [['B-SF-1'], ['B-SF-2']] },
    { title: 'Final',      groups: [['B-F']] },
  ],

  // ── Cat C: 2 SFs → F (minimal) ──────────────────────────────────────────
  C: [
    { title: 'Semifinais', groups: [['C-SF-1'], ['C-SF-2']] },
    { title: 'Final',      groups: [['C-F']] },
  ],
};

// ── Duplas: Play-in → Quartas → Semis → Final ───────────────────────────────
//
//  Play-in → Quartas (misto: alguns com BYE):
//    PI-1          → QF-1 (p2)  [Amauri/Guto tem BYE como p1]
//    PI-2 + PI-3   → QF-2
//    PI-4          → QF-3 (p2)  [Alex/Evandro BYE]
//    PI-5          → QF-4 (p2)  [Saito/Fernando BYE]
//
//  Ordem visual de PI garante que PI-2 e PI-3 (pares) fiquem adjacentes:
//    PI-1 (row 0), PI-2 (row 1), PI-3 (row 2), PI-4 (row 3), PI-5 (row 4)
//
export const LAYOUT_DUPLAS: BracketColumnDef[] = [
  {
    title: 'Play-in',
    groups: [['D-PI-1'], ['D-PI-2'], ['D-PI-3'], ['D-PI-4'], ['D-PI-5']],
  },
  { title: 'Quartas',    groups: [['D-QF-1'], ['D-QF-2'], ['D-QF-3'], ['D-QF-4']] },
  { title: 'Semifinais', groups: [['D-SF-1'], ['D-SF-2']] },
  { title: 'Final',      groups: [['D-F']] },
];
