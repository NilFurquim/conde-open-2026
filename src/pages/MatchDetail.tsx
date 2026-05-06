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
  MessageCircle, ChevronLeft,
  Trophy, AlertCircle
} from 'lucide-react';
import { CATEGORY_COLORS } from '../constants/tournamentData';
import PlayerName from '../components/PlayerName';
import CategoryBadge from '../components/CategoryBadge';

const isTBD = (name: string) =>
  name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

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
  emphasized?: boolean;
}> = ({ label, value, onChange, emphasized }) => (
  <input
    type="number"
    min={0}
    max={99}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder="–"
    className={`w-12 h-10 text-center rounded-lg border border-border-muted text-sm outline-none bg-white ${emphasized ? 'font-bold text-navy-900' : 'font-medium text-slate-600'}`}
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

  // Scheduling form
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');

  // Result form: 3 sets + optional tiebreak each
  const [sets, setSets] = useState([
    { a: '', b: '' },
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [savingResult, setSavingResult] = useState(false);
  const EMPTY_SETS = [
    { a: '', b: '' },
    { a: '', b: '' },
    { a: '', b: '' },
  ];

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
    if (m?.score1 && m?.score2) {
      const nextSets = [0, 1, 2].map(i => ({
        a: m.score1?.[i] !== undefined ? String(m.score1[i]) : '',
        b: m.score2?.[i] !== undefined ? String(m.score2[i]) : '',
      }));
      setSets(nextSets);
    } else {
      setSets(EMPTY_SETS);
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
  const playersDefined = !isTBD(match.p1) && !isTBD(match.p2);
  const isParticipant = !!playerName && match.participants.includes(playerName);
  const canEdit = playersDefined && !isGuest && (isAdmin || isParticipant);
  const deadlinePassed = isDeadlinePassed(match, settings, isAdmin);
  const canEditResult = playersDefined && canEdit && !deadlinePassed;
  const isCompleted = match.status === MatchStatus.COMPLETED;
  const isEditingExisting = isCompleted && canEditResult;
  const catColor = CATEGORY_COLORS[match.category] || CATEGORY_COLORS.A;

  // Opponent's name for WhatsApp
  const opponent = playerName === match.p1 ? match.p2 : match.p1;

  const handleSave = async () => {
    const currentSchedDate = match.scheduledAt ? format(match.scheduledAt.toDate(), 'yyyy-MM-dd') : '';
    const currentSchedTime = match.scheduledAt ? format(match.scheduledAt.toDate(), 'HH:mm') : '';
    const hasAnySchedInput = schedDate !== '' || schedTime !== '';
    const hasCompleteSchedInput = schedDate !== '' && schedTime !== '';
    const hasPartialSchedInput = hasAnySchedInput && !hasCompleteSchedInput;
    const scheduleChanged = hasCompleteSchedInput &&
      (schedDate !== currentSchedDate || schedTime !== currentSchedTime);

    if (hasPartialSchedInput) {
      alert('Preencha data e hora para salvar o agendamento.');
      return;
    }

    const parsedSets = sets.map(s => {
      const hasA = s.a !== '';
      const hasB = s.b !== '';
      if (!hasA && !hasB) return null;
      if (!hasA || !hasB) return 'incomplete' as const;
      return { a: parseInt(s.a) || 0, b: parseInt(s.b) || 0 };
    });

    if (parsedSets.includes('incomplete')) {
      alert('Preencha os resultados completos de cada set.');
      return;
    }

    const lastFilledIdx = parsedSets.reduce((acc, item, idx) => (item ? idx : acc), -1);
    const hasResultInput = lastFilledIdx >= 0;

    if (hasResultInput) {
      // Evita "buracos": ex. Set 1 e Tiebreak preenchidos sem Set 2.
      for (let i = 0; i <= lastFilledIdx; i++) {
        if (!parsedSets[i]) {
          alert('Preencha os sets em ordem (Set 1, Set 2 e Tiebreak).');
          return;
        }
      }
    }

    const filledSets = hasResultInput
      ? (parsedSets.slice(0, lastFilledIdx + 1) as Array<{ a: number; b: number }>)
      : [];
    const score1 = filledSets.map(s => s.a);
    const score2 = filledSets.map(s => s.b);
    const winner = hasResultInput ? determineWinner(match.p1, match.p2, score1, score2) : null;

    if (hasResultInput && !winner) {
      alert('Resultado empatado em sets. Verifique os scores.');
      return;
    }

    const sameScoresAsSaved =
      (match.score1 ?? []).length === score1.length &&
      (match.score2 ?? []).length === score2.length &&
      (match.score1 ?? []).every((v, i) => v === score1[i]) &&
      (match.score2 ?? []).every((v, i) => v === score2[i]);
    const resultChanged = hasResultInput && (!isCompleted || !sameScoresAsSaved);
    const canSaveResultNow = resultChanged && canEditResult;

    const hasExistingSchedule = !!match.scheduledAt;
    if (canSaveResultNow && !hasExistingSchedule && !hasCompleteSchedInput) {
      alert('Para salvar resultado, informe data e hora do jogo.');
      return;
    }

    if (!scheduleChanged && !canSaveResultNow) {
      alert('Nada para salvar.');
      return;
    }

    setSavingResult(true);
    try {
      if (scheduleChanged) {
        try {
          const dt = new Date(`${schedDate}T${schedTime}`);
          if (!Number.isNaN(dt.getTime())) {
            await scheduleMatch(match.id, dt, '', playerName || 'Admin');
          }
        } catch {
          // Não bloqueia o salvamento do resultado se o agendamento falhar.
        }
      }
      if (canSaveResultNow && winner) {
        await saveResult(
          match.id,
          match.category,
          match.round,
          score1, score2,
          undefined, undefined,
          winner,
          playerName || 'Admin'
        );
      }
      await loadMatch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar resultado.';
      alert(`${message} Tente novamente.`);
      // Em alguns cenários o resultado pode salvar e falhar apenas no pós-processamento.
      // Recarrega para refletir o estado real no Firestore.
      await loadMatch();
    } finally {
      setSavingResult(false);
    }
  };

  const p1Sets = match.score1 && match.score2
    ? match.score1.filter((s, i) => s > (match.score2![i] ?? 0)).length : 0;
  const p2Sets = match.score1 && match.score2
    ? match.score2.filter((s, i) => s > (match.score1![i] ?? 0)).length : 0;
  const scheduledLabel = match.scheduledAt
    ? format(match.scheduledAt.toDate(), "EEE dd/MM 'às' HH:mm", { locale: ptBR })
    : null;
  const filledLiveSets = sets.filter(s => s.a !== '' && s.b !== '');
  const liveWinner = filledLiveSets.length > 0
    ? determineWinner(
      match.p1,
      match.p2,
      filledLiveSets.map(s => parseInt(s.a) || 0),
      filledLiveSets.map(s => parseInt(s.b) || 0)
    )
    : null;
  const visualWinner = liveWinner || match.winner || null;

  return (
    <Layout title="Partida">
      <div className="space-y-5">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-secondary">
          <ChevronLeft className="w-4 h-4" />Voltar
        </button>

        {/* Match info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge match={match} size="md" />
            {/* Status badges */}
            <div className="flex flex-wrap justify-end gap-1">
              {isCompleted ? (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  Finalizado
                </span>
              ) : null}
            </div>
          </div>

          {/* Unified match view */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center gap-1.5 justify-start min-w-0">
                {visualWinner === match.p1 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                <PlayerName
                  name={match.p1}
                  className={`font-lexend text-xl leading-none text-left ${visualWinner === match.p1 ? 'font-extrabold text-navy-900' : visualWinner === match.p2 ? 'font-medium text-slate-600' : 'font-bold text-on-surface/70'}`}
                  keepColor={isCompleted && visualWinner === match.p1}
                  dotSize="md"
                  dotClassName={visualWinner && visualWinner !== match.p1 ? 'bg-slate-400' : 'bg-primary'}
                />
              </div>
              <span className="text-xs uppercase font-bold text-secondary">vs</span>
              <div className="flex items-center gap-1.5 justify-end min-w-0">
                <PlayerName
                  name={match.p2}
                  className={`font-lexend text-xl leading-none text-right ${visualWinner === match.p2 ? 'font-extrabold text-navy-900' : visualWinner === match.p1 ? 'font-medium text-slate-600' : 'font-bold text-on-surface/70'}`}
                  keepColor={isCompleted && visualWinner === match.p2}
                  dotSize="md"
                  dotClassName={visualWinner && visualWinner !== match.p2 ? 'bg-slate-400' : 'bg-primary'}
                />
                {visualWinner === match.p2 && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
              </div>
            </div>

            <div className="border-t border-border-muted/70" />
            {!playersDefined && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800">
                  Esta partida ainda não tem jogadores definidos nos dois lados.
                  Agendamento e resultado serão liberados quando ambos forem definidos.
                </p>
              </div>
            )}

            {canEdit ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">Horário</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={schedDate}
                    onChange={e => setSchedDate(e.target.value)}
                    className="w-full border border-border-muted rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  />
                  <input
                    type="time"
                    value={schedTime}
                    onChange={e => setSchedTime(e.target.value)}
                    className="w-full border border-border-muted rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-secondary">Horário: {scheduledLabel ?? 'pendente'}</p>
            )}

            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">Resultado</p>
              {['Set 1', 'Set 2', 'Tiebreak'].map((setLabel, setIdx) => {
                const p1Value = sets[setIdx].a;
                const p2Value = sets[setIdx].b;
                const p1Score = match.score1?.[setIdx];
                const p2Score = match.score2?.[setIdx];

                return (
                  <div key={setLabel} className="grid grid-cols-[48px_1fr_72px_1fr_48px] gap-2.5 items-center">
                    {canEditResult ? (
                      <SetRow
                        label={`p1-${setIdx}`}
                        value={p1Value}
                        onChange={v => setSets(prev => prev.map((x, j) => j === setIdx ? { ...x, a: v } : x))}
                        emphasized={visualWinner === match.p1}
                      />
                    ) : (
                      <span className={`w-12 h-10 flex items-center justify-center rounded-lg text-sm border border-border-muted bg-white ${visualWinner === match.p1 ? 'font-bold text-navy-900' : 'font-medium text-slate-600'}`}>
                        {typeof p1Score === 'number' ? p1Score : '-'}
                      </span>
                    )}
                    <span />
                    <span className="text-[11px] uppercase font-bold text-secondary text-center whitespace-nowrap">{setLabel}</span>
                    <span />
                    {canEditResult ? (
                      <SetRow
                        label={`p2-${setIdx}`}
                        value={p2Value}
                        onChange={v => setSets(prev => prev.map((x, j) => j === setIdx ? { ...x, b: v } : x))}
                        emphasized={visualWinner === match.p2}
                      />
                    ) : (
                      <span className={`w-12 h-10 flex items-center justify-center rounded-lg text-sm border border-border-muted bg-white ${visualWinner === match.p2 ? 'font-bold text-navy-900' : 'font-medium text-slate-600'}`}>
                        {typeof p2Score === 'number' ? p2Score : '-'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {isCompleted && (
              <p className="text-xs font-semibold text-navy-900">
                Resultado: {match.p1} {p1Sets} x {p2Sets} {match.p2}
              </p>
            )}
          </div>
        </div>

        {/* WhatsApp contacts */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Contato</p>
          {match.participants.length >= 2 ? (
            <div className="grid grid-cols-2 gap-3 items-start">
              <div className="justify-self-start">
                <WhatsAppBtn playerName={match.participants[0]} />
              </div>
              <div className="justify-self-end">
                <WhatsAppBtn playerName={match.participants[1]} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 items-start">
              <div className="justify-self-start">
                <WhatsAppBtn playerName={match.p1} />
              </div>
              <div className="justify-self-end">
                <WhatsAppBtn playerName={match.p2} />
              </div>
            </div>
          )}
        </div>

        {/* Deadline warning */}
        {deadlinePassed && !isAdmin && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">Prazo de edição encerrado para esta rodada.</p>
          </div>
        )}

        {/* Save action */}
        {(canEdit || canEditResult) && (
          <div className="space-y-2.5">
            {isEditingExisting && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Alterar este resultado irá atualizar automaticamente o chaveamento. A próxima partida afetada será reiniciada.
                </p>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={savingResult}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {savingResult ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default MatchDetail;
