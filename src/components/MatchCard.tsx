import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, CheckCircle, Clock } from 'lucide-react';
import { Match, MatchStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import PlayerName from './PlayerName';
import CategoryBadge from './CategoryBadge';

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const navigate = useNavigate();
  const dateStr = match.scheduledAt 
    ? format(match.scheduledAt.toDate(), "eeee, HH:mm", { locale: ptBR })
    : 'A definir';

  const isCompleted = match.status === MatchStatus.COMPLETED;
  const isScheduled = match.status === MatchStatus.SCHEDULED;

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border-muted relative active:scale-[0.98] transition-all cursor-pointer group hover:shadow-md"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${isCompleted ? 'bg-border-muted' : 'bg-primary-container'}`}></div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4 gap-2">
          <CategoryBadge match={match} />
          {isCompleted ? (
            <span className="bg-surface px-2 py-0.5 rounded text-secondary font-bold text-[9px] uppercase tracking-tighter">FINALIZADO</span>
          ) : isScheduled ? (
            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm">AGENDADO</span>
          ) : (
             <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[9px] font-black tracking-tighter italic uppercase">PENDENTE</span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <PlayerName
                name={match.p1}
                className={`font-lexend text-base tracking-tight ${match.winner === match.p1 ? 'text-navy-900 font-extrabold' : 'text-on-surface opacity-70 font-medium'}`}
                keepColor={isCompleted && match.winner === match.p1}
              />
              {match.winner === match.p1 && <CheckCircle className="w-4 h-4 text-primary-container fill-primary" />}
            </div>
            <div className="flex gap-1.5">
              {match.score1?.map((s, i) => (
                <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${match.winner === match.p1 ? 'bg-primary text-white' : 'bg-surface text-on-surface opacity-50 border border-border-muted'}`}>{s}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <PlayerName
                name={match.p2}
                className={`font-lexend text-base tracking-tight ${match.winner === match.p2 ? 'text-navy-900 font-extrabold' : 'text-on-surface opacity-70 font-medium'}`}
                keepColor={isCompleted && match.winner === match.p2}
              />
              {match.winner === match.p2 && <CheckCircle className="w-4 h-4 text-primary-container fill-primary" />}
            </div>
            <div className="flex gap-1.5">
               {match.score2?.map((s, i) => (
                  <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${match.winner === match.p2 ? 'bg-primary text-white' : 'bg-surface text-on-surface opacity-50 border border-border-muted'}`}>{s}</span>
                ))}
            </div>
          </div>
        </div>

        {isScheduled && !isCompleted && (
          <div className="pt-4 mt-4 border-t border-surface flex items-center justify-between text-on-surface/50">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-sans font-bold text-[9px] uppercase tracking-widest">{dateStr}</span>
            </div>
            {match.court && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="font-sans font-bold text-[9px] uppercase tracking-widest">{match.court}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
