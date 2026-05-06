import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllMatches } from '../lib/matchService';
import { Match, MatchStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SearchableParticipantCombobox from '../components/SearchableParticipantCombobox';
import { ROUND_ORDER, type CategoryFilterKey } from '../constants/tournamentData';
import CategoryFilterStrip from '../components/CategoryFilterStrip';
import {
  PendingScheduleCard,
  ScheduledMatchCard,
  CompletedMatchCard,
  isVisuallyFinished,
} from './Home';

// "Todos" = só agendados + finalizados (jogos com data, fechados ou em jogo)
// Pendentes ficam por último, num filtro dedicado
const STATUSES = ['Todos', 'Agendados', 'Finalizados', 'Pendentes'] as const;
type StatusFilter = typeof STATUSES[number];

const isTBD = (name: string) => name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

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
  const [catFilter, setCatFilter] = useState<CategoryFilterKey>('TODOS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Agendados');
  const [participantKey, setParticipantKey] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
  const [myOnly, setMyOnly] = useState(false);

  const playerName = profile?.playerName;

  useEffect(() => {
    fetchAllMatches().then(setAllMatches).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setParticipantKey('');
    setParticipantQuery('');
    setParticipantDropdownOpen(false);
  }, [catFilter]);

  const participantOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMatches) {
      if (isTBD(m.p1) || isTBD(m.p2)) continue;
      if (catFilter !== 'TODOS' && m.category !== catFilter) continue;
      set.add(m.p1);
      set.add(m.p2);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [allMatches, catFilter]);

  const filtered = useMemo(() => {
    let ms = allMatches.filter(m => !isTBD(m.p1) && !isTBD(m.p2));
    if (catFilter !== 'TODOS') ms = ms.filter(m => m.category === catFilter);

    if (statusFilter === 'Todos') {
      // "Todos" = jogos com data definida (agendados ou finalizados); pendentes ficam fora
      ms = ms.filter(m => m.status !== MatchStatus.PENDING);
    } else if (statusFilter === 'Pendentes') ms = ms.filter(m => m.status === MatchStatus.PENDING);
    else if (statusFilter === 'Agendados') ms = ms.filter(m => m.status === MatchStatus.SCHEDULED && !isVisuallyFinished(m));
    else if (statusFilter === 'Finalizados') ms = ms.filter(m => m.status === MatchStatus.COMPLETED || isVisuallyFinished(m));

    if (myOnly && playerName) ms = ms.filter(m => m.participants.includes(playerName));
    if (participantKey) {
      ms = ms.filter(
        m =>
          m.p1 === participantKey ||
          m.p2 === participantKey ||
          m.participants.includes(participantKey),
      );
    } else if (participantQuery.trim()) {
      const t = participantQuery.toLowerCase();
      ms = ms.filter(m => m.p1.toLowerCase().includes(t) || m.p2.toLowerCase().includes(t));
    }
    const byDateAsc = (a: Match, b: Match) =>
      (a.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER) - (b.scheduledAt?.toMillis() ?? Number.MAX_SAFE_INTEGER);

    if (statusFilter === 'Agendados') {
      // Mais próximo primeiro.
      return ms.sort(byDateAsc);
    }
    if (statusFilter === 'Finalizados') {
      // Mais antigo para mais novo.
      return ms.sort(byDateAsc);
    }

    // Pendentes/Todos: mantém leitura por fase do torneio.
    return ms.sort((a, b) => {
      const ao = ROUND_ORDER[a.round] ?? 0;
      const bo = ROUND_ORDER[b.round] ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.matchNum ?? 0) - (b.matchNum ?? 0);
    });
  }, [allMatches, catFilter, statusFilter, participantKey, participantQuery, myOnly, playerName]);

  const pendingCount = allMatches.filter(m => m.status === MatchStatus.PENDING && !isTBD(m.p1)).length;

  return (
    <Layout title="Agenda">
      <div className="space-y-4">
        <div className="-mx-1 px-1">
          <CategoryFilterStrip value={catFilter} onChange={setCatFilter} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUSES.map(s => (
            <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s}{s === 'Pendentes' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </FilterPill>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="min-w-0 flex-1">
            <SearchableParticipantCombobox
              id="agenda-participant-combo"
              listBoxId="agenda-participant-combo-list"
              allOptionLabel="Todos"
              options={participantOptions}
              selectedKey={participantKey}
              comboQuery={participantQuery}
              dropdownOpen={participantDropdownOpen}
              placeholder="Todos ou digite para filtrar…"
              onDropdownOpenChange={setParticipantDropdownOpen}
              onSelectedKeyChange={setParticipantKey}
              onComboQueryChange={setParticipantQuery}
            />
          </div>
          {!isGuest && playerName && (
            <button
              type="button"
              onClick={() => setMyOnly(v => !v)}
              className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${myOnly ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-border-muted text-secondary'}`}
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
              m.status === MatchStatus.PENDING ? (
                <PendingScheduleCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ) : (m.status === MatchStatus.COMPLETED || isVisuallyFinished(m)) ? (
                <CompletedMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ) : (
                <ScheduledMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              )
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agenda;
