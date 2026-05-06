import React from 'react';
import { CATEGORY_COLORS } from '../constants/tournamentData';
import { Match } from '../types';

/**
 * Badge consistente que mostra a categoria + (opcional) fase do torneio.
 * Padronização visual: pill colorido da categoria à esquerda, meta-info
 * em texto secundário à direita.
 *
 *   [CAT A]  Grupos · Grupo 3
 *   [CAT B]  Quartas · J9
 *   [DUPLAS] Play-in
 */
function getCatLabel(cat: string): string {
  if (cat === 'Duplas') return 'DUPLAS';
  return `CAT ${cat}`;
}

function getPhaseLabel(match: Pick<Match, 'round' | 'group' | 'matchNum'>): string {
  const parts: string[] = [match.round];
  if (match.group) parts.push(`Grupo ${match.group}`);
  if (match.matchNum != null && match.round !== 'Grupos') parts.push(`J${match.matchNum}`);
  return parts.join(' · ');
}

const CategoryBadge: React.FC<{
  match: Pick<Match, 'category' | 'round' | 'group' | 'matchNum'>;
  /** Esconde a meta-info (fase) e mostra só o pill da categoria */
  pillOnly?: boolean;
  /** Tamanho compacto para listagens densas */
  size?: 'sm' | 'md';
}> = ({ match, pillOnly, size = 'sm' }) => {
  const colors = CATEGORY_COLORS[match.category] || CATEGORY_COLORS.A;
  const phaseLabel = getPhaseLabel(match);

  const pillClasses =
    size === 'md'
      ? 'text-[10px] px-2.5 py-1'
      : 'text-[9px] px-2 py-0.5';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`${colors.bg} ${colors.text} border ${colors.border} font-lexend font-bold uppercase tracking-wider rounded-full whitespace-nowrap ${pillClasses}`}
      >
        {getCatLabel(match.category)}
      </span>
      {!pillOnly && (
        <span className="text-[10px] text-secondary font-semibold truncate">
          {phaseLabel}
        </span>
      )}
    </div>
  );
};

export default CategoryBadge;
export { getCatLabel, getPhaseLabel };
