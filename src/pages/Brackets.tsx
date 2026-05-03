import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllMatches } from '../lib/matchService';
import { computeGroupStandings } from '../lib/standingsService';
import { Match, GroupStanding, Category } from '../types';
import Layout from '../components/Layout';
import { CheckCircle2 } from 'lucide-react';
import {
  CATEGORY_A_GROUPS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS,
  CATEGORY_COLORS, GROUP_COLOR_CLASSES, ROUND_ORDER
} from '../constants/tournamentData';
import BracketFlow from '../components/BracketFlow';
import { LAYOUT_SINGLES, LAYOUT_DUPLAS } from '../lib/bracketLayouts';

type CatTab = Category;
type SubTab = 'grupos' | 'chave';

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

// ── Main Brackets page ──────────────────────────────────────────────────────
const Brackets: React.FC = () => {
  const navigate = useNavigate();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [catTab, setCatTab] = useState<CatTab>('A');
  const [subTab, setSubTab] = useState<SubTab>('grupos');

  useEffect(() => {
    fetchAllMatches().then(setAllMatches).finally(() => setLoading(false));
  }, []);

  const catMatches = useMemo(() => allMatches.filter(m => m.category === catTab), [allMatches, catTab]);

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

  const hasDuplas = catTab === 'Duplas';

  const bracketColumns = !hasDuplas && (catTab === 'A' || catTab === 'B' || catTab === 'C')
    ? LAYOUT_SINGLES[catTab]
    : hasDuplas
      ? LAYOUT_DUPLAS
      : null;

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
                {Object.entries(groupStandings).map(([g, standings]) => (
                  <StandingsTable key={g} standings={standings} groupNum={Number(g)} />
                ))}
                <p className="text-[10px] text-secondary text-center">P=Pontos · V=Vitórias · D=Derrotas · S=Sets · G=Games</p>
              </div>
            )}

            {/* Knockout tab or Duplas */}
            {(subTab === 'chave' || hasDuplas) && bracketColumns && (
              <div className="space-y-2">
                {bracketColumns.length > 2 && (
                  <p className="text-[10px] text-secondary text-center">Deslize horizontalmente para ver todas as fases</p>
                )}
                <BracketFlow
                  columns={bracketColumns}
                  matches={knockoutMatches}
                  onMatch={m => navigate(`/match/${m.id}`)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Brackets;
