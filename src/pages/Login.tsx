import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronRight, Eye, Phone, Trophy } from 'lucide-react';
import { getAllPlayers } from '../constants/tournamentData';
import { fetchPlayerContact } from '../lib/matchService';

type Step = 'select' | 'whatsapp';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsPlayer, setGuestMode } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const allPlayers = useMemo(() => getAllPlayers(), []);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const ORG = 'Organizador';
    const orgMatchesSearch = term.length >= 2 && ORG.toLowerCase().includes(term);
    const base = !term
      ? allPlayers.slice(0, 12)
      : allPlayers.filter(p => p.toLowerCase().includes(term)).slice(0, 12);
    if (!orgMatchesSearch) return base;
    if (base.some(p => p === ORG)) return base;
    return [ORG, ...base];
  }, [searchTerm, allPlayers]);

  const handleSelectPlayer = async (name: string) => {
    setSelectedName(name);
    if (name === 'Organizador') {
      await handleLogin(name, undefined);
      return;
    }
    try {
      const existingWhatsapp = await fetchPlayerContact(name);
      if (existingWhatsapp) {
        await handleLogin(name, existingWhatsapp);
        return;
      }
    } catch {
      // Se falhar leitura do contato, mantém fluxo normal de login.
    }
    setStep('whatsapp');
  };

  const redirectAfterAuth = () => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      navigate(from, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };
  const isAdminIntent = (location.state as { from?: string } | null)?.from === '/admin';

  const handleLogin = async (name: string, phone: string | undefined) => {
    setLoading(true);
    try {
      await loginAsPlayer(name, phone && phone.trim() ? phone.trim() : undefined);
      redirectAfterAuth();
    } catch {
      alert('Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
    navigate('/');
  };

  if (step === 'whatsapp') {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <header className="shrink-0 bg-navy-900 px-6 pb-6 pt-4 rounded-b-[1.75rem] border-b-4 border-primary-container shadow-[0_10px_32px_-12px_rgba(0,28,58,0.45)]">
          <button
            type="button"
            onClick={() => setStep('select')}
            className="mb-5 flex items-center gap-1 text-sm text-primary-container/90"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary-container/35 bg-primary-container/10">
              <span className="text-xl font-bold text-primary-container">
                {selectedName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-lexend text-[10px] font-bold uppercase tracking-[0.18em] text-primary-container">
                Jogador
              </p>
              <h1 className="font-lexend text-xl font-bold leading-tight text-white">
                Olá, {selectedName}!
              </h1>
              <p className="mt-0.5 text-sm text-white/70">WhatsApp (opcional) para contato</p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col space-y-4 p-6">
          <div className="bg-white rounded-2xl border border-border-muted p-4">
            <div className="flex items-center gap-3 mb-3">
              <Phone className="w-5 h-5 text-secondary" />
              <span className="font-semibold text-sm text-navy-900">WhatsApp para contato</span>
            </div>
            <p className="text-xs text-secondary mb-3">
              Outros jogadores poderão te contactar para agendar partidas.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-border-muted px-3">
              <span className="text-sm text-secondary font-mono">+55</span>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                placeholder="11987654321"
                className="flex-1 bg-transparent py-3 text-sm outline-none font-mono"
                maxLength={11}
              />
            </div>
          </div>

          <button
            onClick={() => handleLogin(selectedName, whatsapp)}
            disabled={loading}
            className="w-full bg-navy-900 text-primary-container py-4 rounded-2xl font-lexend font-bold text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando...' : 'Entrar no Torneio'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleLogin(selectedName, undefined)}
            className="w-full text-secondary py-2 text-sm"
          >
            Pular e entrar sem WhatsApp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Hero — alinhado à referência Regras (azul escuro + faixa lime + título branco) */}
      <header className="relative shrink-0 overflow-hidden bg-navy-900 px-6 pt-10 pb-10 rounded-b-[1.75rem] border-b-4 border-primary-container shadow-[0_12px_40px_-12px_rgba(0,28,58,0.55)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 120% 80% at 20% -20%, rgb(162 255 0 / 0.35), transparent 55%), radial-gradient(ellipse 90% 70% at 100% 100%, rgb(71 96 131 / 0.5), transparent 50%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary-container/35 bg-primary-container/10 shadow-inner">
            <Trophy className="h-8 w-8 text-primary-container" strokeWidth={2} />
          </div>
          <h1 className="font-lexend text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-[2.15rem]">
            Conde Open 2026
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 px-6 pb-8 pt-6">
        {/* Convidado — em primeiro para não passar batido */}
        <section className="mb-8 space-y-3">
          <h2 className="font-lexend text-sm font-bold uppercase tracking-wide text-navy-900">
            Entre como convidado:
          </h2>
          <p className="text-sm leading-relaxed text-secondary">
            Convidados podem apenas visualizar resultados. Para inserir e alterar resultados você deve entrar como jogador.
          </p>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-navy-900 bg-primary-container px-4 py-4 font-lexend text-sm font-bold text-on-primary-container shadow-md transition-colors active:opacity-90"
          >
            <Eye className="h-5 w-5 shrink-0" />
            Entrar como convidado
          </button>
        </section>

        {/* Jogador */}
        <section className="flex min-h-0 flex-1 flex-col space-y-3 border-t border-border-muted pt-6">
          <h2 className="font-lexend text-sm font-bold uppercase tracking-wide text-navy-900">
            Entre como jogador:
          </h2>
          <p className="text-sm font-semibold text-navy-900">Busque seu nome</p>
          {isAdminIntent && (
            <button
              type="button"
              onClick={() => handleSelectPlayer('Organizador')}
              className="w-full rounded-xl bg-navy-900 text-primary-container py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Entrar como Organizador (Admin)
            </button>
          )}

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border-muted bg-white px-4 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar..."
              className="flex-1 bg-transparent py-3.5 text-sm outline-none"
            />
          </div>

          <div className="min-h-[120px] flex-1 space-y-2 overflow-y-auto">
            {filteredPlayers.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelectPlayer(name)}
                className="flex w-full items-center justify-between rounded-2xl border border-border-muted bg-white px-4 py-3.5 transition-colors active:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-sm text-on-primary-container">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-navy-900">{name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-secondary" />
              </button>
            ))}

            {filteredPlayers.length === 0 && (
              <div className="py-8 text-center text-sm text-secondary">
                {`Nenhum jogador encontrado para "${searchTerm}"`}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
