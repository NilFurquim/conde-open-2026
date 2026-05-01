import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Trophy, Table as TableIcon } from 'lucide-react';

const Brackets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classificacao' | 'matamata'>('classificacao');
  const [category, setCategory] = useState('A');

  return (
    <Layout title="Chaves">
      <div className="space-y-6">
        {/* Category Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {['A', 'B', 'C', 'Duplas'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-xl font-lexend text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                category === cat ? 'bg-primary text-white' : 'bg-white text-secondary border border-border-muted hover:bg-surface'
              }`}
            >
              Cat {cat}
            </button>
          ))}
        </div>

        {/* Tab Selector */}
        <nav className="flex w-full bg-white border border-border-muted rounded-2xl p-1 shadow-sm">
          <button 
            onClick={() => setActiveTab('classificacao')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-lexend text-[11px] uppercase tracking-widest transition-all ${
              activeTab === 'classificacao' ? 'bg-navy-900 text-white font-black shadow-md' : 'text-secondary font-bold opacity-60'
            }`}
          >
            <TableIcon size={14} />
            Classificação
          </button>
          <button 
            onClick={() => setActiveTab('matamata')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-lexend text-[11px] uppercase tracking-widest transition-all ${
              activeTab === 'matamata' ? 'bg-navy-900 text-white font-black shadow-md' : 'text-secondary font-bold opacity-60'
            }`}
          >
            <Trophy size={14} />
            Mata-mata
          </button>
        </nav>

        {/* Content */}
        {activeTab === 'classificacao' ? (
          <div className="space-y-6">
             {/* Example Group Table */}
             <div className="bg-white rounded-2xl border border-border-muted overflow-hidden shadow-sm">
                <div className="bg-surface px-5 py-4 border-b border-border-muted flex justify-between items-center">
                  <h3 className="font-lexend font-black text-xs text-navy-900 uppercase tracking-[0.2em]">Grupo 1</h3>
                  <span className="text-[9px] font-black text-secondary opacity-40 uppercase">4 Inscritos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface/50 text-secondary uppercase font-black text-[9px] tracking-widest">
                        <th className="px-5 py-3">Atleta</th>
                        <th className="px-3 py-3 text-center">Pts</th>
                        <th className="px-3 py-3 text-center">Vit</th>
                        <th className="px-3 py-3 text-center">Sld</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted/50">
                      {[1,2,3,4].map(idx => (
                        <tr key={idx} className="hover:bg-primary/5 group transition-colors">
                          <td className="px-5 py-4 font-lexend font-bold text-navy-900 text-sm flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${idx <= 2 ? 'bg-primary-container shadow-[0_0_8px_rgba(162,255,0,0.5)]' : 'bg-border-muted'}`}></span>
                            Jogador {idx}
                          </td>
                          <td className="px-3 py-4 text-center font-lexend font-extrabold text-navy-900 text-sm">0</td>
                          <td className="px-3 py-4 text-center font-sans font-medium text-secondary text-sm">0</td>
                          <td className="px-3 py-4 text-center font-sans font-black text-primary text-sm tracking-tighter opacity-70">+0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
             <div className="p-4 bg-primary-container/10 rounded-xl border border-primary-container/30 flex items-start gap-3">
               <div className="p-1 bg-primary rounded shadow-sm"><span className="material-symbols-outlined text-white text-[16px]">info</span></div>
               <p className="text-[10px] text-primary font-bold uppercase tracking-tight leading-relaxed">
                 Os 2 melhores de cada grupo avançam para o mata-mata. Saldo de games é o terceiro critério de desempate.
               </p>
             </div>
          </div>
        ) : (
          <div className="space-y-8 pb-12">
            {/* Simple Bracket Visualization placeholder */}
            <div className="flex flex-col gap-10">
              <BracketRound title="Quartas de Final" matches={[1, 2, 3, 4]} />
              <BracketRound title="Semifinais" matches={[1, 2]} />
              <div className="text-center space-y-6 pt-4">
                <div className="font-lexend font-black text-[10px] text-primary uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-primary/20"></div>
                  Grande Final
                  <div className="h-px flex-1 bg-primary/20"></div>
                </div>
                <div className="bg-navy-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border-2 border-primary-container">
                  <div className="absolute inset-0 bg-primary opacity-20 mix-blend-overlay"></div>
                  <Trophy className="w-16 h-16 text-primary-container mx-auto mb-6 drop-shadow-[0_0_15px_rgba(162,255,0,0.5)]" />
                  <div className="flex justify-between items-center gap-6 text-white relative z-10">
                    <div className="flex-1 font-lexend font-black text-base uppercase tracking-tighter italic">Finalista 1</div>
                    <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center font-serif font-black italic text-navy-900 text-base shadow-lg">VS</div>
                    <div className="flex-1 font-lexend font-black text-base uppercase tracking-tighter italic">Finalista 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const BracketRound = ({ title, matches }: { title: string; matches: number[] }) => (
  <div className="space-y-4">
    <h3 className="font-lexend text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 pb-1">{title}</h3>
    <div className="space-y-3">
      {matches.map(m => (
        <div key={m} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between border-b border-slate-50 pb-1 text-xs font-bold text-navy-900 lowercase italic">
            <span>vencedor jogo x</span>
            <span className="text-slate-300">-</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-navy-900 lowercase italic">
            <span>vencedor jogo y</span>
            <span className="text-slate-300">-</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Brackets;
