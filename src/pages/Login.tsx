import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, ChevronRight, Eye, Phone, Trophy } from 'lucide-react';
import { getAllPlayers } from '../constants/tournamentData';

type Step = 'select' | 'whatsapp';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsPlayer, setGuestMode } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);

  const allPlayers = useMemo(() => getAllPlayers(), []);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return allPlayers.slice(0, 12);
    return allPlayers
      .filter(p => p.toLowerCase().includes(term))
      .slice(0, 12);
  }, [searchTerm, allPlayers]);

  const handleSelectPlayer = (name: string) => {
    setSelectedName(name);
    if (name === 'Organizador') {
      handleLogin(name, undefined);
    } else {
      setStep('whatsapp');
    }
  };

  const handleLogin = async (name: string, phone: string | undefined) => {
    setLoading(true);
    try {
      await loginAsPlayer(name, phone && phone.trim() ? phone.trim() : undefined);
      navigate('/');
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
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">
        <div className="mt-12 mb-8">
          <button
            onClick={() => setStep('select')}
            className="text-secondary text-sm mb-6 flex items-center gap-1"
          >
            ← Voltar
          </button>
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-on-primary-container">
              {selectedName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="font-lexend font-bold text-2xl text-navy-900">Olá, {selectedName}!</h1>
          <p className="text-secondary text-sm mt-1">Seu número de WhatsApp (opcional)</p>
        </div>

        <div className="space-y-4 flex-1">
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
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="mt-10 mb-8 text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-on-primary-container" />
        </div>
        <h1 className="font-lexend font-bold text-2xl text-navy-900">Conde Open 2026</h1>
        <p className="text-secondary text-sm mt-1">Selecione seu nome para entrar</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-border-muted px-4 mb-4 shadow-sm">
        <Search className="w-5 h-5 text-secondary shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar seu nome..."
          className="flex-1 py-3.5 text-sm outline-none bg-transparent"
          autoFocus
        />
      </div>

      {/* Player list */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredPlayers.map(name => (
          <button
            key={name}
            onClick={() => handleSelectPlayer(name)}
            className="w-full flex items-center justify-between bg-white border border-border-muted rounded-2xl px-4 py-3.5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold text-sm shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-navy-900 text-sm">{name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-secondary" />
          </button>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="text-center py-8 text-secondary text-sm">
            Nenhum jogador encontrado para "{searchTerm}"
          </div>
        )}

        {/* Admin option */}
        <button
          onClick={() => handleSelectPlayer('Organizador')}
          className="w-full flex items-center justify-between bg-navy-900 rounded-2xl px-4 py-3.5 mt-4"
        >
          <span className="font-semibold text-primary-container text-sm">Organizador (Admin)</span>
          <ChevronRight className="w-4 h-4 text-primary-container" />
        </button>

        {/* Guest */}
        <button
          onClick={handleGuestLogin}
          className="w-full flex items-center justify-center gap-2 border border-border-muted rounded-2xl px-4 py-3.5 text-secondary text-sm"
        >
          <Eye className="w-4 h-4" />
          Entrar como convidado (só visualizar)
        </button>
      </div>
    </div>
  );
};

export default Login;
