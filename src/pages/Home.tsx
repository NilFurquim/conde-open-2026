import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAllMatches } from '../lib/matchService';
import { Match, MatchStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { ChevronDown, ArrowRight } from 'lucide-react';
import PlayerName from '../components/PlayerName';
import CategoryBadge, { getCatLabel, getPhaseLabel } from '../components/CategoryBadge';
import CategoryFilterStrip from '../components/CategoryFilterStrip';
import type { CategoryFilterKey } from '../constants/tournamentData';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');
const MATCH_DURATION_MS = 90 * 60 * 1000;

export const hasSavedResult = (m: Match): boolean =>
  Array.isArray(m.score1) &&
  Array.isArray(m.score2) &&
  m.score1.length > 0 &&
  m.score2.length > 0;

export const isVisuallyFinished = (m: Match): boolean => {
  if (hasSavedResult(m)) return true;
  if (!m.scheduledAt) return false;
  return Date.now() >= (m.scheduledAt.toDate().getTime() + MATCH_DURATION_MS);
};

function getDayChip(date: Date): string {
  if (isToday(date)) return 'HOJE';
  if (isTomorrow(date)) return 'AMANHÃ';
  return format(date, "dd/MM", { locale: ptBR }).toUpperCase();
}

function formatCompactStatusDate(date: Date): string {
  const weekday = format(date, 'EEE', { locale: ptBR }).replace('.', '').slice(0, 3).toLowerCase();
  return `${weekday} ${format(date, "dd/MM 'às' HH:mm", { locale: ptBR })}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const PlayerAvatar: React.FC<{ name: string; photoURL?: string; highlight?: boolean }> = ({
  name, photoURL, highlight,
}) => {
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-12 h-12 rounded-full border-2 ${highlight ? 'border-primary-container' : 'border-slate-200'} overflow-hidden flex items-center justify-center bg-slate-100 shrink-0`}>
      {photoURL
        ? <img src={photoURL} alt={name} className="w-full h-full object-cover" />
        : <span className="font-lexend font-bold text-sm text-navy-900">{initials}</span>
      }
    </div>
  );
};

// Inline action button used in pending cards (right side, vertically centered)
const InlineCTA: React.FC<{
  label: string;
  onClick: () => void;
  variant: 'primary' | 'navy';
}> = ({ label, onClick, variant }) => (
  <button
    onClick={onClick}
    className={`
      shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg
      font-lexend font-bold text-[11px] uppercase tracking-wider
      active:opacity-80 transition-opacity
      ${variant === 'primary' ? 'bg-primary text-white' : 'bg-navy-900 text-primary-container'}
    `}
  >
    {label}
    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
  </button>
);

// Standard card header used by all match cards in Home (pending, scheduled, completed)
const CardHeader: React.FC<{
  status: React.ReactNode;
  match: Match;
}> = ({ status, match }) => (
  <div className="flex items-center justify-between gap-2 mb-2">
    {status}
    <CategoryBadge match={match} />
  </div>
);

// Pendency card: match needs scheduling
export const PendingScheduleCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const deadlineStr = match.deadline
    ? format(match.deadline.toDate(), "dd/MM", { locale: ptBR })
    : null;

  return (
    <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
      <CardHeader
        match={match}
        status={
          <span className="text-amber-600 font-lexend text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 truncate">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {deadlineStr ? `Agendar até ${deadlineStr}` : 'Agendamento pendente'}
          </span>
        }
      />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <PlayerName name={match.p1} className="font-lexend font-bold text-navy-900 text-sm" />
          {isTBD(match.p2) ? (
            <p className="font-lexend italic text-secondary text-xs truncate">Oponente a definir</p>
          ) : (
            <PlayerName name={match.p2} className="font-lexend font-bold text-navy-900 text-sm" />
          )}
        </div>
        <InlineCTA label="Agendar" onClick={onClick} variant="primary" />
      </div>
    </div>
  );
};

// Pendency card: match was played but result not yet registered
export const PendingResultCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const timeAgo = match.scheduledAt
    ? (isToday(match.scheduledAt.toDate()) ? 'hoje' : 'ontem')
    : 'recentemente';

  return (
    <div className="bg-white border-l-4 border-l-primary-container border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
      <CardHeader
        match={match}
        status={
          <span className="text-secondary font-lexend text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 truncate">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
            Resultado pendente · jogado {timeAgo}
          </span>
        }
      />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <PlayerName name={match.p1} className="font-lexend font-bold text-navy-900 text-sm" />
          <PlayerName name={match.p2} className="font-lexend font-bold text-navy-900 text-sm" />
        </div>
        <InlineCTA label="Resultado" onClick={onClick} variant="navy" />
      </div>
    </div>
  );
};

