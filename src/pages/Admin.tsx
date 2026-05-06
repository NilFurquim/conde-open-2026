import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DatabaseInitializer from '../components/DatabaseInitializer';
import DeadlinePanel from '../components/DeadlinePanel';
import { fetchSettings } from '../lib/matchService';
import { TournamentSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const { profile, loading, isGuest, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TournamentSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!profile || isGuest || !isAdmin) {
      setLoadingSettings(false);
      return;
    }
    let cancelled = false;
    fetchSettings()
      .then(s => {
        if (!cancelled) setSettings(s);
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, profile, isGuest, isAdmin]);

  if (loading) {
    return (
      <Layout title="Admin">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-secondary">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (!profile || isGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <Layout title="Admin">
        <div className="space-y-4 pb-8">
          <div className="rounded-2xl border border-border-muted bg-white p-5 space-y-2">
            <h2 className="font-lexend font-bold text-base text-navy-900">Acesso restrito</h2>
            <p className="text-sm text-secondary leading-relaxed">
              Você está logado como <span className="font-semibold text-navy-900">{profile.playerName}</span>.
              Para acessar <span className="font-mono text-navy-900">/admin</span>, entre como
              <span className="font-semibold text-navy-900"> Organizador</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true, state: { from: '/admin' } });
            }}
            className="w-full rounded-xl bg-navy-900 text-primary-container py-3 text-sm font-bold uppercase tracking-wider"
          >
            Trocar para Organizador
          </button>
        </div>
      </Layout>
    );
  }

  if (loadingSettings) {
    return (
      <Layout title="Admin">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-secondary">Carregando configurações...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin">
      <div className="space-y-4 pb-8">
        <DatabaseInitializer />
        <DeadlinePanel settings={settings} onSaved={() => fetchSettings().then(setSettings)} />
      </div>
    </Layout>
  );
};

export default Admin;
