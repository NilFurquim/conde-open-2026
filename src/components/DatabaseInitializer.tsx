import React, { useState } from 'react';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, MatchStatus } from '../types';
import { CATEGORY_A_PLAYERS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS, DUPLAS_TEAMS } from '../constants/tournamentData';

const DatabaseInitializer: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const initialize = async () => {
    setStatus('Iniciando...');
    const batch = writeBatch(db);
    const matchesRef = collection(db, 'matches');

    try {
      // 1. Cat A Round Robin (Simplified for demo)
      // Group 1: 0-3 vs 1-2 etc.
      for (let g = 0; g < 4; g++) {
        const groupPlayers = CATEGORY_A_PLAYERS.slice(g * 4, (g + 1) * 4);
        for (let i = 0; i < groupPlayers.length; i++) {
          for (let j = i + 1; j < groupPlayers.length; j++) {
            const id = `match-A-G${g+1}-${i}-${j}`;
            const m: Match = {
              id,
              category: 'A',
              round: 'Grupos',
              group: (g + 1).toString(),
              p1: groupPlayers[i],
              p2: groupPlayers[j],
              status: MatchStatus.PENDING,
              participants: [groupPlayers[i], groupPlayers[j]]
            };
            batch.set(doc(matchesRef, id), m);
          }
        }
      }

      // 2. Cat C Round Robin
      Object.entries(CATEGORY_C_GROUPS).forEach(([group, players]) => {
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            const id = `match-C-G${group}-${i}-${j}`;
            const m: Match = {
              id,
              category: 'C',
              round: 'Grupos',
              group,
              p1: players[i],
              p2: players[j],
              status: MatchStatus.PENDING,
              participants: [players[i], players[j]]
            };
            batch.set(doc(matchesRef, id), m);
          }
        }
      });

      // 3. Duplas Play-in
      const duplasMatches = [
        { id: 'duplas-playin-1', p1: 'Pedro / Carla', p2: 'Igor / Fortes' },
        { id: 'duplas-playin-2', p1: 'Paulo / Osvaldo', p2: 'Thales / Marcos' },
        { id: 'duplas-playin-3', p1: 'Adriano / Matera', p2: 'Matheus / Xico' },
        { id: 'duplas-playin-4', p1: 'Icaro / Rodrigo', p2: 'Allan / Aninha' },
        { id: 'duplas-playin-5', p1: 'Gustavo / Joao Pedro', p2: 'Lamega / Alexandre' },
      ];

      duplasMatches.forEach(dm => {
        batch.set(doc(matchesRef, dm.id), {
          ...dm,
          category: 'Duplas',
          round: 'Play-in',
          status: MatchStatus.PENDING,
          participants: [dm.p1, dm.p2]
        });
      });

      await batch.commit();
      setStatus('Banco inicializado com sucesso!');
    } catch (e) {
      console.error(e);
      setStatus('Erro: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg m-4">
      <h2 className="text-xl font-bold mb-4">Configuração Inicial do Banco</h2>
      <p className="text-sm text-slate-500 mb-6">Este botão irá carregar os jogadores e partidas iniciais conforme as regras fornecidas.</p>
      <button 
        onClick={initialize}
        className="bg-navy-900 text-primary-container px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs"
      >
        Limpar e Inicializar Banco
      </button>
      {status && <p className="mt-4 font-mono text-xs text-primary">{status}</p>}
    </div>
  );
};

export default DatabaseInitializer;
