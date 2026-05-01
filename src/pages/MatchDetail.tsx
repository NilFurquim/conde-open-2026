import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fetchMatchById, scheduleMatch, saveResult,
  fetchPlayerContact, fetchSettings, isDeadlinePassed
} from '../lib/matchService';
import { determineWinner } from '../lib/standingsService';
import { Match, MatchStatus, TournamentSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  Calendar, Clock, MapPin, MessageCircle, ChevronLeft,
  CheckCircle2, Edit3, Trophy, AlertCircle, History
} from 'lucide-react';
import { CATEGORY_COLORS } from '../constants/tournamentData';

// ── WhatsApp button ──────────────────────────────────────────────────────────
const WhatsAppBtn: React.FC<{ playerName: string }> = ({ playerName }) => {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayerContact(playerName).then(setPhone).catch(() => {});
  }, [playerName]);

  if (!phone) return (
    <div className="flex items-center gap-2 text-xs text-secondary bg-slate-50 border border-border-muted rounded-xl px-3 py-2">
      <MessageCircle className="w-4 h-4" />
      <span>{playerName} · sem WhatsApp</span>
    </div>
  );

  const link = `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá! Vamos agendar nosso jogo do Conde Open 2026?`)}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-xl text-xs font-bold active:bg-green-600 transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp · {playerName}
    </a>
  );
};

// ── Set score row ────────────────────────────────────────────────────────────
const SetRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}> = ({ label, value, onChange, highlight }) => (
  <input
    type="number"
    min={0}
    max={99}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder="–"
    className={`w-12 h-10 text-center rounded-lg border text-sm font-bold outline-none ${highlight ? 'border-navy-900 bg-navy-900 text-white' : 'border-border-muted bg-slate-50 text-navy-900'}`}
  />
);

