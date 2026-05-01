import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllMatches, setKnockoutParticipants } from '../lib/matchService';
import { computeGroupStandings, getBestThirds } from '../lib/standingsService';
import { Match, MatchStatus, GroupStanding, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Trophy, ChevronRight, CheckCircle2, Shield } from 'lucide-react';
import {
  CATEGORY_A_GROUPS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS,
  CATEGORY_COLORS, GROUP_COLOR_CLASSES, ROUND_ORDER
} from '../constants/tournamentData';

type CatTab = Category;
type SubTab = 'grupos' | 'chave';

const isTBD = (name: string) => name.includes('º') || name.startsWith('Venc.') || name.startsWith('Melhor');

// ── Group standings table ──────────────────────────────────────────────────
const StandingsTable: React.FC<{ standings: GroupStanding[]; groupNum: number }> = ({ standings, groupNum }) => {
  const gc = GROUP_COLOR_CLASSES[groupNum] || GROUP_COLOR_CLASSES[1];
  return (
    <div className="bg-white border border-border-muted rounded-2xl overflow-hidden">
      <div className={`${gc.bg} px-4 py-2 flex items-center gap-2`}>
        <span className="text-white font-lexend font-bold text-xs uppercase tracking-wider">Grupo {groupNum}</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-muted">
            <th className="text-left px-3 py-2 text-secondary font-semibold">Jogador</th>
            <th className="px-2 py-2 text-center text-secondary font-semibold">P</th>
            <th className="px-2 py-2 text-center text-secondary font-semibold">V</th>
            <th className="px-2 py-2 text-center text-secondary font-semibold">D</th>
            <th className="px-2 py-2 text-center text-secondary font-semibold">S</th>
            <th className="px-2 py-2 text-center text-secondary font-semibold">G</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => (
            <tr key={s.player} className={`border-b border-border-muted last:border-0 ${idx < 2 ? gc.light : ''}`}>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${idx < 2 ? gc.bg + ' text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <span className={`font-semibold ${idx < 2 ? 'text-navy-900' : 'text-secondary'}`}>{s.player}</span>
                  {idx < 2 && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                </div>
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-navy-900">{s.points}</td>
              <td className="px-2 py-2.5 text-center text-green-600 font-semibold">{s.wins}</td>
              <td className="px-2 py-2.5 text-center text-red-400 font-semibold">{s.losses}</td>
              <td className="px-2 py-2.5 text-center text-secondary">{s.setsWon}-{s.setsLost}</td>
              <td className="px-2 py-2.5 text-center text-secondary">{s.gamesWon}-{s.gamesLost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Knockout match card ─────────────────────────────────────────────────────
const KOMatch: React.FC<{ match: Match; onClick: () => void }> = ({ match, onClick }) => {
  const isCompleted = match.status === MatchStatus.COMPLETED;
  const tbd1 = isTBD(match.p1);
  const tbd2 = isTBD(match.p2);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-border-muted rounded-xl p-3 active:bg-slate-50 transition-colors"
    >
      <div className="text-[9px] text-secondary font-bold uppercase mb-2">J{match.matchNum}</div>
      <div className="space-y-1">
        {[
          { name: match.p1, score: match.score1, winner: match.winner, tbd: tbd1 },
          { name: match.p2, score: match.score2, winner: match.winner, tbd: tbd2 },
        ].map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className={`text-sm flex-1 min-w-0 truncate ${p.tbd ? 'text-secondary italic text-xs' : p.winner === p.name ? 'font-bold text-navy-900' : 'text-on-surface/70'}`}>
              {p.name}
            </span>
            {isCompleted && p.score && (
              <div className="flex gap-0.5 shrink-0">
                {p.score.map((s, j) => (
                  <span key={j} className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${p.winner === p.name ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{s}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </button>
  );
};

// ── Knockout bracket section ────────────────────────────────────────────────
const KOSection: React.FC<{ round: string; matches: Match[]; onMatch: (m: Match) => void }> = ({ round, matches, onMatch }) => (
  <div className="space-y-2">
    <h3 className="font-lexend font-bold text-xs text-secondary uppercase tracking-wider">{round}</h3>
    <div className="grid grid-cols-2 gap-2">
      {matches.map(m => (
        <KOMatch key={m.id} match={m} onClick={() => onMatch(m)} />
      ))}
    </div>
  </div>
);

// ── Admin: advance group stage ───────────────────────────────────────────────
const AdvanceButton: React.FC<{
  category: Category;
  allMatches: Match[];
  onAdvanced: () => void;
  updatedBy: string;
}> = ({ category, allMatches, onAdvanced, updatedBy }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const advance = async () => {
    setLoading(true);
    try {
      if (category === 'A') {
        const groups = CATEGORY_A_GROUPS;
        const standings: Record<number, GroupStanding[]> = {};
        Object.entries(groups).forEach(([g, players]) => {
          standings[Number(g)] = computeGroupStandings(allMatches, players, g, 'A');
        });
        const updates: Array<{ id: string; p1: string; p2: string; participants: string[] }> = [
          { id: 'A-QF-1', p1: standings[1][0].player, p2: standings[2][1].player, participants: [standings[1][0].player, standings[2][1].player] },
          { id: 'A-QF-2', p1: standings[2][0].player, p2: standings[1][1].player, participants: [standings[2][0].player, standings[1][1].player] },
          { id: 'A-QF-3', p1: standings[3][0].player, p2: standings[4][1].player, participants: [standings[3][0].player, standings[4][1].player] },
          { id: 'A-QF-4', p1: standings[4][0].player, p2: standings[3][1].player, participants: [standings[4][0].player, standings[3][1].player] },
        ];
        for (const u of updates) await setKnockoutParticipants(u.id, u.p1, u.p2, u.participants, updatedBy);
      }

      if (category === 'B') {
        const groups = CATEGORY_B_GROUPS;
        const standings: Record<number, GroupStanding[]> = {};
        Object.entries(groups).forEach(([g, players]) => {
          standings[Number(g)] = computeGroupStandings(allMatches, players, g, 'B');
        });
        const thirds = getBestThirds(standings);
        const t1 = thirds[0]?.player || 'Melhor 3º #1';
        const t2 = thirds[1]?.player || 'Melhor 3º #2';
        const t3 = thirds[2]?.player || 'Melhor 3º #3';
        const t4 = thirds[3]?.player || 'Melhor 3º #4';
        const g = (n: number, pos: number) => standings[n]?.[pos]?.player || `${pos + 1}º G${n}`;
        const updates = [
          { id: 'B-R16-1', p1: g(1, 0), p2: t2, participants: [g(1, 0), t2] },
          { id: 'B-R16-2', p1: g(2, 0), p2: g(5, 1), participants: [g(2, 0), g(5, 1)] },
          { id: 'B-R16-3', p1: g(3, 0), p2: t3, participants: [g(3, 0), t3] },
          { id: 'B-R16-4', p1: g(4, 0), p2: g(1, 1), participants: [g(4, 0), g(1, 1)] },
          { id: 'B-R16-5', p1: g(5, 0), p2: g(6, 1), participants: [g(5, 0), g(6, 1)] },
          { id: 'B-R16-6', p1: g(6, 0), p2: t1, participants: [g(6, 0), t1] },
          { id: 'B-R16-7', p1: g(3, 1), p2: g(2, 1), participants: [g(3, 1), g(2, 1)] },
          { id: 'B-R16-8', p1: g(4, 1), p2: t4, participants: [g(4, 1), t4] },
        ];
        for (const u of updates) await setKnockoutParticipants(u.id, u.p1, u.p2, u.participants, updatedBy);
      }

      if (category === 'C') {
        const groups = CATEGORY_C_GROUPS;
        const s1 = computeGroupStandings(allMatches, groups[1], '1', 'C');
        const s2 = computeGroupStandings(allMatches, groups[2], '2', 'C');
        const updates = [
          { id: 'C-SF-1', p1: s1[0].player, p2: s2[1].player, participants: [s1[0].player, s2[1].player] },
          { id: 'C-SF-2', p1: s2[0].player, p2: s1[1].player, participants: [s2[0].player, s1[1].player] },
        ];
        for (const u of updates) await setKnockoutParticipants(u.id, u.p1, u.p2, u.participants, updatedBy);
      }

      setDone(true);
      onAdvanced();
    } catch (e) {
      console.error(e);
      alert('Erro ao avançar fase.');
    } finally {
      setLoading(false);
    }
  };

  if (category === 'Duplas') return null;

  return (
    <button
      onClick={advance}
      disabled={loading || done}
      className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
    >
      <Shield className="w-3.5 h-3.5" />
      {done ? 'Fase confirmada!' : loading ? 'Avançando...' : 'Confirmar Classificação'}
    </button>
  );
};

// ── Main Brackets page ──────────────────────────────────────────────────────
const Brackets: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, profile } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [catTab, setCatTab] = useState<CatTab>('A');
  const [subTab, setSubTab] = useState<SubTab>('grupos');

  const loadMatches = () => fetchAllMatches().then(setAllMatches).finally(() => setLoading(false));
  useEffect(() => { loadMatches(); }, []);

  const catMatches = useMemo(() => allMatches.filter(m => m.category === catTab), [allMatches, catTab]);

  const groupMatches = useMemo(() => catMatches.filter(m => m.round === 'Grupos' || m.round === 'Play-in'), [catMatches]);
  const knockoutMatches = useMemo(() =>
    catMatches.filter(m => m.round !== 'Grupos').sort((a, b) => {
      const ao = ROUND_ORDER[a.round] ?? 0;
      const bo = ROUND_ORDER[b.round] ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.matchNum ?? 0) - (b.matchNum ?? 0);
    }), [catMatches]);

  const groupDefs: Record<number, string[]> = catTab === 'A' ? CATEGORY_A_GROUPS
    : catTab === 'B' ? CATEGORY_B_GROUPS
    : catTab === 'C' ? CATEGORY_C_GROUPS
    : {};

  const groupStandings = useMemo(() => {
    if (catTab === 'Duplas') return {};
    const result: Record<number, GroupStanding[]> = {};
    Object.entries(groupDefs).forEach(([g, players]) => {
      result[Number(g)] = computeGroupStandings(allMatches, players, g, catTab);
    });
    return result;
  }, [allMatches, catTab, groupDefs]);

  const knockoutByRound = useMemo(() => {
    const rounds: Record<string, Match[]> = {};
    knockoutMatches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });
    return rounds;
  }, [knockoutMatches]);

  const catColors = CATEGORY_COLORS[catTab] || CATEGORY_COLORS.A;

  const hasDuplas = catTab === 'Duplas';

  return (
    <Layout title="Chaves">
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['A', 'B', 'C', 'Duplas'] as CatTab[]).map(c => {
            const cc = CATEGORY_COLORS[c];
            return (
              <button
                key={c}
                onClick={() => { setCatTab(c); setSubTab(c === 'Duplas' ? 'chave' : 'grupos'); }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${catTab === c ? cc.bg + ' text-white' : 'bg-white border border-border-muted text-secondary'}`}
              >
                {c === 'Duplas' ? 'Duplas' : `Cat ${c}`}
              </button>
            );
          })}
        </div>

        {/* Sub tabs (not for Duplas) */}
        {!hasDuplas && (
          <div className="flex gap-2">
            {(['grupos', 'chave'] as SubTab[]).map(t => (
              <button
                key={t}
                onClick={() => setSubTab(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${subTab === t ? 'bg-navy-900 text-white border-navy-900' : 'bg-white border-border-muted text-secondary'}`}
              >
                {t === 'grupos' ? 'Grupos' : 'Mata-Mata'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Groups tab */}
            {(subTab === 'grupos' && !hasDuplas) && (
              <div className="space-y-4">
                {isAdmin && (
                  <AdvanceButton
                    category={catTab}
                    allMatches={allMatches}
                    onAdvanced={loadMatches}
                    updatedBy={profile?.playerName || 'Admin'}
                  />
                )}
                {Object.entries(groupStandings).map(([g, standings]) => (
                  <StandingsTable key={g} standings={standings} groupNum={Number(g)} />
                ))}
                <p className="text-[10px] text-secondary text-center">P=Pontos · V=Vitórias · D=Derrotas · S=Sets · G=Games</p>
              </div>
            )}

            {/* Knockout tab or Duplas */}
            {(subTab === 'chave' || hasDuplas) && (
              <div className="space-y-6">
                {hasDuplas && (
                  <div className="space-y-2">
                    <h3 className="font-lexend font-bold text-xs text-secondary uppercase tracking-wider">Play-in</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {knockoutMatches.filter(m => m.round === 'Play-in').map(m => (
                        <KOMatch key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
                      ))}
                    </div>
                  </div>
                )}

                {Object.entries(knockoutByRound)
                  .filter(([round]) => !hasDuplas || round !== 'Play-in')
                  .sort(([a], [b]) => (ROUND_ORDER[a] ?? 0) - (ROUND_ORDER[b] ?? 0))
                  .map(([round, matches]) => (
                    <KOSection key={round} round={round} matches={matches} onMatch={m => navigate(`/match/${m.id}`)} />
                  ))
                }
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Brackets;
