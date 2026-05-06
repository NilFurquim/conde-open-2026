import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchAllMatches } from '../lib/matchService';
import { Match, MatchStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SearchableParticipantCombobox from '../components/SearchableParticipantCombobox';
import { CATEGORY_COLORS, ROUND_ORDER, type CategoryFilterKey } from '../constants/tournamentData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const Agenda: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<CategoryFilterKey>('TODOS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Agendados');
  const [participantKey, setParticipantKey] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
  const [myOnly] = useState(false);
  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

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
  const renderMatchCard = (m: Match) => (
    m.status === MatchStatus.PENDING ? (
      <PendingScheduleCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
    ) : (m.status === MatchStatus.COMPLETED || isVisuallyFinished(m)) ? (
      <CompletedMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
    ) : (
      <ScheduledMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
    )
  );
  const scheduledWithDate = useMemo(
    () => filtered.filter(m => !!m.scheduledAt),
    [filtered],
  );
  const matchesByDay = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of scheduledWithDate) {
      const key = format(m.scheduledAt!.toDate(), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [scheduledWithDate]);
  const categoriesByDay = useMemo(() => {
    const map = new Map<string, Set<Match['category']>>();
    for (const m of scheduledWithDate) {
      const key = format(m.scheduledAt!.toDate(), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(m.category);
    }
    return map;
  }, [scheduledWithDate]);
  const selectedDayMatches = matchesByDay.get(selectedDayKey) ?? [];
  const monthLabel = format(monthCursor, "MMMM 'de' yyyy", { locale: ptBR });
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [monthCursor]);

  return (
    <Layout title="Agenda">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="font-lexend text-[10px] font-bold uppercase tracking-widest text-secondary">Categoria</p>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value as CategoryFilterKey)}
              className="w-full rounded-xl border border-border-muted bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 outline-none"
            >
              <option value="TODOS">Todas</option>
              <option value="A">Cat A</option>
              <option value="B">Cat B</option>
              <option value="C">Cat C</option>
              <option value="Duplas">Duplas</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="font-lexend text-[10px] font-bold uppercase tracking-widest text-secondary">Tipo do evento</p>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-xl border border-border-muted bg-white px-3 py-2.5 text-sm font-semibold text-navy-900 outline-none"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}{s === 'Pendentes' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-secondary text-sm">Nenhuma partida encontrada.</div>
        ) : statusFilter === 'Pendentes' ? (
          <div className="space-y-2">
            <p className="text-xs text-secondary">{filtered.length} partida{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(renderMatchCard)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white border border-border-muted rounded-2xl p-3 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonthCursor(prev => addMonths(prev, -1))}
                  className="w-8 h-8 rounded-lg border border-border-muted flex items-center justify-center text-secondary"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="font-lexend font-bold text-sm text-navy-900 capitalize">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => setMonthCursor(prev => addMonths(prev, 1))}
                  className="w-8 h-8 rounded-lg border border-border-muted flex items-center justify-center text-secondary"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-[10px] text-secondary font-bold uppercase tracking-wide px-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-center py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const hasMatches = matchesByDay.has(key);
                  const dayCats = Array.from(categoriesByDay.get(key) ?? []);
                  const isSelected = key === selectedDayKey;
                  const inMonth = isSameMonth(day, monthCursor);
                  const today = isToday(day);
                  const past = isBefore(startOfDay(day), startOfDay(new Date()));
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDayKey(key)}
                      className={`relative h-11 rounded-lg border text-xs transition-colors ${
                        isSelected
                          ? 'bg-navy-900 text-white border-navy-900'
                          : today
                            ? 'bg-primary/5 border-primary/40 text-navy-900'
                            : past
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : inMonth
                                ? 'bg-white border-border-muted text-navy-900'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className={`font-semibold ${today && !isSelected ? 'underline underline-offset-2' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {hasMatches && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                          {dayCats.map(cat => (
                            <span
                              key={cat}
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-container' : (CATEGORY_COLORS[cat]?.swatch ?? 'bg-primary')}`}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-secondary">
                {format(parseISO(selectedDayKey), "dd/MM/yyyy", { locale: ptBR })} · {selectedDayMatches.length} partida{selectedDayMatches.length !== 1 ? 's' : ''}
              </p>
              {selectedDayMatches.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm bg-white border border-border-muted rounded-xl">
                  Nenhuma partida nesse dia.
                </div>
              ) : (
                selectedDayMatches.map(renderMatchCard)
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Agenda;
