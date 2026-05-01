import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORY_COLORS, GROUP_COLOR_CLASSES } from '../constants/tournamentData';

interface Section {
  title: string;
  category?: string;
  content: React.ReactNode;
}

const Accordion: React.FC<{ title: string; color?: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, color, children, defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-border-muted rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          {color && <div className={`w-2 h-2 rounded-full ${color}`} />}
          <span className="font-lexend font-bold text-sm text-navy-900">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-secondary" /> : <ChevronDown className="w-4 h-4 text-secondary" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-border-muted pt-3">{children}</div>}
    </div>
  );
};

const GroupTable: React.FC<{ groups: Record<number, string[]> }> = ({ groups }) => (
  <div className="space-y-3">
    {Object.entries(groups).map(([g, players]) => {
      const gc = GROUP_COLOR_CLASSES[Number(g)] || GROUP_COLOR_CLASSES[1];
      return (
        <div key={g} className={`${gc.light} rounded-xl p-3`}>
          <p className={`font-bold text-xs ${gc.text} uppercase tracking-wider mb-2`}>Grupo {g}</p>
          <ol className="space-y-1">
            {players.map((p, i) => (
              <li key={p} className="flex items-center gap-2 text-sm text-navy-900">
                <span className="text-xs text-secondary w-4">{i + 1}.</span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      );
    })}
  </div>
);

const Rule: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex gap-2 text-sm text-on-surface">
    <span className="text-secondary shrink-0">•</span>
    <span>{children}</span>
  </li>
);

const Rules: React.FC = () => {
  return (
    <Layout title="Regras">
      <div className="space-y-4">
        <div>
          <h2 className="font-lexend font-bold text-xl text-navy-900">Regras do Torneio</h2>
          <p className="text-sm text-secondary mt-0.5">Conde Open 2026 · Todas as categorias</p>
        </div>

        {/* General rules */}
        <Accordion title="Regras Gerais" defaultOpen>
          <ul className="space-y-2">
            <Rule>Cada jogador deve entrar com seu nome para agendar e registrar resultados.</Rule>
            <Rule>Jogadores podem apenas editar seus próprios jogos. O Organizador pode editar qualquer jogo.</Rule>
            <Rule>Resultados só podem ser editados dentro do prazo definido pelo Organizador para cada rodada.</Rule>
            <Rule>O contato com o adversário deve ser feito via WhatsApp (disponível no detalhe de cada partida).</Rule>
            <Rule>Todas as edições são salvas com histórico de versões.</Rule>
            <Rule>Convidados podem visualizar tudo, mas não podem editar.</Rule>
          </ul>
        </Accordion>

        {/* Pontuação */}
        <Accordion title="Sistema de Pontuação (Grupos)">
          <ul className="space-y-2">
            <Rule><strong>Vitória:</strong> 2 pontos</Rule>
            <Rule><strong>Derrota:</strong> 0 pontos</Rule>
            <Rule><strong>W.O.:</strong> registrado como derrota do ausente (0 pontos)</Rule>
          </ul>
          <div className="mt-3 space-y-1">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Critérios de Desempate</p>
            <ol className="space-y-1">
              {['1. Pontos', '2. Confronto direto', '3. Saldo de sets (sets ganhos / sets disputados)', '4. Saldo de games'].map((r, i) => (
                <li key={i} className="text-sm text-on-surface">{r}</li>
              ))}
            </ol>
          </div>
        </Accordion>

        {/* Cat A */}
        <Accordion title="Categoria A" color={CATEGORY_COLORS.A.bg}>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Formato</p>
              <p className="text-sm">4 grupos × 4 jogadores · Quartas → Semifinais → Final</p>
              <p className="text-sm">Classificam-se os <strong>2 primeiros</strong> de cada grupo.</p>
            </div>
            <GroupTable groups={{ 1: ['Pedro','Fernando','Amauri','Saito'], 2: ['Alex','Osvaldo','Paulo','Gustavo'], 3: ['Thales','Ícaro','Solera','Jeff'], 4: ['Allan','Carol','Lamega','Adriano'] }} />
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Chave Mata-Mata</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-bold">QF-1:</span> 1º G1 × 2º G2</li>
                <li><span className="font-bold">QF-2:</span> 1º G2 × 2º G1</li>
                <li><span className="font-bold">QF-3:</span> 1º G3 × 2º G4</li>
                <li><span className="font-bold">QF-4:</span> 1º G4 × 2º G3</li>
                <li className="mt-2"><span className="font-bold">SF-1:</span> Venc. QF-1 × Venc. QF-2</li>
                <li><span className="font-bold">SF-2:</span> Venc. QF-3 × Venc. QF-4</li>
                <li className="mt-2"><span className="font-bold">Final:</span> Venc. SF-1 × Venc. SF-2</li>
              </ul>
            </div>
          </div>
        </Accordion>

        {/* Cat B */}
        <Accordion title="Categoria B" color={CATEGORY_COLORS.B.bg}>
          <div className="space-y-3">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Formato</p>
              <p className="text-sm">6 grupos × 4 jogadores · Oitavas → Quartas → Semis → Final</p>
              <p className="text-sm">Classificam-se os <strong>2 primeiros</strong> de cada grupo + <strong>4 melhores 3ºs colocados</strong>.</p>
            </div>
            <GroupTable groups={{ 1: ['Adriano','Alexandre','Evandro','Cesar'], 2: ['Lamega','Marcos','Renato','Aninha'], 3: ['Fernando','Xico','Fortes','JC'], 4: ['Saito','Wilder','Roberto','Guto'], 5: ['Osvaldo','João Pedro','Silvio','Carla'], 6: ['Paulo','Matera','Flavia','Nil'] }} />
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Oitavas de Final</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-bold">R16-1:</span> 1º G1 × Melhor 3º #2</li>
                <li><span className="font-bold">R16-2:</span> 1º G2 × 2º G5</li>
                <li><span className="font-bold">R16-3:</span> 1º G3 × Melhor 3º #3</li>
                <li><span className="font-bold">R16-4:</span> 1º G4 × 2º G1</li>
                <li><span className="font-bold">R16-5:</span> 1º G5 × 2º G6</li>
                <li><span className="font-bold">R16-6:</span> 1º G6 × Melhor 3º #1</li>
                <li><span className="font-bold">R16-7:</span> 2º G3 × 2º G2</li>
                <li><span className="font-bold">R16-8:</span> 2º G4 × Melhor 3º #4</li>
              </ul>
              <p className="text-xs text-secondary mt-2">Os melhores 3ºs são ranqueados por pontos, saldo de sets e games entre todos os 6 grupos.</p>
            </div>
          </div>
        </Accordion>

        {/* Cat C */}
        <Accordion title="Categoria C" color={CATEGORY_COLORS.C.bg}>
          <div className="space-y-3">
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Formato</p>
              <p className="text-sm">2 grupos × 4 jogadores · Semifinais → Final</p>
              <p className="text-sm">Classificam-se os <strong>2 primeiros</strong> de cada grupo (cruzamento cruzado).</p>
            </div>
            <GroupTable groups={{ 1: ['João Pedro','Eduardo','Nil','Junior'], 2: ['Marcos','Rodrigo','Dudu','Alexandre'] }} />
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Chave</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-bold">SF-1:</span> 1º G1 × 2º G2</li>
                <li><span className="font-bold">SF-2:</span> 1º G2 × 2º G1</li>
                <li className="mt-2"><span className="font-bold">Final:</span> Venc. SF-1 × Venc. SF-2</li>
              </ul>
            </div>
          </div>
        </Accordion>

        {/* Duplas */}
        <Accordion title="Categoria Duplas" color={CATEGORY_COLORS.Duplas.bg}>
          <div className="space-y-3">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">Formato</p>
              <p className="text-sm">13 duplas · Eliminatória direta com Play-in</p>
              <p className="text-sm"><strong>3 duplas com BYE</strong> entram direto nas Quartas.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Play-in (10 duplas)</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-bold">J1:</span> Pedro/Carla × Igor/Fortes</li>
                <li><span className="font-bold">J2:</span> Paulo/Osvaldo × Thales/Marcos</li>
                <li><span className="font-bold">J3:</span> Adriano/Matera × Matheus/Xico</li>
                <li><span className="font-bold">J4:</span> Ícaro/Rodrigo × Allan/Aninha</li>
                <li><span className="font-bold">J5:</span> Gustavo/João Pedro × Lamega/Alexandre</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Duplas com BYE (direto às Quartas)</p>
              <ul className="space-y-1 text-sm">
                <li>🟢 Amauri / Guto</li>
                <li>🟡 Alex / Evandro</li>
                <li>🌸 Saito / Fernando</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Quartas de Final</p>
              <ul className="space-y-1 text-sm">
                <li><span className="font-bold">QF-1:</span> Amauri/Guto × Venc. J1</li>
                <li><span className="font-bold">QF-2:</span> Venc. J2 × Venc. J3</li>
                <li><span className="font-bold">QF-3:</span> Alex/Evandro × Venc. J4</li>
                <li><span className="font-bold">QF-4:</span> Saito/Fernando × Venc. J5</li>
              </ul>
            </div>
          </div>
        </Accordion>
      </div>
    </Layout>
  );
};

export default Rules;
