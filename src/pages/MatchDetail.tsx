import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Match, MatchStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, MessageCircle, Edit3, Trash2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin, isGuest } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [score1, setScore1] = useState<number[]>([0, 0]);
  const [score2, setScore2] = useState<number[]>([0, 0]);
  const [tb1, setTb1] = useState<number>(0);
  const [tb2, setTb2] = useState<number>(0);
  const [court, setCourt] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'matches', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as Match;
          setMatch({ id: docSnap.id, ...data });
          setScore1(data.score1 || [0, 0]);
          setScore2(data.score2 || [0, 0]);
          setTb1(data.tiebreak1 || 0);
          setTb2(data.tiebreak2 || 0);
          setCourt(data.court || '');
          if (data.scheduledAt) {
            setScheduledAt(format(data.scheduledAt.toDate(), "yyyy-MM-dd'T'HH:mm"));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const canEdit = isAdmin || (profile?.playerName && match?.participants.includes(profile.playerName) && match.status !== MatchStatus.COMPLETED);

  const handleSave = async () => {
    if (!id || !match) return;
    setSaving(true);
    try {
      const updates: Partial<Match> = {
        court,
        scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : undefined,
        score1,
        score2,
        tiebreak1: tb1,
        tiebreak2: tb2,
        status: (score1[0] + score1[1] > 0 || score2[0] + score2[1] > 0) ? MatchStatus.COMPLETED : MatchStatus.SCHEDULED,
        updatedBy: auth.currentUser?.uid
      };
      
      // Winner logic (simplified for 2 sets + TB)
      let s1 = 0, s2 = 0;
      if (score1[0] > score2[0]) s1++; else if (score2[0] > score1[0]) s2++;
      if (score1[1] > score2[1]) s1++; else if (score2[1] > score1[1]) s2++;
      
      if (s1 > s2) updates.winner = match.p1;
      else if (s2 > s1) updates.winner = match.p2;
      else if (tb1 > tb2) updates.winner = match.p1;
      else if (tb2 > tb1) updates.winner = match.p2;

      await updateDoc(doc(db, 'matches', id), updates);
      setMatch({ ...match, ...updates });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `matches/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="Partida">Carregando...</Layout>;
  if (!match) return <Layout title="Partida">Partida não encontrada.</Layout>;

  return (
    <Layout title="Detalhes">
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 text-sm font-lexend">
          <ChevronLeft size={16} /> Voltar
        </button>

        {/* Match Card Detail */}
        <section className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full w-2 bg-primary-container"></div>
          <div className="flex flex-col gap-8">
             <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center text-center space-y-2">
                   <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
                      <span className="font-lexend font-black text-2xl text-primary">{match.p1[0]}</span>
                   </div>
                   <h2 className="font-lexend font-bold text-navy-900 text-sm">{match.p1}</h2>
                </div>
                <div className="text-slate-300 font-lexend font-black italic text-2xl">VS</div>
                <div className="flex-1 flex flex-col items-center text-center space-y-2">
                   <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
                      <span className="font-lexend font-black text-2xl text-primary">{match.p2[0]}</span>
                   </div>
                   <h2 className="font-lexend font-bold text-navy-900 text-sm">{match.p2}</h2>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                   <Calendar className="text-primary w-5 h-5" />
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Data/Hora</p>
                      <p className="text-xs font-bold text-navy-900">
                        {match.scheduledAt ? format(match.scheduledAt.toDate(), "dd/MM, HH:mm") : 'A definir'}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <MapPin className="text-primary w-5 h-5" />
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Local</p>
                      <p className="text-xs font-bold text-navy-900">{match.court || 'A definir'}</p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Score Editor / Viewer */}
        <section className="space-y-4">
          <h3 className="font-lexend text-[10px] font-bold text-secondary uppercase tracking-[0.2em] px-1">Placar da Partida</h3>
          
          {isEditing ? (
            <div className="bg-white border-2 border-primary-container rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in zoom-in duration-200">
               <div className="space-y-6">
                 {/* Set 1 */}
                 <div className="flex items-center justify-between gap-4">
                    <span className="font-lexend font-black text-xs text-secondary uppercase">Set 1</span>
                    <div className="flex items-center gap-3">
                       <input type="number" value={score1[0]} onChange={e => setScore1([parseInt(e.target.value), score1[1]])} className="w-14 h-14 text-center font-lexend font-black text-xl border-2 border-border-muted rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                       <span className="text-border-muted font-black">:</span>
                       <input type="number" value={score1[1]} onChange={e => setScore1([score1[0], parseInt(e.target.value)])} className="w-14 h-14 text-center font-lexend font-black text-xl border-2 border-primary-container rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                    </div>
                 </div>
                 {/* Set 2 */}
                 <div className="flex items-center justify-between gap-4">
                    <span className="font-lexend font-black text-xs text-secondary uppercase">Set 2</span>
                    <div className="flex items-center gap-3">
                       <input type="number" value={score2[0]} onChange={e => setScore2([parseInt(e.target.value), score2[1]])} className="w-14 h-14 text-center font-lexend font-black text-xl border-2 border-border-muted rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                       <span className="text-border-muted font-black">:</span>
                       <input type="number" value={score2[1]} onChange={e => setScore2([score2[0], parseInt(e.target.value)])} className="w-14 h-14 text-center font-lexend font-black text-xl border-2 border-primary-container rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                    </div>
                 </div>
                 {/* Super Tie-break */}
                 <div className="pt-4 border-t border-border-muted/30">
                    <p className="text-[9px] text-secondary uppercase font-black tracking-widest mb-4">Super Tie-break (10 pontos)</p>
                    <div className="flex items-center justify-center gap-6">
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-bold text-secondary opacity-40 uppercase truncate w-20 text-center">{match.p1}</span>
                         <input placeholder="0" type="number" value={tb1} onChange={e => setTb1(parseInt(e.target.value))} className="w-16 h-16 text-center font-lexend font-black text-xl border-2 border-border-muted rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                       </div>
                       <span className="text-border-muted font-black mt-6">:</span>
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-[10px] font-bold text-primary uppercase truncate w-20 text-center">{match.p2}</span>
                         <input placeholder="0" type="number" value={tb2} onChange={e => setTb2(parseInt(e.target.value))} className="w-16 h-16 text-center font-lexend font-black text-xl border-2 border-primary-container rounded-xl focus:border-primary focus:ring-0 bg-surface" />
                       </div>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-border-muted/30 space-y-3">
                    <p className="text-[9px] text-secondary uppercase font-black tracking-widest">Agendamento & Local</p>
                    <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full bg-surface border-border-muted border-2 rounded-xl p-4 font-lexend text-sm outline-none focus:border-primary transition-colors" />
                    <input placeholder="Ex: Quadra 4" type="text" value={court} onChange={e => setCourt(e.target.value)} className="w-full bg-surface border-border-muted border-2 rounded-xl p-4 font-lexend text-sm outline-none focus:border-primary transition-colors" />
                 </div>
               </div>
               <div className="flex flex-col gap-2">
                  <button onClick={handleSave} disabled={saving} className="w-full bg-primary-container text-navy-900 py-4 rounded-xl font-lexend font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-container/20 active:scale-[0.98] transition-all">
                    {saving ? 'Salvando...' : 'Confirmar Resultado'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="w-full py-3 text-secondary font-lexend font-bold text-[10px] uppercase tracking-widest opacity-60">Cancelar Edição</button>
               </div>
            </div>
          ) : (
            <div className={`bg-white border rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm ${match.status === MatchStatus.COMPLETED ? 'border-primary' : 'border-dashed border-border-muted'}`}>
               {match.status === MatchStatus.COMPLETED ? (
                 <>
                   <CheckCircle2 className="text-primary-container fill-primary w-14 h-14 mb-4 drop-shadow-[0_0_8px_rgba(162,255,0,0.4)]" />
                   <div className="flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Placar Final</span>
                     <div className="flex gap-4 font-lexend text-3xl font-black text-navy-900 italic">
                        <div className="bg-surface px-3 py-1 rounded-lg border border-border-muted">{score1[0]}:{score2[0]}</div>
                        <div className="bg-surface px-3 py-1 rounded-lg border border-border-muted">{score1[1]}:{score2[1]}</div>
                        {(tb1 > 0 || tb2 > 0) && <div className="text-navy-900 bg-primary-container px-3 py-1 rounded-lg border border-primary/20 shadow-sm">{tb1}:{tb2}</div>}
                     </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 border-2 border-dashed border-border-muted">
                      <Edit3 className="text-border-muted w-8 h-8" />
                   </div>
                   <p className="font-lexend font-extrabold text-navy-900 uppercase tracking-tighter text-sm italic">Aguardando Registro</p>
                   <p className="text-[9px] text-secondary font-bold uppercase tracking-widest mt-2 opacity-50 px-8">O resultado desta partida ainda não foi postado no sistema</p>
                 </>
               )}
            </div>
          )}
        </section>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="space-y-4 pt-4">
            {canEdit && (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-primary-container text-navy-900 py-5 rounded-2xl font-lexend font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary-container/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Edit3 size={20} />
                Lançar Placar
              </button>
            )}
            
            <button className="w-full border-2 border-navy-900 text-navy-900 py-4 rounded-2xl font-lexend font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:bg-surface transition-all">
              <MessageCircle size={18} />
              Combinar via WhatsApp
            </button>
            
            {isAdmin && (
               <button className="w-full text-error/60 font-lexend text-[10px] uppercase font-bold tracking-widest pt-4">
                 Excluir Partida (WO)
               </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MatchDetail;
