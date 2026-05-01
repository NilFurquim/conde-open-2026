import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { fetchAllMatches, fetchSettings, saveSettings } from '../lib/matchService';
import { Match, MatchStatus, TournamentSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import DatabaseInitializer from '../components/DatabaseInitializer';
import { Calendar, Clock, Trophy, AlertCircle, ChevronRight, Shield, Settings } from 'lucide-react';
import { CATEGORY_COLORS, ROUND_ORDER } from '../constants/tournamentData';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

const CategoryBadge: React.FC<{ cat: string }> = ({ cat }) => {
  const c = CATEGORY_COLORS[cat] || CATEGORY_COLORS.A;
  return (
    <span className={`${c.bg} text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}>
      Cat {cat}
    </span>
  );
};

const MatchRow: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const isPending = match.status === MatchStatus.PENDING;
  const isScheduled = match.status === MatchStatus.SCHEDULED;
  const isCompleted = match.status === MatchStatus.COMPLETED;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-border-muted rounded-2xl p-4 active:bg-slate-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <CategoryBadge cat={match.category} />
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          isCompleted ? 'bg-slate-100 text-slate-500' :
          isScheduled ? 'bg-green-100 text-green-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {isCompleted ? 'Finalizado' : isScheduled ? 'Agendado' : 'Pendente'}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${match.winner === match.p1 ? 'text-navy-900' : 'text-on-surface/70'}`}>{match.p1}</span>
          {isCompleted && match.score1 && (
            <span className={`text-xs font-bold ${match.winner === match.p1 ? 'text-navy-900' : 'text-slate-400'}`}>
              {match.score1.join(' ')}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-semibold ${match.winner === match.p2 ? 'text-navy-900' : 'text-on-surface/70'}`}>{match.p2}</span>
          {isCompleted && match.score2 && (
            <span className={`text-xs font-bold ${match.winner === match.p2 ? 'text-navy-900' : 'text-slate-400'}`}>
              {match.score2.join(' ')}
            </span>
          )}
        </div>
      </div>
      {isScheduled && match.scheduledAt && (
        <div className="flex items-center gap-1 mt-2 text-secondary">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-semibold">
            {format(match.scheduledAt.toDate(), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
            {match.court ? ` · ${match.court}` : ''}
          </span>
        </div>
      )}
      {isPending && (
        <div className="flex items-center gap-1 mt-2 text-amber-600">
          <AlertCircle className="w-3 h-3" />
          <span className="text-[10px] font-semibold">Aguardando agendamento</span>
        </div>
      )}
    </button>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; count?: number }> = ({ title, icon, children, count }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <span className="text-secondary">{icon}</span>
      <h2 className="font-lexend font-bold text-navy-900 text-sm uppercase tracking-wider">{title}</h2>
      {count !== undefined && (
        <span className="ml-auto bg-navy-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
    {children}
  </div>
);

// Admin: deadline setting panel
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

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isGuest, isAdmin } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [settings, setSettings] = useState<TournamentSettings>({});
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

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

  const myPending = myMatches.filter(m => m.status === MatchStatus.PENDING);
  const myScheduled = myMatches.filter(m => m.status === MatchStatus.SCHEDULED);
  const myCompleted = myMatches.filter(m => m.status === MatchStatus.COMPLETED);

  const upcomingAll = allMatches
    .filter(m => m.status === MatchStatus.SCHEDULED && !isTBD(m.p1) && !isTBD(m.p2))
    .sort((a, b) => {
      const ta = a.scheduledAt?.toMillis() ?? 0;
      const tb = b.scheduledAt?.toMillis() ?? 0;
      return ta - tb;
    })
    .slice(0, 10);

  const recentResults = allMatches
    .filter(m => m.status === MatchStatus.COMPLETED && !isTBD(m.p1))
    .sort((a, b) => {
      const ta = a.updatedAt?.toMillis() ?? 0;
      const tb = b.updatedAt?.toMillis() ?? 0;
      return tb - ta;
    })
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
        {/* Greeting */}
        <div>
          <h2 className="font-lexend font-bold text-xl text-navy-900">
            {isGuest ? 'Conde Open 2026' : `Olá, ${playerName}!`}
          </h2>
          <p className="text-sm text-secondary mt-0.5">
            {isGuest ? 'Acompanhando como convidado' : 'Bem-vindo ao seu torneio'}
          </p>
        </div>

        {/* Admin actions */}
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

        {/* My pending matches */}
        {myPending.length > 0 && (
          <Section
            title="Aguardando Agendamento"
            icon={<AlertCircle className="w-4 h-4" />}
            count={myPending.length}
          >
            <div className="space-y-2">
              {myPending.slice(0, 3).map(m => (
                <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
              {myPending.length > 3 && (
                <button onClick={() => navigate('/agenda')} className="w-full text-center text-xs text-secondary py-2">
                  Ver todos ({myPending.length}) →
                </button>
              )}
            </div>
          </Section>
        )}

        {/* My upcoming */}
        {myScheduled.length > 0 && (
          <Section title="Meus Próximos Jogos" icon={<Calendar className="w-4 h-4" />} count={myScheduled.length}>
            <div className="space-y-2">
              {myScheduled.slice(0, 3).map(m => (
                <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
            </div>
          </Section>
        )}

        {/* Tournament upcoming */}
        {upcomingAll.length > 0 && (
          <Section title="Próximos Jogos do Torneio" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-2">
              {upcomingAll.map(m => (
                <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
            </div>
          </Section>
        )}

        {/* Recent results */}
        {recentResults.length > 0 && (
          <Section title="Resultados Recentes" icon={<Trophy className="w-4 h-4" />}>
            <div className="space-y-2">
              {recentResults.map(m => (
                <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
              ))}
            </div>
          </Section>
        )}

        {/* Empty state */}
        {allMatches.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Trophy className="w-12 h-12 text-border-muted mx-auto" />
            <p className="text-secondary text-sm">Torneio não inicializado.</p>
            {isAdmin && (
              <p className="text-xs text-secondary">Use o Painel do Admin acima para inicializar o banco.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
