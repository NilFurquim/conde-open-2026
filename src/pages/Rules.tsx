import React from 'react';
import Layout from '../components/Layout';
import { Gavel, Clock, SortAsc, BookOpen } from 'lucide-react';

const Rules: React.FC = () => {
  return (
    <Layout title="Regras">
      <div className="space-y-6 pb-12">
        <div className="relative rounded-2xl overflow-hidden h-40 flex flex-col justify-end p-6 bg-navy-900">
           <img 
            src="https://images.unsplash.com/photo-1595435063546-5e58847849e7?q=80&w=800&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-30" 
            alt="Tennis" 
          />
          <div className="relative z-10">
            <span className="text-primary-container font-lexend text-[10px] font-bold uppercase tracking-widest mb-1 block">Torneio Interno 2024</span>
            <h2 className="text-white font-lexend font-black text-2xl uppercase tracking-tight">Manual do Atleta</h2>
          </div>
        </div>

        <section className="bg-primary-container/10 border border-primary/20 rounded-2xl p-4 flex gap-4 items-center">
           <BookOpen className="text-primary" />
           <p className="text-sm font-lexend font-medium text-on-primary-container leading-relaxed">
             Todas as partidas devem ser registradas obrigatoriamente no aplicativo para validação.
           </p>
        </section>

        <RuleCard 
          icon={<Clock className="text-primary" />} 
          title="Formato da Competição" 
          items={[
            "2 sets de 4 games (Sets Curtos)",
            "Super Tie-break (10 pts) em caso de 1-1 em sets",
            "Empate em 4-4 no set resolve-se em Super Tie-break",
            "Prazo de 7 dias por rodada para agendamento"
          ]}
        />

        <RuleCard 
          icon={<SortAsc className="text-primary" />} 
          title="Critérios de Desempate" 
          items={[
            "1. Número de Vitórias",
            "2. Confronto Direto",
            "3. Saldo de Sets",
            "4. Saldo de Games"
          ]}
        />

        <RuleCard 
          icon={<Gavel className="text-primary" />} 
          title="Código de Conduta" 
          items={[
            "Autogestão do placar (cantar claro)",
            "Fair play absoluto em chamadas de linha",
            "Respeito mútuo entre os atletas",
            "Atraso superior a 15min implica em WO"
          ]}
        />

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
           <p className="text-[10px] text-slate-400 font-lexend uppercase tracking-widest font-bold">Contato Comissão</p>
           <p className="text-navy-900 font-lexend font-black text-lg mt-1">(11) 99999-9999</p>
        </div>
      </div>
    </Layout>
  );
};

const RuleCard = ({ icon, title, items }: { icon: React.ReactNode; title: string, items: string[] }) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
      {icon}
      <h3 className="font-lexend font-bold text-sm text-navy-900 uppercase tracking-tight">{title}</h3>
    </div>
    <div className="p-4 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
           <span className="text-sm font-sans text-slate-600 leading-tight">{item}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Rules;
