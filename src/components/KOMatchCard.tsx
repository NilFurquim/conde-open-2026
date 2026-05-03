import React from 'react';
import { Match, MatchStatus } from '../types';
import { formatKoDisplayName } from '../lib/bracketLabels';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

export interface KOMatchCardProps {
  match: Match;
  onClick: () => void;
  /** Card ainda sem partida real no banco (exibe como template/skeleton) */
  subtle?: boolean;
  /**
   * Nome do jogador logado para highlight.
   * Quando fornecido, o nome do jogador é destacado visualmente se participar
   * desta partida. Pronto para uso assim que o contexto de auth for passado.
   */
  highlightPlayer?: string;
}

const KOMatchCard: React.FC<KOMatchCardProps> = ({
  match,
  onClick,
  subtle,
  highlightPlayer,
}) => {
  const isCompleted = match.status === MatchStatus.COMPLETED;

  const rows = [
    { raw: match.p1, score: match.score1, isWinner: match.winner === match.p1 },
    { raw: match.p2, score: match.score2, isWinner: match.winner === match.p2 },
  ].map(r => ({
    ...r,
    name: formatKoDisplayName(r.raw),
    tbd: isTBD(r.raw),
    isMe: Boolean(highlightPlayer && r.raw === highlightPlayer),
  }));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full h-full text-left rounded-xl px-3 py-2.5
        active:opacity-75 transition-colors
        ${subtle
          ? 'bg-surface-container-low border border-dashed border-border-muted'
          : 'bg-white border border-border-muted shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* Match number */}
      <div className="text-[9px] text-secondary font-bold uppercase tracking-wide mb-1.5">
        J{match.matchNum}
      </div>

      {/* Players */}
      <div className="space-y-1">
        {rows.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-1.5 min-w-0">
            {/* Highlight bar */}
            {p.isMe && (
              <span className="w-1 h-4 rounded-full bg-primary shrink-0" />
            )}
            <span
              className={`
                text-[13px] flex-1 min-w-0 truncate leading-tight
                ${p.tbd
                  ? 'text-secondary/70 italic text-[11px]'
                  : p.isWinner
                    ? 'font-bold text-navy-900'
                    : p.isMe
                      ? 'font-semibold text-primary'
                      : 'text-on-surface/75'
                }
              `}
            >
              {p.name}
            </span>

            {/* Scores */}
            {isCompleted && p.score && (
              <div className="flex gap-0.5 shrink-0">
                {p.score.map((s, j) => (
                  <span
                    key={j}
                    className={`
                      w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold
                      ${p.isWinner ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'}
                    `}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </button>
  );
};

export default KOMatchCard;
