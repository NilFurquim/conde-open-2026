import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, MatchStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from '../components/MatchCard';
import { Plus, Bell } from 'lucide-react';
import Layout from '../components/Layout';
import DatabaseInitializer from '../components/DatabaseInitializer';

const Home: React.FC = () => {
  const { profile, isGuest, isAdmin } = useAuth();
  const [userPendingMatches, setUserPendingMatches] = useState<Match[]>([]);
  const [userNextMatches, setUserNextMatches] = useState<Match[]>([]);
  const [tournamentNextMatches, setTournamentNextMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple modal states
  const [actionMatch, setActionMatch] = useState<{ match: Match; actionType: 'schedule' | 'result' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const matchesRef = collection(db, 'matches');
      
      const qAllActive = query(
        matchesRef, 
        where('status', 'in', [MatchStatus.PENDING, MatchStatus.SCHEDULED]),
        limit(30)
      );
      const snapAllActive = await getDocs(qAllActive);
      const allActive = snapAllActive.docs.map(d => ({ id: d.id, ...d.data() } as Match));
      
      const now = new Date();
      const uPending: Match[] = [];
      const uNext: Match[] = [];
      const tNext: Match[] = [];

      allActive.forEach(m => {
        const isUserMatch = profile?.playerName && profile.role !== UserRole.GUEST && m.participants.includes(profile.playerName);
        const isPast = m.scheduledAt ? m.scheduledAt.toDate() < now : false;
        
        if (isUserMatch) {
          if (m.status === MatchStatus.PENDING || (m.status === MatchStatus.SCHEDULED && isPast)) {
            uPending.push(m);
          } else if (m.status === MatchStatus.SCHEDULED && !isPast) {
            uNext.push(m);
          }
        } else {
          if (m.status === MatchStatus.SCHEDULED && !isPast) {
            tNext.push(m);
          }
        }
      });
      
      setUserPendingMatches(uPending);
      setUserNextMatches(uNext);
      setTournamentNextMatches(tNext);

      // Live/Recent global
      const qRecent = query(matchesRef, where('status', '==', MatchStatus.COMPLETED), limit(5));
      const snapRecent = await getDocs(qRecent);
      setRecentMatches(snapRecent.docs.map(d => ({ id: d.id, ...d.data() } as Match)));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = async () => {
    try {
      const { setDoc } = await import('firebase/firestore');
      
      const match1Id = doc(collection(db, 'matches')).id;
      const match2Id = doc(collection(db, 'matches')).id;
      const match3Id = doc(collection(db, 'matches')).id;
      
      const p1Name = profile && profile.playerName ? profile.playerName : 'Jogador Local';

      const futureDate = Timestamp.fromDate(new Date(Date.now() + 86400000)); // tomorrow

      // 1. Pending match for the user
      await setDoc(doc(db, 'matches', match1Id), {
        id: match1Id,
        p1: 'M. Silva / R. Souza',
        p2: '',
        status: MatchStatus.PENDING,
        category: 'Duplas',
        round: 'Semi',
        participants: [p1Name, 'M. Silva / R. Souza']
      });

      // 2. Scheduled match for the user
      await setDoc(doc(db, 'matches', match2Id), {
        id: match2Id,
        p1: p1Name,
        p2: 'L. Mendonça',
        status: MatchStatus.SCHEDULED,
        scheduledAt: futureDate,
        court: 'Quadra 04',
        category: 'Cat B',
        round: 'Quartas',
        participants: [p1Name, 'L. Mendonça']
      });

      // 3. Tournament match (other players)
      await setDoc(doc(db, 'matches', match3Id), {
        id: match3Id,
        p1: 'Novak Djokovic',
        p2: 'Carlos Alcaraz',
        status: MatchStatus.SCHEDULED,
        scheduledAt: futureDate,
        court: 'Quadra 2',
        category: 'Master',
        round: 'Final',
        participants: ['Novak Djokovic', 'Carlos Alcaraz']
      });
      
      // 4. Completed match
      const match4Id = doc(collection(db, 'matches')).id;
      await setDoc(doc(db, 'matches', match4Id), {
        id: match4Id,
        p1: 'Rodrigo Faro',
        p2: p1Name,
        status: MatchStatus.COMPLETED,
        category: 'Cat A',
        round: '1a Rodada',
        participants: [p1Name, 'Rodrigo Faro']
      });
      
      await fetchData();
    } catch(e) {
      console.error(e);
      alert('Erro ao gerar dados');
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleActionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!actionMatch) return;
    try {
      const matchRef = doc(db, 'matches', actionMatch.match.id);
      
      if (actionMatch.actionType === 'schedule') {
        const court = (e.currentTarget.elements.namedItem('court') as HTMLInputElement).value;
        const dateStr = (e.currentTarget.elements.namedItem('date') as HTMLInputElement).value;
        
        let scheduledAt = Timestamp.now();
        if (dateStr) {
          scheduledAt = Timestamp.fromDate(new Date(dateStr));
        }

        await updateDoc(matchRef, {
          status: MatchStatus.SCHEDULED,
          court: court || 'Quadra 1',
          scheduledAt
        });
      } else {
        const s1 = (e.currentTarget.elements.namedItem('s1') as HTMLInputElement).value;
        const s2 = (e.currentTarget.elements.namedItem('s2') as HTMLInputElement).value;
        
        const score1Arr = [parseInt(s1)];
        const score2Arr = [parseInt(s2)];
        const winner = parseInt(s1) > parseInt(s2) ? actionMatch.match.p1 : actionMatch.match.p2;

        await updateDoc(matchRef, {
          status: MatchStatus.COMPLETED,
          score1: score1Arr,
          score2: score2Arr,
          winner
        });
      }
      
      setActionMatch(null);
      await fetchData(); // Refresh data
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar jogo.');
    }
  };

  return (
    <Layout title="Início">
      <main className="space-y-8">
        {/* Category Filters (Scrollable) */}
        <section className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
          {['Todos', 'Cat A', 'Duplas', 'Cat B', 'Master'].map((cat, idx) => (
            <button 
              key={cat} 
              className={`flex-shrink-0 px-4 py-1.5 rounded-full font-lexend text-[12px] font-bold uppercase tracking-wider transition-all ${
                idx === 0 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-variant/50 text-secondary hover:bg-primary-container hover:text-navy-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Pendências */}
        {!isGuest && (
          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-lexend text-lg font-semibold text-navy-900 uppercase tracking-tight">Pendências</h2>
              {userPendingMatches.length > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">
                  {userPendingMatches.length} {userPendingMatches.length === 1 ? 'AÇÃO' : 'AÇÕES'}
                </span>
              )}
            </div>
            
            {userPendingMatches.length > 0 ? (
              <div className="space-y-4">
                {userPendingMatches.map(m => (
                  <div key={m.id} className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden ${m.status === MatchStatus.PENDING ? 'border-slate-100' : 'border-slate-100 border-l-4 border-l-primary-container'}`}>
                    <div className={`absolute top-0 right-0 font-lexend text-[10px] px-3 py-1 font-bold rounded-bl-lg ${m.status === MatchStatus.PENDING ? 'bg-primary-container text-navy-900' : 'bg-surface-variant/50 text-secondary'}`}>
                       {m.category.toUpperCase()}
                    </div>
                    
                    <div className="space-y-2 pt-1 mb-4">
                      {m.status === MatchStatus.PENDING ? (
                        <div className="flex items-center gap-1 font-lexend font-bold text-[12px] tracking-wide text-red-600">
                          <span className="material-symbols-outlined text-[14px]">event_busy</span>
                          <span>AGENDAR ATÉ 15/10</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 font-lexend font-bold text-[12px] tracking-wide text-secondary">
                          <span className="material-symbols-outlined text-[14px]">history</span>
                          <span>PARTIDA ENCERRADA ONTEM</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 py-2">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <div className="flex flex-col gap-1">
                           <span className="font-lexend font-bold text-navy-900">{m.p1 === profile?.playerName ? 'Você' : m.p1}</span>
                           {m.status !== MatchStatus.PENDING && (
                             <span className="font-lexend font-bold text-navy-900">{m.p2 === profile?.playerName ? 'Você' : m.p2}</span>
                           )}
                        </div>
                        
                        {m.status === MatchStatus.PENDING ? (
                          <>
                            <span className="text-secondary/40 font-bold italic px-2">VS</span>
                            <div className="flex flex-col gap-1 text-right">
                               <span className="font-lexend font-bold text-navy-900 italic opacity-80">{m.p2 ? (m.p2 === profile?.playerName ? m.p1 : m.p2) : 'Oponente pendente'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="bg-slate-50 rounded p-2 text-center border-slate-100 border">
                            <span className="font-lexend font-black text-navy-900 text-lg tracking-[0.2em] px-2">? : ?</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {m.status === MatchStatus.PENDING ? (
                        <>
                          <button onClick={() => setActionMatch({ match: m, actionType: 'schedule' })} className="flex-1 bg-primary text-white font-lexend font-bold py-2.5 rounded-lg text-sm active:scale-95 transition-transform shadow-sm">
                            Confirmar Horário
                          </button>
                          <button className="px-3 border-2 border-navy-900 text-navy-900 rounded-lg flex items-center justify-center hover:bg-slate-50">
                            <span className="material-symbols-outlined">chat_bubble</span>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setActionMatch({ match: m, actionType: 'result' })} className="w-full bg-navy-900 text-primary-container font-lexend font-bold py-2.5 rounded-lg text-sm uppercase tracking-widest active:scale-95 transition-transform mt-2">
                          Registrar Resultado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-border-muted flex flex-col items-center justify-center gap-2">
                <p className="text-secondary font-sans text-sm">Não há pendências.</p>
                <button onClick={generateTestData} className="text-xs font-bold text-primary underline">Gerar Dados de Teste</button>
              </div>
            )}
          </section>
        )}

        {/* Seus Próximos Jogos */}
        {!isGuest && (
          <section className="space-y-4">
            <h2 className="font-lexend text-lg font-semibold text-navy-900 uppercase tracking-tight px-1">Seus Próximos Jogos</h2>
            {userNextMatches.length > 0 ? (
              <div className="space-y-4">
                {userNextMatches.map(m => (
                  <div key={m.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-navy-900 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary-container text-navy-900 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          {m.scheduledAt ? new Date(m.scheduledAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'AGENDADO'}
                        </span>
                        <span className="text-white font-lexend text-[10px] font-bold">
                          {m.scheduledAt ? new Date(m.scheduledAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''} • {m.court || 'QUADRA'}
                        </span>
                      </div>
                      <span className="text-primary-container font-lexend text-[10px] font-bold uppercase">{m.category}</span>
                    </div>
                    <div className="p-5 space-y-5 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center gap-2 w-5/12">
                          <div className="w-14 h-14 rounded-full border-2 border-primary-container p-0.5 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.p1}&backgroundColor=f1f5f9`} alt={m.p1} className="w-full h-full rounded-full object-cover bg-surface" />
                          </div>
                          <span className="font-lexend font-bold text-sm text-center line-clamp-1">{profile?.playerName === m.p1 ? 'Você' : m.p1}</span>
                        </div>
                        <span className="font-lexend font-black text-slate-200 text-xl italic">VS</span>
                        <div className="flex flex-col items-center gap-2 w-5/12">
                          <div className="w-14 h-14 rounded-full border-2 border-slate-200 p-0.5 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.p2}&backgroundColor=f1f5f9`} alt={m.p2} className="w-full h-full rounded-full object-cover bg-surface" />
                          </div>
                          <span className="font-lexend font-bold text-sm text-center line-clamp-1">{profile?.playerName === m.p2 ? 'Você' : m.p2}</span>
                        </div>
                      </div>
                      <button className="w-full border-2 border-navy-900 text-navy-900 font-lexend font-bold py-2.5 rounded-lg text-sm active:bg-slate-50 transition-colors hover:bg-slate-50">
                        Ver Detalhes do Local
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-border-muted flex flex-col items-center justify-center gap-2">
                <p className="text-secondary font-sans text-sm">Não há próximos jogos.</p>
                <button onClick={generateTestData} className="text-xs font-bold text-primary underline">Gerar Dados de Teste</button>
              </div>
            )}
          </section>
        )}

        {/* Torneio (Geral) */}
        <section className="space-y-4 pb-12">
          <div className="flex flex-col px-1">
            <h2 className="font-lexend text-lg font-semibold text-navy-900 uppercase tracking-tight">Torneio (Geral)</h2>
          </div>
          
          <div className="space-y-4">
            {recentMatches.length > 0 || tournamentNextMatches.length > 0 ? (
              <>
                {/* Tournament Scheduled Matches */}
                {tournamentNextMatches.map(m => (
                  <div key={m.id} className="bg-white border-2 border-navy-900 text-left rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-1.5 text-secondary">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">calendar_month</span>
                        <span className="font-lexend text-[10px] font-bold flex flex-col leading-tight">
                          <span>{m.scheduledAt ? new Date(m.scheduledAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'AGENDADO'},</span>
                          <span>{m.scheduledAt ? new Date(m.scheduledAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </span>
                      </div>
                      <span className="text-secondary font-lexend text-[10px] font-bold uppercase">{m.category}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-lexend font-bold text-navy-900">
                      <span>{m.p1}</span>
                      <span className="text-slate-300 italic px-2">VS</span>
                      <span>{m.p2}</span>
                    </div>
                  </div>
                ))}
                {/* Mock Live Score */}
                <div className="bg-white border text-left rounded-xl p-5 shadow-sm relative overflow-hidden border-l-4 border-l-primary cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                      <span className="text-primary font-lexend text-[12px] font-black uppercase">AO VIVO</span>
                      <span className="text-slate-400 font-lexend text-[10px] font-bold ml-2">Q3 • 2º SET</span>
                    </div>
                    <span className="bg-surface-variant/50 text-secondary font-lexend text-[10px] px-2 py-0.5 rounded font-bold uppercase">MASTER</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-lexend font-bold text-navy-900">G. Kuerten</span>
                      <div className="flex gap-2">
                        <span className="bg-slate-100 text-navy-900 font-lexend font-bold px-2.5 py-0.5 rounded text-sm">6</span>
                        <span className="bg-primary-container text-navy-900 font-lexend font-bold px-2.5 py-0.5 rounded text-sm">4</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-lexend text-secondary">F. Meligeni</span>
                      <div className="flex gap-2">
                        <span className="bg-slate-100 text-secondary font-lexend font-bold px-2.5 py-0.5 rounded text-sm">4</span>
                        <span className="bg-slate-50 text-secondary font-lexend font-bold px-2.5 py-0.5 rounded text-sm">2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {recentMatches.map(m => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-400 font-lexend text-[10px] font-bold uppercase tracking-wider">FINALIZADO</span>
                      <span className="bg-slate-200/50 text-slate-600 font-lexend text-[10px] px-2 py-0.5 rounded font-bold uppercase">CAT {m.category}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-lexend font-bold ${m.winner === m.p1 ? 'text-navy-900' : 'text-slate-500'}`}>{m.p1}</span>
                          {m.winner === m.p1 && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                        </div>
                        <span className={`font-lexend font-bold ${m.winner === m.p1 ? 'text-navy-900' : 'text-slate-500'}`}>
                          {m.score1?.[0] ?? 0} {m.score1?.[1] ?? ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-lexend font-bold ${m.winner === m.p2 ? 'text-navy-900' : 'text-slate-500'}`}>{m.p2}</span>
                          {m.winner === m.p2 && <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>}
                        </div>
                        <span className={`font-lexend font-bold ${m.winner === m.p2 ? 'text-navy-900' : 'text-slate-500'}`}>
                          {m.score2?.[0] ?? 0} {m.score2?.[1] ?? ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 bg-white text-secondary font-sans rounded-2xl border border-dashed border-border-muted shadow-sm flex flex-col items-center justify-center gap-2">
                Nenhum jogo do torneio no momento.
                <button onClick={generateTestData} className="text-xs font-bold text-primary underline">Gerar Dados de Teste</button>
              </div>
            )}
          </div>
        </section>

        {/* Actions Dialog Modal */}
        {actionMatch && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-navy-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-lexend font-black text-xl text-navy-900">
                  {actionMatch.actionType === 'schedule' ? 'Agendar Jogo' : 'Registrar Resultado'}
                </h3>
                <button onClick={() => setActionMatch(null)} className="w-8 h-8 flex items-center justify-center bg-surface rounded-full text-secondary hover:text-navy-900 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center mb-2">
                  <span className="font-lexend font-bold text-sm text-navy-900 truncate w-5/12 text-center">{actionMatch.match.p1}</span>
                  <span className="font-lexend font-bold text-xs text-secondary/50">VS</span>
                  <span className="font-lexend font-bold text-sm text-navy-900 truncate w-5/12 text-center">{actionMatch.match.p2}</span>
                </div>

                {actionMatch.actionType === 'schedule' ? (
                  <>
                    <div className="space-y-2 flex flex-col text-left">
                      <label className="font-lexend text-xs font-bold text-secondary uppercase">Local / Quadra</label>
                      <input name="court" type="text" placeholder="Ex: Quadra 2" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-lexend text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-2 flex flex-col text-left">
                      <label className="font-lexend text-xs font-bold text-secondary uppercase">Data e Hora</label>
                      <input name="date" type="datetime-local" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-lexend text-sm outline-none focus:border-primary" />
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2 flex flex-col text-left">
                      <label className="font-lexend text-xs font-bold text-secondary uppercase truncate">{actionMatch.match.p1}</label>
                      <input name="s1" type="number" min="0" placeholder="Sets" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-lexend text-xl text-center font-bold outline-none focus:border-primary" required />
                    </div>
                    <div className="flex-1 space-y-2 flex flex-col text-left">
                      <label className="font-lexend text-xs font-bold text-secondary uppercase truncate">{actionMatch.match.p2}</label>
                      <input name="s2" type="number" min="0" placeholder="Sets" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-lexend text-xl text-center font-bold outline-none focus:border-primary" required />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary text-white font-lexend font-bold py-4 rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-primary/20">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Setup */}
        {isAdmin && <DatabaseInitializer />}
      </main>

      {/* FAB for Admin */}
      {isAdmin && (
        <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 border-4 border-white">
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      )}
    </Layout>
  );
};

export default Home;

