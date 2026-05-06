import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import CategoryFilterStrip from '../components/CategoryFilterStrip';
import SearchableParticipantCombobox from '../components/SearchableParticipantCombobox';
import { fetchAllMatches } from '../lib/matchService';
import type { Match, Category } from '../types';
import {
  computeCategoryLeaderboard,
  computeEntityStats,
  getEntitiesInCategory,
  type PlayerCategoryStats,
} from '../lib/playerStatsService';
import type { CategoryFilterKey } from '../constants/tournamentData';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ALL_KEY = '';

type SortKey = 'name' | 'j' | 'v' | 'd' | 'sets' | 'games';
type SortDir = 'asc' | 'desc';

function sortRows(rows: PlayerCategoryStats[], key: SortKey, dir: SortDir): PlayerCategoryStats[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === 'name') {
      const c = a.entityLabel.localeCompare(b.entityLabel, 'pt-BR');
      return sign * c;
    }
    let av = 0;
    let bv = 0;
    switch (key) {
      case 'j':
        av = a.matchesPlayed;
        bv = b.matchesPlayed;
        break;
      case 'v':
        av = a.wins;
        bv = b.wins;
        break;
      case 'd':
        av = a.losses;
        bv = b.losses;
        break;
      case 'sets':
        av = a.setsWon - a.setsLost;
        bv = b.setsWon - b.setsLost;
        break;
      case 'games':
        av = a.gamesWon - a.gamesLost;
        bv = b.gamesWon - b.gamesLost;
        break;
      default:
        break;
    }
    if (av !== bv) return sign * (av - bv);
    return a.entityLabel.localeCompare(b.entityLabel, 'pt-BR');
  });
}

