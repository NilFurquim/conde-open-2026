import React from 'react';
import { Match, MatchStatus } from '../types';
import { formatKoDisplayName } from '../lib/bracketLabels';
import { CATEGORY_COLORS } from '../constants/tournamentData';
import PlayerName from './PlayerName';
import { CheckCircle2 } from 'lucide-react';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

export interface KOMatchCardProps {
  match: Match;
  onClick: () => void;
  /** Card ainda sem partida real no banco (exibe como template/skeleton) */
  subtle?: boolean;
}

const KOMatchCard: React.FC<KOMatchCardProps> = ({ match, onClick, subtle }) => {
  const isCompleted = match.status === MatchStatus.COMPLETED;
  const catColors = CATEGORY_COLORS[match.category] || CATEGORY_COLORS.A;

  const rows = [
    { raw: match.p1, score: match.score1, isWinner: match.winner === match.p1 },
    { raw: match.p2, score: match.score2, isWinner: match.winner === match.p2 },
  ].map(r => ({
    ...r,
    display: formatKoDisplayName(r.raw),
    tbd: isTBD(r.raw),
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
          : isCompleted
            ? 'bg-surface-container-low border border-slate-200 opacity-85'
            : 'bg-white border border-border-muted shadow-sm hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">
          J{match.matchNum}
        </span>
        <span className={`${catColors.bg} ${catColors.text} border ${catColors.border} text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-tight`}>
          {match.category === 'Duplas' ? 'D' : match.category}
        </span>
      </div>

      <div className="space-y-1">
        {rows.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {p.tbd ? (
                <span className="text-[11px] min-w-0 truncate leading-tight text-secondary/70 italic">
                  {p.display}
                </span>
              ) : (
                <PlayerName
                  name={p.raw}
                  className={`text-[13px] min-w-0 leading-tight ${
                    p.isWinner ? 'font-bold text-navy-900' : 'text-on-surface/75'
                  }`}
                  keepColor={p.isWinner}
                />
              )}
              {isCompleted && p.isWinner && (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
            </div>

            {isCompleted && p.score && p.score.length > 0 && (
              <span className={`font-lexend text-sm shrink-0 ${p.isWinner ? 'font-bold text-navy-900' : 'text-slate-500'}`}>
                {p.score.join(' ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </button>
  );
};

export default KOMatchCard;
