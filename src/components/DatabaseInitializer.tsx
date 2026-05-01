import React, { useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteAllMatches } from '../lib/matchService';
import { Match, MatchStatus, Category } from '../types';
import { CATEGORY_A_GROUPS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS } from '../constants/tournamentData';
import { AlertTriangle, Database, CheckCircle } from 'lucide-react';

type MatchTemplate = Omit<Match, 'id'>;

const makeGroupMatches = (
  category: Category,
  groups: Record<number, string[]>
): Array<{ id: string; data: MatchTemplate }> => {
  const out: Array<{ id: string; data: MatchTemplate }> = [];
  Object.entries(groups).forEach(([g, players]) => {
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        out.push({
          id: `${category}-G${g}-${i}-${j}`,
          data: {
            category,
            round: 'Grupos',
            group: g,
            p1: players[i],
            p2: players[j],
            status: MatchStatus.PENDING,
            participants: [players[i], players[j]],
          },
        });
      }
    }
  });
  return out;
};

const KO: Array<{ id: string; data: MatchTemplate }> = [
  // ─── Cat A ───────────────────────────────────────────────────────────────
  { id: 'A-QF-1', data: { category: 'A', round: 'Quartas',    matchNum: 1,  p1: '1º Grupo 1',  p2: '2º Grupo 2',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-QF-2', data: { category: 'A', round: 'Quartas',    matchNum: 2,  p1: '1º Grupo 2',  p2: '2º Grupo 1',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-QF-3', data: { category: 'A', round: 'Quartas',    matchNum: 3,  p1: '1º Grupo 3',  p2: '2º Grupo 4',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-QF-4', data: { category: 'A', round: 'Quartas',    matchNum: 4,  p1: '1º Grupo 4',  p2: '2º Grupo 3',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-SF-1', data: { category: 'A', round: 'Semifinais', matchNum: 5,  p1: 'Venc. QF-1',  p2: 'Venc. QF-2',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-SF-2', data: { category: 'A', round: 'Semifinais', matchNum: 6,  p1: 'Venc. QF-3',  p2: 'Venc. QF-4',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'A-F',    data: { category: 'A', round: 'Final',      matchNum: 7,  p1: 'Venc. SF-1',  p2: 'Venc. SF-2',  status: MatchStatus.PENDING, participants: [] } },
  // ─── Cat B ───────────────────────────────────────────────────────────────
  { id: 'B-R16-1', data: { category: 'B', round: 'Oitavas',   matchNum: 1,  p1: '1º Grupo 1',  p2: 'Melhor 3º #2', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-2', data: { category: 'B', round: 'Oitavas',   matchNum: 2,  p1: '1º Grupo 2',  p2: '2º Grupo 5',   status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-3', data: { category: 'B', round: 'Oitavas',   matchNum: 3,  p1: '1º Grupo 3',  p2: 'Melhor 3º #3', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-4', data: { category: 'B', round: 'Oitavas',   matchNum: 4,  p1: '1º Grupo 4',  p2: '2º Grupo 1',   status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-5', data: { category: 'B', round: 'Oitavas',   matchNum: 5,  p1: '1º Grupo 5',  p2: '2º Grupo 6',   status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-6', data: { category: 'B', round: 'Oitavas',   matchNum: 6,  p1: '1º Grupo 6',  p2: 'Melhor 3º #1', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-7', data: { category: 'B', round: 'Oitavas',   matchNum: 7,  p1: '2º Grupo 3',  p2: '2º Grupo 2',   status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-R16-8', data: { category: 'B', round: 'Oitavas',   matchNum: 8,  p1: '2º Grupo 4',  p2: 'Melhor 3º #4', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-QF-1',  data: { category: 'B', round: 'Quartas',   matchNum: 9,  p1: 'Venc. R16-1', p2: 'Venc. R16-8', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-QF-2',  data: { category: 'B', round: 'Quartas',   matchNum: 10, p1: 'Venc. R16-2', p2: 'Venc. R16-7', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-QF-3',  data: { category: 'B', round: 'Quartas',   matchNum: 11, p1: 'Venc. R16-3', p2: 'Venc. R16-6', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-QF-4',  data: { category: 'B', round: 'Quartas',   matchNum: 12, p1: 'Venc. R16-4', p2: 'Venc. R16-5', status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-SF-1',  data: { category: 'B', round: 'Semifinais',matchNum: 13, p1: 'Venc. QF-1',  p2: 'Venc. QF-4',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-SF-2',  data: { category: 'B', round: 'Semifinais',matchNum: 14, p1: 'Venc. QF-2',  p2: 'Venc. QF-3',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'B-F',     data: { category: 'B', round: 'Final',     matchNum: 15, p1: 'Venc. SF-1',  p2: 'Venc. SF-2',  status: MatchStatus.PENDING, participants: [] } },
  // ─── Cat C ───────────────────────────────────────────────────────────────
  { id: 'C-SF-1', data: { category: 'C', round: 'Semifinais', matchNum: 1, p1: '1º Grupo 1', p2: '2º Grupo 2', status: MatchStatus.PENDING, participants: [] } },
  { id: 'C-SF-2', data: { category: 'C', round: 'Semifinais', matchNum: 2, p1: '1º Grupo 2', p2: '2º Grupo 1', status: MatchStatus.PENDING, participants: [] } },
  { id: 'C-F',    data: { category: 'C', round: 'Final',      matchNum: 3, p1: 'Venc. SF-1', p2: 'Venc. SF-2', status: MatchStatus.PENDING, participants: [] } },
  // ─── Duplas Play-in ──────────────────────────────────────────────────────
  { id: 'D-PI-1', data: { category: 'Duplas', round: 'Play-in', matchNum: 1, p1: 'Pedro / Carla',       p2: 'Igor / Fortes',       status: MatchStatus.PENDING, participants: ['Pedro','Carla','Igor','Fortes'] } },
  { id: 'D-PI-2', data: { category: 'Duplas', round: 'Play-in', matchNum: 2, p1: 'Paulo / Osvaldo',      p2: 'Thales / Marcos',     status: MatchStatus.PENDING, participants: ['Paulo','Osvaldo','Thales','Marcos'] } },
  { id: 'D-PI-3', data: { category: 'Duplas', round: 'Play-in', matchNum: 3, p1: 'Adriano / Matera',     p2: 'Matheus / Xico',      status: MatchStatus.PENDING, participants: ['Adriano','Matera','Matheus','Xico'] } },
  { id: 'D-PI-4', data: { category: 'Duplas', round: 'Play-in', matchNum: 4, p1: 'Ícaro / Rodrigo',      p2: 'Allan / Aninha',      status: MatchStatus.PENDING, participants: ['Ícaro','Rodrigo','Allan','Aninha'] } },
  { id: 'D-PI-5', data: { category: 'Duplas', round: 'Play-in', matchNum: 5, p1: 'Gustavo / João Pedro', p2: 'Lamega / Alexandre',  status: MatchStatus.PENDING, participants: ['Gustavo','João Pedro','Lamega','Alexandre'] } },
  // ─── Duplas Quartas ──────────────────────────────────────────────────────
  { id: 'D-QF-1', data: { category: 'Duplas', round: 'Quartas', matchNum: 6,  p1: 'Amauri / Guto',    p2: 'Venc. PI-1',  status: MatchStatus.PENDING, participants: ['Amauri','Guto'] } },
  { id: 'D-QF-2', data: { category: 'Duplas', round: 'Quartas', matchNum: 7,  p1: 'Venc. PI-2',       p2: 'Venc. PI-3',  status: MatchStatus.PENDING, participants: [] } },
  { id: 'D-QF-3', data: { category: 'Duplas', round: 'Quartas', matchNum: 8,  p1: 'Alex / Evandro',   p2: 'Venc. PI-4',  status: MatchStatus.PENDING, participants: ['Alex','Evandro'] } },
  { id: 'D-QF-4', data: { category: 'Duplas', round: 'Quartas', matchNum: 9,  p1: 'Saito / Fernando', p2: 'Venc. PI-5',  status: MatchStatus.PENDING, participants: ['Saito','Fernando'] } },
  // ─── Duplas Semis / Final ────────────────────────────────────────────────
  { id: 'D-SF-1', data: { category: 'Duplas', round: 'Semifinais', matchNum: 10, p1: 'Venc. QF-1', p2: 'Venc. QF-2', status: MatchStatus.PENDING, participants: [] } },
  { id: 'D-SF-2', data: { category: 'Duplas', round: 'Semifinais', matchNum: 11, p1: 'Venc. QF-3', p2: 'Venc. QF-4', status: MatchStatus.PENDING, participants: [] } },
  { id: 'D-F',    data: { category: 'Duplas', round: 'Final',      matchNum: 12, p1: 'Venc. SF-1', p2: 'Venc. SF-2', status: MatchStatus.PENDING, participants: [] } },
];

const DatabaseInitializer: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const initialize = async () => {
    setStatus('running');
    try {
      setMessage('Deletando partidas existentes...');
      await deleteAllMatches();

      const groupMatches = [
        ...makeGroupMatches('A', CATEGORY_A_GROUPS),
        ...makeGroupMatches('B', CATEGORY_B_GROUPS),
        ...makeGroupMatches('C', CATEGORY_C_GROUPS),
      ];
      const allMatches = [...groupMatches, ...KO];
      const ref = collection(db, 'matches');

      for (let i = 0; i < allMatches.length; i += 400) {
        const batch = writeBatch(db);
        allMatches.slice(i, i + 400).forEach(({ id, data }) => batch.set(doc(ref, id), data));
        await batch.commit();
        setMessage(`Criando partidas... ${Math.min(i + 400, allMatches.length)}/${allMatches.length}`);
      }

      setMessage(`✓ ${allMatches.length} partidas criadas!`);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setMessage('Erro: ' + (e instanceof Error ? e.message : String(e)));
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border-muted p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-secondary" />
        <h3 className="font-lexend font-bold text-navy-900">Inicialização do Banco</h3>
      </div>
      <p className="text-sm text-secondary">
        Cria todas as partidas do torneio no Firestore. <span className="font-semibold text-red-600">Apaga todos os dados existentes.</span>
      </p>

      {!confirmed && status === 'idle' && (
        <button
          onClick={() => setConfirmed(true)}
          className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <AlertTriangle className="w-4 h-4" />
          Clique para habilitar inicialização
        </button>
      )}

      {(confirmed || status !== 'idle') && (
        <button
          onClick={initialize}
          disabled={status === 'running'}
          className="w-full bg-navy-900 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-40"
        >
          {status === 'running' ? 'Inicializando...' : 'Inicializar Banco'}
        </button>
      )}

      {message && (
        <p className={`text-sm font-mono flex items-center gap-2 ${
          status === 'error' ? 'text-red-600' : status === 'done' ? 'text-green-600' : 'text-secondary'
        }`}>
          {status === 'done' && <CheckCircle className="w-4 h-4" />}
          {message}
        </p>
      )}
    </div>
  );
};

export default DatabaseInitializer;
