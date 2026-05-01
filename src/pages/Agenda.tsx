import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAllMatches } from '../lib/matchService';
import { Match, MatchStatus, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Clock, CheckCircle2, AlertCircle, Calendar, Search } from 'lucide-react';
import { CATEGORY_COLORS, ROUND_ORDER } from '../constants/tournamentData';

const CATS: Array<'Todos' | Category> = ['Todos', 'A', 'B', 'C', 'Duplas'];
const STATUSES = ['Todos', 'Pendentes', 'Agendados', 'Finalizados'] as const;
type StatusFilter = typeof STATUSES[number];

const isTBD = (name: string) => name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

const StatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  if (status === MatchStatus.COMPLETED) return (
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-2.5 h-2.5" />Finalizado
    </span>
  );
  if (status === MatchStatus.SCHEDULED) return (
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <Clock className="w-2.5 h-2.5" />Agendado
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-2.5 h-2.5" />Pendente
    </span>
  );
};

const MatchItem: React.FC<{ match: Match; playerName?: string; onClick: () => void }> = ({ match, playerName, onClick }) => {
  const catColor = CATEGORY_COLORS[match.category] || CATEGORY_COLORS.A;
  const isMyMatch = playerName && match.participants.includes(playerName);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl p-4 active:bg-slate-50 transition-colors border ${isMyMatch ? catColor.border + ' border-l-4' : 'border-border-muted'}`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`${catColor.bg} text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full`}>
            {match.category}
          </span>
          <span className="text-[10px] text-secondary font-medium">
            {match.round}{match.group ? ` · G${match.group}` : ''}{match.matchNum ? ` · J${match.matchNum}` : ''}
          </span>
        </div>
        <StatusBadge status={match.status} />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${match.winner === match.p1 ? 'text-navy-900' : 'text-on-surface/70'}`}>{match.p1}</span>
          {match.score1 && (
            <div className="flex gap-1">
              {match.score1.map((s, i) => (
                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${match.winner === match.p1 ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${match.winner === match.p2 ? 'text-navy-900' : 'text-on-surface/70'}`}>{match.p2}</span>
          {match.score2 && (
            <div className="flex gap-1">
              {match.score2.map((s, i) => (
                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${match.winner === match.p2 ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {match.scheduledAt && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border-muted">
          <Calendar className="w-3 h-3 text-secondary" />
          <span className="text-[10px] text-secondary font-semibold">
            {format(match.scheduledAt.toDate(), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
            {match.court ? ` · ${match.court}` : ''}
          </span>
        </div>
      )}
    </button>
  );
};

const FilterPill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${active ? 'bg-navy-900 text-white' : 'bg-white border border-border-muted text-secondary'}`}
  >
    {children}
  </button>
);

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isGuest } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<'Todos' | Category>('Todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [search, setSearch] = useState('');
  const [myOnly, setMyOnly] = useState(false);

  const playerName = profile?.playerName;

  useEffect(() => {
    fetchAllMatches().then(setAllMatches).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let ms = allMatches.filter(m => !isTBD(m.p1) && !isTBD(m.p2));
    if (catFilter !== 'Todos') ms = ms.filter(m => m.category === catFilter);
    if (statusFilter === 'Pendentes') ms = ms.filter(m => m.status === MatchStatus.PENDING);
    else if (statusFilter === 'Agendados') ms = ms.filter(m => m.status === MatchStatus.SCHEDULED);
    else if (statusFilter === 'Finalizados') ms = ms.filter(m => m.status === MatchStatus.COMPLETED);
    if (myOnly && playerName) ms = ms.filter(m => m.participants.includes(playerName));
    if (search.trim()) {
      const t = search.toLowerCase();
      ms = ms.filter(m => m.p1.toLowerCase().includes(t) || m.p2.toLowerCase().includes(t));
    }
    return ms.sort((a, b) => {
      const ao = ROUND_ORDER[a.round] ?? 0;
      const bo = ROUND_ORDER[b.round] ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.matchNum ?? 0) - (b.matchNum ?? 0);
    });
  }, [allMatches, catFilter, statusFilter, search, myOnly, playerName]);

  const pendingCount = allMatches.filter(m => m.status === MatchStatus.PENDING && !isTBD(m.p1)).length;

  return (
    <Layout title="Agenda">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATS.map(c => (
            <FilterPill key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
              {c === 'Todos' ? 'Todos' : `Cat ${c}`}
            </FilterPill>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUSES.map(s => (
            <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s}{s === 'Pendentes' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </FilterPill>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-border-muted rounded-xl px-3">
            <Search className="w-4 h-4 text-secondary shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar jogador..."
              className="flex-1 py-2.5 text-sm outline-none bg-transparent"
            />
          </div>
          {!isGuest && playerName && (
            <button
              onClick={() => setMyOnly(v => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${myOnly ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-border-muted text-secondary'}`}
            >
              Meus
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-secondary text-sm">Nenhuma partida encontrada.</div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-secondary">{filtered.length} partida{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(m => (
              <MatchItem key={m.id} match={m} playerName={playerName} onClick={() => navigate(`/match/${m.id}`)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agenda;