// ── Main ─────────────────────────────────────────────────────────────────────
const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isGuest, isAdmin } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [settings, setSettings] = useState<TournamentSettings>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'info' | 'agendar' | 'resultado' | 'historico'>('info');

  // Scheduling form
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedCourt, setSchedCourt] = useState('');
  const [savingSched, setSavingSched] = useState(false);

  // Result form: 3 sets + optional tiebreak each
  const [sets, setSets] = useState([
    { a: '', b: '' },
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [savingResult, setSavingResult] = useState(false);

  const loadMatch = async () => {
    if (!id) return;
    const [m, s] = await Promise.all([fetchMatchById(id), fetchSettings()]);
    setMatch(m);
    setSettings(s);
    if (m?.scheduledAt) {
      const d = m.scheduledAt.toDate();
      setSchedDate(format(d, 'yyyy-MM-dd'));
      setSchedTime(format(d, 'HH:mm'));
    }
    if (m?.court) setSchedCourt(m.court);
    if (m?.score1 && m?.score2) {
      setSets(m.score1.map((s1, i) => ({ a: String(s1), b: String(m.score2![i] ?? '') })));
    }
  };

  useEffect(() => {
    loadMatch().finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout title="Partida">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout title="Partida">
        <div className="text-center py-16 text-secondary">Partida não encontrada.</div>
      </Layout>
    );
  }

  const playerName = profile?.playerName;
  const isParticipant = !!playerName && match.participants.includes(playerName);
  const canEdit = !isGuest && (isAdmin || isParticipant);
  const deadlinePassed = isDeadlinePassed(match, settings, isAdmin);
  const canEditResult = canEdit && !deadlinePassed;
  const isCompleted = match.status === MatchStatus.COMPLETED;
  const catColor = CATEGORY_COLORS[match.category] || CATEGORY_COLORS.A;

  // Opponent's name for WhatsApp
  const opponent = playerName === match.p1 ? match.p2 : match.p1;

  const handleSchedule = async () => {
    if (!schedDate || !schedTime) { alert('Informe data e hora.'); return; }
    setSavingSched(true);
    try {
      const dt = new Date(`${schedDate}T${schedTime}`);
      await scheduleMatch(match.id, dt, schedCourt, playerName || 'Admin');
      await loadMatch();
      setTab('info');
    } catch {
      alert('Erro ao agendar. Tente novamente.');
    } finally {
      setSavingSched(false);
    }
  };

  const handleResult = async () => {
    const s1 = sets.filter(s => s.a !== '' && s.b !== '');
    if (s1.length === 0) { alert('Informe pelo menos um set.'); return; }

    const score1 = s1.map(s => parseInt(s.a) || 0);
    const score2 = s1.map(s => parseInt(s.b) || 0);
    const winner = determineWinner(match.p1, match.p2, score1, score2);
    if (!winner) { alert('Resultado empatado em sets. Verifique os scores.'); return; }

    setSavingResult(true);
    try {
      await saveResult(match.id, score1, score2, undefined, undefined, winner, playerName || 'Admin');
      await loadMatch();
      setTab('info');
    } catch {
      alert('Erro ao salvar resultado. Tente novamente.');
    } finally {
      setSavingResult(false);
    }
  };

  const p1Sets = match.score1 && match.score2
    ? match.score1.filter((s, i) => s > (match.score2![i] ?? 0)).length : 0;
  const p2Sets = match.score1 && match.score2
    ? match.score2.filter((s, i) => s > (match.score1![i] ?? 0)).length : 0;

  return (
    <Layout title="Partida">
      <div className="space-y-5">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-secondary">
          <ChevronLeft className="w-4 h-4" />Voltar
        </button>

        {/* Match header */}
        <div className={`${catColor.light} border ${catColor.border} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`${catColor.bg} text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full`}>
              Cat {match.category}
            </span>
            <span className="text-xs text-secondary font-medium">
              {match.round}{match.group ? ` · Grupo ${match.group}` : ''}
            </span>
            <span className={`ml-auto text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isCompleted ? 'bg-slate-200 text-slate-600' :
              match.status === MatchStatus.SCHEDULED ? 'bg-green-100 text-green-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {isCompleted ? 'Finalizado' : match.status === MatchStatus.SCHEDULED ? 'Agendado' : 'Pendente'}
            </span>
          </div>

          {/* Scoreboard */}
          <div className="space-y-3">
            {[
              { name: match.p1, score: match.score1, sets: p1Sets },
              { name: match.p2, score: match.score2, sets: p2Sets },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-lexend font-bold text-base truncate ${match.winner === p.name ? 'text-navy-900' : 'text-on-surface/60'}`}>
                      {p.name}
                    </span>
                    {match.winner === p.name && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
                </div>
                {isCompleted && p.score && (
                  <div className="flex gap-1 items-center">
                    {p.score.map((s, i) => (
                      <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${match.winner === p.name ? 'bg-navy-900 text-white' : 'bg-white/60 text-slate-500 border border-border-muted'}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Date/court */}
          {match.scheduledAt && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/60 text-secondary">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  {format(match.scheduledAt.toDate(), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {match.court && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{match.court}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp contacts */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Contato</p>
          <div className="flex flex-wrap gap-2">
            {match.participants.length > 0 ? (
              match.participants.slice(0, 4).map(p => <WhatsAppBtn key={p} playerName={p} />)
            ) : (
              <>
                <WhatsAppBtn playerName={match.p1} />
                <WhatsAppBtn playerName={match.p2} />
              </>
            )}
          </div>
        </div>

        {/* Action tabs */}
        {canEdit && (
          <div className="flex gap-2 border-b border-border-muted pb-3">
            {[
              { key: 'info', label: 'Info' },
              { key: 'agendar', label: 'Agendar' },
              ...(canEditResult ? [{ key: 'resultado', label: 'Resultado' }] : []),
              { key: 'historico', label: 'Histórico' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${tab === t.key ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-border-muted text-secondary'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Deadline warning */}
        {deadlinePassed && !isAdmin && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">Prazo de edição encerrado para esta rodada.</p>
          </div>
        )}

        {/* Schedule form */}
        {tab === 'agendar' && canEdit && (
          <div className="bg-white border border-border-muted rounded-2xl p-5 space-y-4">
            <h3 className="font-lexend font-bold text-sm text-navy-900">Agendar Partida</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">Data</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={e => setSchedDate(e.target.value)}
                  className="w-full border border-border-muted rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">Hora</label>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className="w-full border border-border-muted rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">Quadra (opcional)</label>
                <input
                  type="text"
                  value={schedCourt}
                  onChange={e => setSchedCourt(e.target.value)}
                  placeholder="Ex: Quadra 1"
                  className="w-full border border-border-muted rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSchedule}
              disabled={savingSched}
              className="w-full bg-navy-900 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {savingSched ? 'Salvando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}

        {/* Result form */}
        {tab === 'resultado' && canEditResult && (
          <div className="bg-white border border-border-muted rounded-2xl p-5 space-y-4">
            <h3 className="font-lexend font-bold text-sm text-navy-900">Registrar Resultado</h3>
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-1">
                <span className="text-xs text-secondary font-semibold">Set</span>
                <span className="w-12 text-center text-xs font-bold text-navy-900 truncate">{match.p1.split(' ')[0]}</span>
                <span className="w-12 text-center text-xs font-bold text-navy-900 truncate">{match.p2.split(' ')[0]}</span>
              </div>
              {sets.map((s, i) => {
                const a = parseInt(s.a) || 0;
                const b = parseInt(s.b) || 0;
                return (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <span className="text-sm text-secondary font-medium">Set {i + 1}</span>
                    <SetRow label={`s${i}a`} value={s.a} onChange={v => setSets(prev => prev.map((x, j) => j === i ? { ...x, a: v } : x))} highlight={s.a !== '' && a > b} />
                    <SetRow label={`s${i}b`} value={s.b} onChange={v => setSets(prev => prev.map((x, j) => j === i ? { ...x, b: v } : x))} highlight={s.b !== '' && b > a} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-secondary">
              Vencedor determinado automaticamente pela contagem de sets ganhos.
            </p>
            <button
              onClick={handleResult}
              disabled={savingResult}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {savingResult ? 'Salvando...' : 'Salvar Resultado'}
            </button>
          </div>
        )}

        {/* History */}
        {(tab === 'historico' || (!canEdit && match.history?.length)) && (
          <div className="bg-white border border-border-muted rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-secondary" />
              <h3 className="font-lexend font-bold text-sm text-navy-900">Histórico de Edições</h3>
            </div>
            {!match.history?.length ? (
              <p className="text-xs text-secondary">Sem histórico ainda.</p>
            ) : (
              <div className="space-y-3">
                {[...match.history].reverse().map((entry, i) => (
                  <div key={i} className="border-l-2 border-border-muted pl-3 space-y-0.5">
                    <p className="text-[10px] text-secondary font-semibold">
                      {format(entry.timestamp.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })} · {entry.updatedBy}
                    </p>
                    {entry.action === 'schedule' && entry.scheduledAt && (
                      <p className="text-xs text-on-surface">
                        Agendado para {format(entry.scheduledAt.toDate(), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        {entry.court ? ` · ${entry.court}` : ''}
                      </p>
                    )}
                    {entry.action === 'result' && entry.score1 && (
                      <p className="text-xs text-on-surface">
                        Resultado: {entry.score1.join('-')} × {entry.score2?.join('-')}
                        {entry.winner ? ` · Vencedor: ${entry.winner}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MatchDetail;
