import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { fetchAllMatches, fetchSettings, saveSettings } from '../lib/matchService';
import { Match, MatchStatus, TournamentSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DatabaseInitializer from '../components/DatabaseInitializer';
import { MessageCircle, Plus, Settings, Shield, ChevronRight } from 'lucide-react';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

const FILTERS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'A', label: 'Cat A' },
  { key: 'B', label: 'Cat B' },
  { key: 'C', label: 'Cat C' },
  { key: 'Duplas', label: 'Duplas' },
];

function getCatLabel(cat: string): string {
  if (cat === 'A') return 'CAT A';
  if (cat === 'B') return 'CAT B';
  if (cat === 'C') return 'CAT C';
  return 'DUPLAS';
}

function getDayChip(date: Date): string {
  if (isToday(date)) return 'HOJE';
  if (isTomorrow(date)) return 'AMANHÃ';
  return format(date, "dd/MM", { locale: ptBR }).toUpperCase();
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

const CatCornerBadge: React.FC<{ cat: string; primary?: boolean }> = ({ cat, primary }) => (
  <span className={`absolute top-0 right-0 font-lexend text-[10px] px-3 py-1 font-bold rounded-bl-lg ${primary ? 'bg-primary-container text-on-primary-container' : 'bg-border-muted text-on-surface-variant'}`}>
    {getCatLabel(cat)}
  </span>
);

// Pendency card: match needs scheduling
const PendingScheduleCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const deadlineStr = match.deadline
    ? format(match.deadline.toDate(), "dd/MM", { locale: ptBR })
    : null;
  const isPrimary = match.category === 'Duplas';

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
      <CatCornerBadge cat={match.category} primary={isPrimary} />
      <div className="space-y-3 pt-2">
        <p className="text-error font-lexend text-[11px] font-bold uppercase tracking-wide flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {deadlineStr ? `AGENDAR ATÉ ${deadlineStr}` : 'AGUARDANDO AGENDAMENTO'}
        </p>
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <span className="font-lexend font-bold text-navy-900 text-sm">{match.p1}</span>
          <span className="text-slate-300 font-bold text-xs">VS</span>
          <span className={`font-lexend font-bold text-navy-900 text-sm ${isTBD(match.p2) ? 'italic' : ''}`}>
            {isTBD(match.p2) ? 'Oponente pendente' : match.p2}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 bg-primary text-white font-lexend font-bold py-2.5 rounded-lg text-sm active:scale-95 transition-transform"
          >
            Confirmar Horário
          </button>
          <button
            onClick={onClick}
            className="px-3 border-2 border-navy-900 text-navy-900 rounded-lg flex items-center justify-center"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Pendency card: match was played but result not yet registered
const PendingResultCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const timeAgo = match.scheduledAt
    ? (isToday(match.scheduledAt.toDate()) ? 'HOJE' : 'ONTEM')
    : 'RECENTEMENTE';

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm relative overflow-hidden" style={{ borderLeft: '4px solid var(--color-primary-container)' }}>
      <CatCornerBadge cat={match.category} />
      <div className="space-y-3 pt-2">
        <p className="text-secondary font-lexend text-[11px] font-bold uppercase tracking-wide flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
          PARTIDA ENCERRADA {timeAgo}
        </p>
        <div className="flex justify-between items-center py-1">
          <div className="flex flex-col gap-1">
            <span className="font-lexend font-bold text-navy-900 text-sm">{match.p1}</span>
            <span className="font-lexend font-bold text-navy-900 text-sm">{match.p2}</span>
          </div>
          <div className="bg-slate-50 rounded p-2 text-center">
            <span className="font-lexend font-black text-navy-900 text-lg">? : ?</span>
          </div>
        </div>
        <button
          onClick={onClick}
          className="w-full bg-navy-900 text-primary-container font-lexend font-bold py-2.5 rounded-lg text-sm uppercase tracking-widest active:scale-95 transition-transform"
        >
          Registrar Resultado
        </button>
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
  const opponent = match.p1 === playerName ? match.p2 : match.p1;

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-navy-900 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="bg-primary-container text-navy-900 px-2 py-0.5 rounded text-[10px] font-black font-lexend">
            {dayChip}
          </span>
          <span className="text-white font-lexend text-[12px] font-bold">
            {timeStr}{match.court ? ` · ${match.court.toUpperCase()}` : ''}
          </span>
        </div>
        <span className="text-primary-container font-lexend text-[10px] font-bold">{catLabel}</span>
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
        <button
          onClick={onClick}
          className="w-full border-2 border-navy-900 text-navy-900 font-lexend font-bold py-2 rounded-lg text-sm active:bg-slate-50 transition-colors"
        >
          Ver Detalhes do Local
        </button>
      </div>
    </div>
  );
};

