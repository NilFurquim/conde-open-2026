import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Trophy, BookOpen, BarChart2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { profile, isGuest } = useAuth();
  const navigate = useNavigate();

  const handleTitleClick = () => navigate('/');
  const handleProfileClick = () => navigate('/perfil');

  const headerName = profile?.playerName ?? (isGuest ? 'Convidado' : '');

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-[4.5rem] sm:pb-[4.75rem]">
      {/* Top App Bar */}
      <header className="bg-white sticky top-0 z-50 border-b border-border-muted shadow-sm flex min-h-16 justify-between items-center gap-2 px-3 sm:px-4 py-2 w-full">
        <button type="button" onClick={handleTitleClick} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 active:scale-95 transition-transform text-left">
          <Trophy className="w-5 h-5 shrink-0 text-navy-900" />
          <h1 className="font-lexend min-w-0 truncate font-bold text-base sm:text-lg tracking-tight text-navy-900">{title}</h1>
        </button>
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex max-w-[55%] shrink-0 items-center gap-2 rounded-xl py-1 pl-2 pr-1 active:scale-95 transition-transform sm:gap-2.5 sm:pl-2.5"
          title="Abrir perfil"
        >
          {headerName && (
            <span className="font-lexend min-w-0 truncate text-right text-xs font-semibold leading-tight text-navy-900 sm:text-sm">
              {headerName}
            </span>
          )}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-slate-100">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : profile?.playerName ? (
              <span className="font-lexend text-[11px] font-bold text-navy-900">{initialsFromName(profile.playerName)}</span>
            ) : (
              <User className="h-5 w-5 text-secondary" aria-hidden />
            )}
          </div>
        </button>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-between gap-0 border-t border-slate-100 bg-white px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] sm:h-[4.25rem] sm:px-2">
        <NavItem to="/" icon={<Home />} label="Início" />
        <NavItem to="/agenda" icon={<Calendar />} label="Agenda" />
        <NavItem to="/chaves" icon={<Trophy />} label="Chaves" />
        <NavItem to="/stats" icon={<BarChart2 />} label="Estatísticas" />
        <NavItem to="/regras" icon={<BookOpen />} label="Regras" />
      </nav>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const { pathname } = useLocation();
  const isActive = to === '/' ? pathname === '/' : pathname === to;

  return (
    <Link
      to={to}
      className={`flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center py-0.5 active:opacity-80 ${
        isActive ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span
        className={`inline-flex max-w-full flex-col items-center justify-center gap-0.5 rounded-md px-2 py-0.5 sm:px-2.5 sm:py-0.5 ${
          isActive ? 'bg-primary/18' : ''
        }`}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `h-[22px] w-[22px] shrink-0 sm:h-6 sm:w-6 ${isActive ? 'text-navy-900' : ''}`,
        })}
        <span className="max-w-[4.2rem] truncate whitespace-nowrap text-center font-lexend text-[7px] font-semibold uppercase leading-none tracking-normal text-current sm:max-w-[4.4rem] sm:text-[8px]">
          {label}
        </span>
      </span>
    </Link>
  );
};

export default Layout;
