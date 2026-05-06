import React from 'react';
import Layout from '../components/Layout';
import {
  ListOrdered,
  ArrowUpDown,
  Scale,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Handshake,
} from 'lucide-react';

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <section className="bg-white rounded-xl border border-border-muted overflow-hidden shadow-sm">
    <div className="px-3 py-3 flex items-center gap-2 border-b border-border-muted/60 bg-slate-50">
      <span className="text-primary shrink-0">{icon}</span>
      <h3 className="font-lexend font-semibold text-base text-navy-900">{title}</h3>
    </div>
    <div className="p-3">{children}</div>
  </section>
);

const Rules: React.FC = () => {
  return (
    <Layout title="Regras">
      <div className="space-y-4 pb-8">
        <SectionCard
          icon={<ListOrdered className="w-5 h-5" />}
          title="Formato da Competição"
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1 bg-primary rounded-full shrink-0" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Sets Curtos</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">2 sets de 4 games</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 bg-primary rounded-full shrink-0" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Empate no Set (4-4)</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Caso o set atinja 4-4, será disputado um Super Tie-break (10 pontos).
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={<ArrowUpDown className="w-5 h-5" />}
          title="Critérios de Desempate"
        >
          <ul className="divide-y divide-border-muted/60">
            {[
              { label: '1. Número de Vitórias', badge: 'Prioridade 1', strong: true },
              { label: '2. Confronto Direto', badge: 'Prioridade 2', strong: false },
              { label: '3. Saldo de Sets', badge: 'Prioridade 3', strong: false },
              { label: '4. Saldo de Games', badge: 'Prioridade 4', strong: false },
            ].map(row => (
              <li key={row.label} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm text-secondary">{row.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-lg font-lexend font-bold text-[9px] uppercase tracking-wide shrink-0 ${
                    row.strong ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {row.badge}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={<Scale className="w-5 h-5" />} title="Código de Conduta">
          <ul className="space-y-4">
            <li className="flex gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Autogestão de placar</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Jogadores são responsáveis por cantar o placar de forma clara.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Expectativa de honestidade</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Fair play absoluto em chamadas de linha e marcações duvidosas.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Handshake className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Respeito mútuo</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Manter uma conduta cordial durante e após os jogos.
                </p>
              </div>
            </li>
          </ul>
        </SectionCard>

        <SectionCard icon={<CalendarCheck className="w-5 h-5" />} title="Agendamento">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1 bg-primary rounded-full shrink-0" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Prazo da fase</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Cada fase deverá preferencialmente acontecer dentro de 7 dias.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 bg-primary rounded-full shrink-0" />
              <div>
                <p className="font-lexend font-semibold text-sm text-navy-900">Vitória por iniciativa</p>
                <p className="text-sm text-secondary mt-1 leading-relaxed">
                  Caso o jogo não aconteça a vitória será atribuída ao jogador com mais iniciativa para agendar o
                  jogo.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
};

export default Rules;
