import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Trophy, BookOpen, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { profile, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface pb-24">
      {/* Top App Bar */}
      <header className="bg-white sticky top-0 z-50 border-b border-border-muted shadow-sm flex justify-between items-center px-4 h-16 w-full">
        <button onClick={handleLogout} className="flex items-center gap-3 active:scale-95 transition-transform text-left">
          <Trophy className="w-5 h-5 text-navy-900" />
          <h1 className="font-lexend font-bold text-lg tracking-tight text-navy-900">{title === 'Início' && !isGuest && profile ? profile.playerName : title}</h1>
        </button>
        <button onClick={handleLogout} className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary active:scale-95 transition-transform">
          {profile ? (
            <img src={profile.photoURL} alt="Foto do Perfil" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-surface flex items-center justify-center">
               <User className="w-5 h-5 text-secondary" />
             </div>
          )}
        </button>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-lg">
        <NavItem to="/" icon={<Home />} label="Início" />
        <NavItem to="/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem to="/chaves" icon={<Trophy />} label="Chaves" />
        <NavItem to="/regras" icon={<BookOpen />} label="Regras" />
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center px-3 py-1 active:scale-90 transition-all duration-200 ${
        isActive ? 'text-navy-900 bg-primary/20 rounded-xl' : 'text-slate-400 hover:text-slate-600'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${isActive ? 'fill-current' : ''}` })}
        <span className="font-lexend text-[10px] font-semibold uppercase tracking-wider mt-1">{label}</span>
      </>
    )}
  </NavLink>
);

export default Layout;
