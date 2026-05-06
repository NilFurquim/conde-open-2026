/**
 * BracketFlow — chave de mata-mata com layout 100% calculado.
 *
 * Não mede o DOM. Todas as coordenadas são derivadas algebricamente:
 *  • Coluna folha (colIdx=0): cada slot ocupa uma "linha" de ROW_UNIT px.
 *  • Colunas derivadas: cy = média dos cy dos feeders conhecidos.
 *
 * Isso garante que os conectores SVG (cotovelo elbow path) chegam
 * exatamente ao centro de cada card, independente de zoom ou viewport.
 *
 * O highlight do jogador logado é feito automaticamente pelo `PlayerName`
 * usado dentro do `KOMatchCard` (via `useAuth`).
 */
import React, { useMemo } from 'react';
import { Match } from '../types';
import KOMatchCard from './KOMatchCard';
import { BracketColumnDef } from '../lib/bracketLayouts';
import { getBracketSlotDisplayMatch, resolveBracketSlotMatch } from '../lib/koSlotResolver';
import { KO_PROPAGATION } from '../lib/bracketMap';

// ── Layout constants ──────────────────────────────────────────────────────────
const CARD_W  = 216;   // card width  (px)
const CARD_H  = 82;    // card height (px) – must match KOMatchCard min-h
const COL_GAP = 52;    // horizontal gap between columns (space for connectors)
const ROW_GAP = 10;    // minimum gap between adjacent cards in the leaf column
const ROW_UNIT = CARD_H + ROW_GAP;
const COL_STEP = CARD_W + COL_GAP; // x stride per column
const TITLE_H  = 28;   // height reserved above cards for column titles

// Connector style
const STROKE_COLOR   = '#476083';
const STROKE_WIDTH   = 1.5;
const STROKE_OPACITY = 0.45;

// ── Position type ─────────────────────────────────────────────────────────────
type Pos = {
  /** Left edge of card */
  x: number;
  /** Vertical center of card */
  cy: number;
};

// ── Layout computation ────────────────────────────────────────────────────────
function computeLayout(
  columns: BracketColumnDef[],
  connections: { from: string; to: string }[],
): { pos: Map<string, Pos>; totalW: number; totalH: number } {
  // Inverse map: nextSlot → [sourceSlots]
  const feeders = new Map<string, string[]>();
  for (const { from, to } of connections) {
    if (!feeders.has(to)) feeders.set(to, []);
    feeders.get(to)!.push(from);
  }

  const pos = new Map<string, Pos>();
  let leafIdx = 0;

  columns.forEach((col, colIdx) => {
    const x = colIdx * COL_STEP;

    col.groups.forEach(ids => {
      ids.forEach(slotId => {
        if (colIdx === 0) {
          // Leaf column: evenly spaced rows
          pos.set(slotId, { x, cy: leafIdx * ROW_UNIT + CARD_H / 2 });
          leafIdx++;
        } else {
          // Derived column: average cy of known feeders
          const srcs = (feeders.get(slotId) ?? []).filter(s => pos.has(s));
          const cy =
            srcs.length > 0
              ? srcs.reduce((sum, s) => sum + pos.get(s)!.cy, 0) / srcs.length
              : CARD_H / 2;
          pos.set(slotId, { x, cy });
        }
      });
    });
  });

  const maxCy = Math.max(...Array.from(pos.values()).map(p => p.cy));
  return {
    pos,
    totalW: (columns.length - 1) * COL_STEP + CARD_W,
    totalH: maxCy + CARD_H / 2 + 4,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
const BracketFlow: React.FC<{
  columns: BracketColumnDef[];
  matches: Match[];
  onMatch: (m: Match) => void;
}> = ({ columns, matches, onMatch }) => {
  // Connections relevant to this layout
  const connections = useMemo(() => {
    const all = new Set(columns.flatMap(c => c.groups.flat()));
    return Object.entries(KO_PROPAGATION)
      .filter(([src, { nextMatchId }]) => all.has(src) && all.has(nextMatchId))
      .map(([src, { nextMatchId }]) => ({ from: src, to: nextMatchId }));
  }, [columns]);

  const { pos, totalW, totalH } = useMemo(
    () => computeLayout(columns, connections),
    [columns, connections],
  );

  return (
    <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-4">
      {/* Fixed-size canvas: cards are absolutely positioned, SVG is on top */}
      <div
        className="relative select-none"
        style={{ width: totalW, height: totalH + TITLE_H, minWidth: totalW }}
      >
        {/* ── Column titles ───────────────────────────────────────────────── */}
        {columns.map((col, i) => (
          <div
            key={col.title}
            className="absolute font-lexend font-bold text-[10px] text-secondary uppercase tracking-widest text-center"
            style={{ top: 0, left: i * COL_STEP, width: CARD_W }}
          >
            {col.title}
          </div>
        ))}

        {/* ── Cards ───────────────────────────────────────────────────────── */}
        {columns.flatMap(col =>
          col.groups.flatMap(ids =>
            ids.map(slotId => {
              const p = pos.get(slotId);
              if (!p) return null;
              const displayMatch = getBracketSlotDisplayMatch(slotId, matches);
              const fromDb = Boolean(resolveBracketSlotMatch(slotId, matches));
              return (
                <div
                  key={slotId}
                  className="absolute"
                  style={{
                    top:    TITLE_H + p.cy - CARD_H / 2,
                    left:   p.x,
                    width:  CARD_W,
                    height: CARD_H,
                  }}
                >
                  <KOMatchCard
                    match={displayMatch}
                    onClick={() => onMatch(displayMatch)}
                    subtle={!fromDb}
                  />
                </div>
              );
            }),
          ),
        )}

        {/* ── SVG connector overlay ───────────────────────────────────────── */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ top: TITLE_H, left: 0 }}
          width={totalW}
          height={totalH}
        >
          {connections.map(({ from, to }) => {
            const f = pos.get(from);
            const t = pos.get(to);
            if (!f || !t) return null;

            // right edge of source card → gap midpoint → left edge of target card
            const x1   = f.x + CARD_W;           // right edge of 'from'
            const y1   = f.cy;
            const x2   = t.x;                     // left edge of 'to'
            const y2   = t.cy;
            const midX = x1 + (x2 - x1) / 2;

            return (
              <path
                key={`${from}→${to}`}
                d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`}
                stroke={STROKE_COLOR}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                opacity={STROKE_OPACITY}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default BracketFlow;