// Hero card for the player's next upcoming match
const NextMatchHero: React.FC<{
  match: Match; playerName: string; photoURL?: string; onClick: () => void;
}> = ({ match, playerName, photoURL, onClick }) => {
  const date = match.scheduledAt!.toDate();
  const dayChip = getDayChip(date);
  const timeStr = format(date, 'HH:mm');
  const catLabel = getCatLabel(match.category);
  const phaseLabel = getPhaseLabel(match);
  const opponent = match.p1 === playerName ? match.p2 : match.p1;

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-navy-900 px-4 py-2 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-primary-container text-navy-900 px-2 py-0.5 rounded text-[10px] font-black font-lexend whitespace-nowrap">
            {dayChip}
          </span>
          <span className="text-white font-lexend text-[12px] font-bold truncate">
            {timeStr}{match.court ? ` · ${match.court.toUpperCase()}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-white/70 font-lexend text-[10px] truncate">{phaseLabel}</span>
          <span className="text-primary-container font-lexend text-[10px] font-bold">{catLabel}</span>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1.5 w-5/12">
            <PlayerAvatar name={playerName} photoURL={photoURL} highlight />
            <span className="font-lexend font-bold text-sm text-center">Você</span>
          </div>
          <span className="font-lexend font-black text-slate-200 text-2xl">VS</span>
          <div className="flex flex-col items-center gap-1.5 w-5/12">
            <PlayerAvatar name={opponent} />
            <span className="font-lexend font-bold text-sm text-center">{opponent}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tournament feed: upcoming scheduled match
export const ScheduledMatchCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const date = match.scheduledAt?.toDate();
  const isTodayUpcoming = !!date && isToday(date) && !isPast(date);
  const statusDateLabel = date
    ? formatCompactStatusDate(date)
    : 'Sem horário';
  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
      <CardHeader
        match={match}
        status={
          <span className="text-secondary font-lexend text-[10px] font-bold tracking-wide flex items-center gap-1 truncate">
            {isTodayUpcoming && (
              <span className="bg-primary-container text-navy-900 px-1.5 py-0.5 rounded font-black text-[9px] shrink-0">
                HOJE
              </span>
            )}
            {statusDateLabel}
          </span>
        }
      />
      <div className="space-y-0.5 mb-2">
        <PlayerName name={match.p1} className="font-lexend font-bold text-navy-900 text-sm" />
        <PlayerName name={match.p2} className="font-lexend font-bold text-navy-900 text-sm" />
      </div>
    </button>
  );
};

// Tournament feed: completed match
export const CompletedMatchCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => (
  <button onClick={onClick} className="w-full text-left bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 opacity-80">
    <CardHeader
      match={match}
      status={
        <span className="text-slate-400 font-lexend text-[10px] font-bold tracking-wide truncate">
          {match.scheduledAt
            ? formatCompactStatusDate(match.scheduledAt.toDate())
            : '--/-- --:--'}
        </span>
      }
    />
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <PlayerName
            name={match.p1}
            className={`font-lexend text-sm ${match.winner === match.p1 ? 'font-bold text-navy-900' : 'text-slate-500'}`}
            keepColor={match.winner === match.p1}
          />
          {match.winner === match.p1 && (
            <svg className="w-3.5 h-3.5 text-primary fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        {hasSavedResult(match) ? (
          <span className={`font-lexend text-sm ${match.winner === match.p1 ? 'text-navy-900 font-bold' : 'text-slate-500'}`}>
            {match.score1?.join(' ')}
          </span>
        ) : (
          <span className="font-lexend text-xs font-bold uppercase text-amber-700">Resultado pendente</span>
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 min-w-0">
          <PlayerName
            name={match.p2}
            className={`font-lexend text-sm ${match.winner === match.p2 ? 'font-bold text-navy-900' : 'text-slate-500'}`}
            keepColor={match.winner === match.p2}
          />
          {match.winner === match.p2 && (
            <svg className="w-3.5 h-3.5 text-primary fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        {hasSavedResult(match) && (
          <span className={`font-lexend text-sm ${match.winner === match.p2 ? 'text-navy-900 font-bold' : 'text-slate-500'}`}>
            {match.score2?.join(' ')}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isGuest, isAdmin } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilterKey>('TODOS');
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const matches = await fetchAllMatches();
        setAllMatches(matches);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const playerName = profile?.playerName;

  const filterByCategory = (m: Match) =>
    activeFilter === 'TODOS' || m.category === activeFilter;

  const myMatches = !isGuest && playerName
    ? allMatches.filter(m => m.participants.includes(playerName) && !isTBD(m.p1) && !isTBD(m.p2))
    : [];

  // Matches waiting to be scheduled (filtered by active category)
  const pendingScheduling = myMatches.filter(
    m => m.status === MatchStatus.PENDING && filterByCategory(m),
  );

  // Scheduled matches whose time has already passed with no result entered
  const overdueMatches = myMatches.filter(
    m => m.status === MatchStatus.SCHEDULED && m.scheduledAt && isPast(m.scheduledAt.toDate()) && filterByCategory(m),
  );

  const totalPendingActions = pendingScheduling.length + overdueMatches.length;
  const pendingItems = [...pendingScheduling, ...overdueMatches];
  const visiblePending = showAllPending ? pendingItems : pendingItems.slice(0, 1);

  // Next future scheduled match for this player
  const nextMatch = myMatches
    .filter(m => m.status === MatchStatus.SCHEDULED && m.scheduledAt && !isPast(m.scheduledAt.toDate()))
    .sort((a, b) => (a.scheduledAt?.toMillis() ?? 0) - (b.scheduledAt?.toMillis() ?? 0))[0] ?? null;

  const upcomingAll = allMatches
    .filter(m => m.status === MatchStatus.SCHEDULED && !isVisuallyFinished(m) && !isTBD(m.p1) && !isTBD(m.p2) && filterByCategory(m))
    .sort((a, b) => (a.scheduledAt?.toMillis() ?? 0) - (b.scheduledAt?.toMillis() ?? 0))
    .slice(0, 20);

  const recentResults = allMatches
    .filter(m => (m.status === MatchStatus.COMPLETED || isVisuallyFinished(m)) && !isTBD(m.p1) && filterByCategory(m))
    .sort((a, b) => (b.scheduledAt?.toMillis() ?? 0) - (a.scheduledAt?.toMillis() ?? 0))
    .slice(0, 20);

  const visibleUpcoming = showAllUpcoming ? upcomingAll : upcomingAll.slice(0, 1);
  const visibleResults = showAllResults ? recentResults : recentResults.slice(0, 1);

  if (loading) {
    return (
      <Layout title="Início">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-secondary">Carregando torneio...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Início">
      <div className="space-y-8">

        <section className="py-1 -mx-6 px-6">
          <CategoryFilterStrip value={activeFilter} onChange={setActiveFilter} />
        </section>

        {/* Pendências */}
        {!isGuest && (
          <section className="space-y-3">
            <div className="flex justify-between items-center gap-2">
              <h2 className="font-lexend font-bold text-lg text-navy-900 uppercase tracking-tight">
                Pendências
                <span className="text-error ml-1">({totalPendingActions})</span>
              </h2>
              {totalPendingActions > 1 && (
                <button
                  onClick={() => setShowAllPending(v => !v)}
                  className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase"
                >
                  {showAllPending ? 'Ver menos' : 'Ver mais'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllPending ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            {totalPendingActions === 0 ? (
              <p className="text-secondary text-sm py-2">Não há pendências</p>
            ) : (
              <div className="space-y-3">
                {visiblePending.map(m => (
                  m.status === MatchStatus.PENDING ? (
                    <PendingScheduleCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                  ) : (
                    <PendingResultCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                  )
                ))}
              </div>
            )}
          </section>
        )}

        {/* Seus Próximos Jogos */}
        {!isGuest && (
          <section className="space-y-3">
            <h2 className="font-lexend font-bold text-lg text-navy-900 uppercase tracking-tight">
              Seus Próximos Jogos
            </h2>
            {nextMatch && playerName ? (
              <NextMatchHero
                match={nextMatch}
                playerName={playerName}
                photoURL={profile?.photoURL}
                onClick={() => navigate(`/match/${nextMatch.id}`)}
              />
            ) : (
              <p className="text-secondary text-sm py-2">Não há jogos previstos</p>
            )}
          </section>
        )}

        {/* Torneio (Geral) */}
        <section className="space-y-3 pb-10">
          <h2 className="font-lexend font-bold text-lg text-navy-900 uppercase tracking-tight">
            Torneio (Geral)
          </h2>
          {upcomingAll.length === 0 && recentResults.length === 0 ? (
            <p className="text-secondary text-sm py-2">
              {allMatches.length === 0
                ? isAdmin
                  ? 'Torneio não inicializado. Acesse /admin para inicializar o banco.'
                  : 'Nenhum jogo disponível.'
                : 'Não há jogos previstos'}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-lexend font-bold text-sm text-navy-900 uppercase tracking-wide">
                    Próximos jogos
                  </h3>
                  {upcomingAll.length > 1 && (
                    <button
                      onClick={() => setShowAllUpcoming(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase"
                    >
                      {showAllUpcoming ? 'Ver menos' : 'Ver mais'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllUpcoming ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {upcomingAll.length === 0 ? (
                  <p className="text-secondary text-sm py-1">Não há próximos jogos.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleUpcoming.map(m => (
                      <ScheduledMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-lexend font-bold text-sm text-navy-900 uppercase tracking-wide">
                    Últimos resultados
                  </h3>
                  {recentResults.length > 1 && (
                    <button
                      onClick={() => setShowAllResults(v => !v)}
                      className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase"
                    >
                      {showAllResults ? 'Ver menos' : 'Ver mais'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllResults ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {recentResults.length === 0 ? (
                  <p className="text-secondary text-sm py-1">Não há resultados recentes.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleResults.map(m => (
                      <CompletedMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
};

export default Home;
