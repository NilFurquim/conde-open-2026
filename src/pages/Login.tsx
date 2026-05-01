import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, User, ShieldCheck, Trophy, ChevronRight } from 'lucide-react';
import { CATEGORY_A_PLAYERS, CATEGORY_B_GROUPS, CATEGORY_C_GROUPS } from '../constants/tournamentData';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsPlayer, setGuestMode } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPlayer, setLoadingPlayer] = useState<string | null>(null);

  // Flatten all players into one list
  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    CATEGORY_A_PLAYERS.forEach(p => players.add(p));
    Object.values(CATEGORY_B_GROUPS).forEach(pList => pList.forEach(p => players.add(p)));
    Object.values(CATEGORY_C_GROUPS).forEach(pList => pList.forEach(p => players.add(p)));
    
    // Add explicitly known admin or specific names from screenshots
    players.add('Organizador');
    
    return Array.from(players).sort();
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return allPlayers.slice(0, 10); // Show first 10 initially
    return allPlayers.filter(p => 
      p.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [searchTerm, allPlayers]);

  const handleSelectPlayer = async (name: string) => {
    setLoadingPlayer(name);
    try {
      const isAdmin = name === 'Organizador';
      await loginAsPlayer(name, isAdmin);
      navigate('/');
    } catch (e) {
      alert('Erro ao entrar no perfil.');
    } finally {
      setLoadingPlayer(null);
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">
      {/* Header */}
      <header className="flex flex-col items-center justify-center mt-12 mb-10 space-y-4">
        <div className="w-16 h-16 bg-navy-900 rounded-3xl flex items-center justify-center shadow-xl shadow-navy-900/20 rotate-[-4deg]">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-lexend font-black text-3xl text-navy-900 tracking-tight uppercase">
          Conde Open <span className="text-primary italic">2026</span>
        </h1>
      </header>

      <div className="mx-auto w-full max-w-sm space-y-10">
        
        {/* Guest Button Section */}
        <section className="space-y-3">
          <button 
            onClick={handleGuestLogin}
            className="w-full bg-primary text-navy-900 font-lexend font-bold py-5 px-6 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-lg hover:shadow-xl shadow-primary/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-navy-900/10 p-2 rounded-xl">
                <User className="w-5 h-5 text-navy-900" />
              </div>
              <span className="text-sm tracking-widest uppercase">Acessar Como Convidado</span>
            </div>
            <ChevronRight className="w-5 h-5 text-navy-900 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-center text-slate-400 text-xs font-medium px-4">
            Acesso rápido para visualização de chaves e resultados.
          </p>
        </section>

        <div className="flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ou acesse seu perfil</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Player Section */}
        <section className="space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="font-lexend font-black text-2xl text-navy-900 tracking-tight">Sou Jogador</h2>
            <p className="text-slate-400 text-sm">Selecione seu nome para gerenciar seus jogos.</p>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 font-lexend text-sm placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>

          {/* Player Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredPlayers.map(player => (
              <button
                key={player}
                onClick={() => handleSelectPlayer(player)}
                disabled={!!loadingPlayer}
                className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-all shadow-sm hover:shadow-md hover:border-primary group ${loadingPlayer === player ? 'opacity-50' : ''}`}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm group-hover:border-primary/20 transition-colors">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player}&backgroundColor=f1f5f9`} 
                      alt={player}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {player === 'Organizador' && (
                    <div className="absolute -bottom-1 -right-1 bg-navy-900 text-primary p-1 rounded-full shadow-md">
                      <ShieldCheck size={12} />
                    </div>
                  )}
                </div>
                <span className="font-lexend font-bold text-sm text-slate-700 tracking-tight group-hover:text-navy-900 transition-colors truncate w-full text-center">
                  {player}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
};

export default Login;