// Tournament feed: upcoming scheduled match
const ScheduledMatchCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const date = match.scheduledAt?.toDate();
  return (
    <button onClick={onClick} className="w-full text-left bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 font-lexend text-[11px] font-bold uppercase">AGENDADO</span>
        <span className="bg-border-muted text-on-surface-variant font-lexend text-[10px] px-2 py-0.5 rounded font-bold">
          {getCatLabel(match.category)}
        </span>
      </div>
      <div className="space-y-1 mb-2">
        <p className="font-lexend font-bold text-navy-900 text-sm">{match.p1}</p>
        <p className="font-lexend font-bold text-navy-900 text-sm">{match.p2}</p>
      </div>
      {date && (
        <p className="text-secondary text-[11px] font-semibold flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {format(date, "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
          {match.court ? ` · ${match.court}` : ''}
        </p>
      )}
    </button>
  );
};

// Tournament feed: completed match
const CompletedMatchCard: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => (
  <button onClick={onClick} className="w-full text-left bg-surface-container-low border border-slate-200 rounded-xl p-5 opacity-80">
    <div className="flex justify-between items-start mb-2">
      <span className="text-slate-400 font-lexend text-[11px] font-bold uppercase">FINALIZADO</span>
      <span className="bg-slate-200 text-slate-600 font-lexend text-[10px] px-2 py-0.5 rounded font-bold">
        {getCatLabel(match.category)}
      </span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className={`font-lexend font-bold text-sm ${match.winner === match.p1 ? 'text-navy-900' : 'text-slate-500'}`}>
            {match.p1}
          </span>
          {match.winner === match.p1 && (
            <svg className="w-3.5 h-3.5 text-primary fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        {match.score1 && (
          <span className="font-lexend font-bold text-navy-900 text-sm">{match.score1.join(' ')}</span>
        )}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className={`font-lexend text-sm ${match.winner === match.p2 ? 'text-navy-900 font-bold' : 'text-slate-500'}`}>
            {match.p2}
          </span>
          {match.winner === match.p2 && (
            <svg className="w-3.5 h-3.5 text-primary fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>
        {match.score2 && (
          <span className={`font-lexend text-sm ${match.winner === match.p2 ? 'text-navy-900 font-bold' : 'text-slate-500'}`}>
            {match.score2.join(' ')}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ─── Admin: deadline setting panel ───────────────────────────────────────────

const DeadlinePanel: React.FC<{ settings: TournamentSettings; onSaved: () => void }> = ({ settings, onSaved }) => {
  const ROUND_KEYS = [
    'A-Grupos', 'A-Quartas', 'A-Semifinais', 'A-Final',
    'B-Grupos', 'B-Oitavas', 'B-Quartas', 'B-Semifinais', 'B-Final',
    'C-Grupos', 'C-Semifinais', 'C-Final',
    'Duplas-Play-in', 'Duplas-Quartas', 'Duplas-Semifinais', 'Duplas-Final',
  ];
  const [deadlines, setDeadlines] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    ROUND_KEYS.forEach(k => {
      const ts = settings.roundDeadlines?.[k];
      d[k] = ts ? format(ts.toDate(), "yyyy-MM-dd'T'HH:mm") : '';
    });
    return d;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const roundDeadlines: Record<string, Timestamp> = {};
      Object.entries(deadlines).forEach(([k, v]) => {
        if (v) roundDeadlines[k] = Timestamp.fromDate(new Date(v));
      });
      await saveSettings({ roundDeadlines });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border-muted rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-secondary" />
        <h3 className="font-lexend font-bold text-sm text-navy-900">Prazos por Rodada</h3>
      </div>
      <p className="text-xs text-secondary">Jogadores só podem editar resultados até o prazo definido.</p>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {ROUND_KEYS.map(k => (
          <div key={k} className="flex items-center gap-2">
            <label className="text-xs text-secondary w-36 shrink-0">{k}</label>
            <input
              type="datetime-local"
              value={deadlines[k]}
              onChange={e => setDeadlines(prev => ({ ...prev, [k]: e.target.value }))}
              className="flex-1 text-xs border border-border-muted rounded-lg px-2 py-1.5 outline-none"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-navy-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar Prazos'}
      </button>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isGuest, isAdmin } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>({});
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState('TODOS');

  useEffect(() => {
    const load = async () => {
      try {
        const [matches, s] = await Promise.all([fetchAllMatches(), fetchSettings()]);
        setAllMatches(matches);
        setSettings(s);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const playerName = profile?.playerName;

  const myMatches = !isGuest && playerName
    ? allMatches.filter(m => m.participants.includes(playerName) && !isTBD(m.p1) && !isTBD(m.p2))
    : [];

  // Matches waiting to be scheduled
  const pendingScheduling = myMatches.filter(m => m.status === MatchStatus.PENDING);

  // Scheduled matches whose time has already passed with no result entered
  const overdueMatches = myMatches.filter(
    m => m.status === MatchStatus.SCHEDULED && m.scheduledAt && isPast(m.scheduledAt.toDate()),
  );

  const totalPendingActions = pendingScheduling.length + overdueMatches.length;

  // Next future scheduled match for this player
  const nextMatch = myMatches
    .filter(m => m.status === MatchStatus.SCHEDULED && m.scheduledAt && !isPast(m.scheduledAt.toDate()))
    .sort((a, b) => (a.scheduledAt?.toMillis() ?? 0) - (b.scheduledAt?.toMillis() ?? 0))[0] ?? null;

  const filterByCategory = (m: Match) =>
    activeFilter === 'TODOS' || m.category === activeFilter;

  const upcomingAll = allMatches
    .filter(m => m.status === MatchStatus.SCHEDULED && !isTBD(m.p1) && !isTBD(m.p2) && filterByCategory(m))
    .sort((a, b) => (a.scheduledAt?.toMillis() ?? 0) - (b.scheduledAt?.toMillis() ?? 0))
    .slice(0, 10);

  const recentResults = allMatches
    .filter(m => m.status === MatchStatus.COMPLETED && !isTBD(m.p1) && filterByCategory(m))
    .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0))
    .slice(0, 5);

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

        {/* Category filter chips */}
        <section className="flex gap-2 overflow-x-auto py-1 -mx-6 px-6 no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-lexend text-[12px] font-bold uppercase tracking-wider transition-colors ${
                activeFilter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-border-muted text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container'
              }`}
            >
              {f.label}
            </button>
          ))}
        </section>

        {/* Admin panel */}
        {isAdmin && (
          <div className="space-y-3">
            <button
              onClick={() => setShowAdmin(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-secondary"
            >
              <Shield className="w-4 h-4" />
              Painel do Admin
              <ChevronRight className={`w-4 h-4 transition-transform ${showAdmin ? 'rotate-90' : ''}`} />
            </button>
            {showAdmin && (
              <div className="space-y-4">
                <DatabaseInitializer />
                <DeadlinePanel settings={settings} onSaved={() => fetchSettings().then(setSettings)} />
              </div>
            )}
          </div>
        )}

        {/* Pendências */}
        {!isGuest && (
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-lexend font-bold text-lg text-navy-900 uppercase tracking-tight">Pendências</h2>
              {totalPendingActions > 0 && (
                <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold">
                  {totalPendingActions} {totalPendingActions === 1 ? 'AÇÃO' : 'AÇÕES'}
                </span>
              )}
            </div>
            {totalPendingActions === 0 ? (
              <p className="text-secondary text-sm py-2">Não há pendências</p>
            ) : (
              <div className="space-y-3">
                {pendingScheduling.map(m => (
                  <PendingScheduleCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                ))}
                {overdueMatches.map(m => (
                  <PendingResultCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
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
                  ? 'Torneio não inicializado. Use o Painel do Admin para inicializar o banco.'
                  : 'Nenhum jogo disponível.'
                : 'Não há jogos previstos'}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingAll.map(m => (
                <ScheduledMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
              {recentResults.map(m => (
                <CompletedMatchCard key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/agenda')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 border-4 border-white"
      >
        <Plus className="w-7 h-7" />
      </button>
    </Layout>
  );
};

export default Home;