const SortTh: React.FC<{
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'center';
}> = ({ label, sortKey, activeKey, dir, onSort, align = 'center' }) => {
  const active = activeKey === sortKey;
  return (
    <th className={`px-2 py-2.5 font-lexend font-bold text-secondary ${align === 'left' ? 'text-left' : 'text-center'}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex w-full items-center gap-0.5 rounded-md px-1 py-0.5 -mx-1 transition-colors hover:bg-slate-200/80 hover:text-navy-900 ${align === 'left' ? 'justify-start' : 'justify-center'}`}
      >
        <span>{label}</span>
        {active && (dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" />)}
      </button>
    </th>
  );
};

const Stats: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('A');
  const [entityKey, setEntityKey] = useState<string>(ALL_KEY);
  /** Texto livre na caixa única + filtro da lista; com “todos” filtra só a tabela. */
  const [comboQuery, setComboQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('v');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchAllMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setEntityKey(ALL_KEY);
    setComboQuery('');
    setDropdownOpen(false);
    setSortKey('v');
    setSortDir('desc');
  }, [category]);

  const entities = useMemo(() => getEntitiesInCategory(category), [category]);

  const leaderboard = useMemo(
    () => computeCategoryLeaderboard(matches, category),
    [matches, category],
  );

  const selectedStats = useMemo(() => {
    if (!entityKey) return null;
    return computeEntityStats(matches, category, entityKey);
  }, [matches, category, entityKey]);

  const rawRows = useMemo(() => {
    if (entityKey) return selectedStats ? [selectedStats] : [];
    return leaderboard;
  }, [entityKey, leaderboard, selectedStats]);

  const filteredRows = useMemo(() => {
    if (entityKey) return rawRows;
    const term = comboQuery.trim().toLowerCase();
    if (!term) return rawRows;
    return rawRows.filter(r => r.entityLabel.toLowerCase().includes(term));
  }, [rawRows, entityKey, comboQuery]);

  const displayRows = useMemo(
    () => sortRows(filteredRows, sortKey, sortDir),
    [filteredRows, sortKey, sortDir],
  );

  const rankForSelected = useMemo(() => {
    if (!entityKey) return null;
    const i = leaderboard.findIndex(r => r.entityLabel === entityKey);
    return i >= 0 ? i + 1 : null;
  }, [leaderboard, entityKey]);

  const entitySelectLabel = category === 'Duplas' ? 'Dupla' : 'Jogador';

  const allEntitiesLabel =
    category === 'Duplas' ? 'Todas as duplas' : 'Todos os jogadores';

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <Layout title="Estatísticas">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-secondary">Carregando partidas...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Estatísticas">
      <div className="space-y-5 pb-6">
        <p className="text-sm text-secondary leading-relaxed">
          Vitórias, derrotas e saldos de sets e games nas partidas já registradas nesta categoria.
        </p>

        <section className="space-y-2">
          <p className="font-lexend text-[10px] font-bold uppercase tracking-widest text-secondary">
            Categoria
          </p>
          <CategoryFilterStrip
            includeTodos={false}
            value={category as CategoryFilterKey}
            onChange={v => {
              if (v === 'TODOS') return;
              setCategory(v);
            }}
          />
        </section>

        <SearchableParticipantCombobox
          id="stats-player-combo"
          listBoxId="stats-player-combo-list"
          sectionLabel={entitySelectLabel}
          allOptionLabel={allEntitiesLabel}
          options={entities}
          selectedKey={entityKey}
          comboQuery={comboQuery}
          dropdownOpen={dropdownOpen}
          placeholder={
            category === 'Duplas'
              ? 'Todas as duplas ou digite para buscar…'
              : 'Todos os jogadores ou digite para buscar…'
          }
          onDropdownOpenChange={setDropdownOpen}
          onSelectedKeyChange={setEntityKey}
          onComboQueryChange={setComboQuery}
        />

        <p className="text-[10px] leading-snug text-secondary/70 px-0.5">
          {category === 'Duplas'
            ? 'Duplas: por nome do par na chave. Grupos + mata-mata onde houver resultado.'
            : `Cat. ${category}: por jogador. Grupos + mata-mata com resultado registrado.`}
        </p>

        <div className="overflow-x-auto rounded-2xl border border-border-muted bg-white shadow-sm">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b border-border-muted bg-slate-50">
                <th className="px-3 py-2.5 font-lexend font-bold text-secondary">#</th>
                <SortTh
                  label={category === 'Duplas' ? 'Dupla' : 'Jogador'}
                  sortKey="name"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  align="left"
                />
                <SortTh label="J" sortKey="j" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="V" sortKey="v" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="D" sortKey="d" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Sets" sortKey="sets" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Games" sortKey="games" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-secondary">
                    {rawRows.length === 0
                      ? 'Nenhuma partida com resultado nesta categoria ainda.'
                      : 'Nenhum resultado para esta busca.'}
                  </td>
                </tr>
              )}
              {displayRows.map((row, idx) => {
                const displayRank = entityKey ? (rankForSelected ?? '—') : idx + 1;
                const setBal = row.setsWon - row.setsLost;
                const gameBal = row.gamesWon - row.gamesLost;
                const setBalStr = `${setBal >= 0 ? '+' : ''}${setBal}`;
                const gameBalStr = `${gameBal >= 0 ? '+' : ''}${gameBal}`;
                return (
                  <tr key={row.entityLabel} className="border-b border-border-muted last:border-0">
                    <td className="px-3 py-2.5 font-bold text-navy-900">{displayRank}</td>
                    <td className="max-w-[140px] truncate px-3 py-2.5 font-semibold text-navy-900 sm:max-w-none">
                      {row.entityLabel}
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold text-navy-900">{row.matchesPlayed}</td>
                    <td className="px-2 py-2.5 text-center font-semibold text-green-700">{row.wins}</td>
                    <td className="px-2 py-2.5 text-center font-semibold text-red-600">{row.losses}</td>
                    <td className="px-2 py-2.5 text-center text-secondary whitespace-nowrap">
                      {row.setsWon}-{row.setsLost}
                      <span className={`ml-0.5 text-[10px] ${setBal > 0 ? 'text-green-700' : setBal < 0 ? 'text-red-600' : 'text-secondary'}`}>
                        ({setBalStr})
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center text-secondary whitespace-nowrap">
                      {row.gamesWon}-{row.gamesLost}
                      <span className={`ml-0.5 text-[10px] ${gameBal > 0 ? 'text-green-700' : gameBal < 0 ? 'text-red-600' : 'text-secondary'}`}>
                        ({gameBalStr})
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[10px] text-secondary">
          J = Jogos · V = Vitórias · D = Derrotas · Sets/Games ordenam pelo saldo (vitórias − derrotas no placar)
        </p>
      </div>
    </Layout>
  );
};

export default Stats;
