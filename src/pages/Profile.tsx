import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, LogOut, Save } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { fetchPlayerContact } from '../lib/matchService';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isGuest, updateWhatsapp, logout } = useAuth();
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.whatsapp) {
      setWhatsapp(profile.whatsapp);
      return;
    }
    fetchPlayerContact(profile.playerName)
      .then(w => {
        if (w) setWhatsapp(w);
      })
      .catch(() => {});
  }, [profile]);

  const handleSave = async () => {
    const phone = whatsapp.replace(/\D/g, '');
    setSaving(true);
    try {
      await updateWhatsapp(phone);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout title="Perfil">
      <div className="space-y-5 pb-6">
        <section className="rounded-2xl border border-border-muted bg-white p-4">
          <p className="text-xs text-secondary">Usuário</p>
          <p className="mt-1 font-lexend font-bold text-base text-navy-900">
            {profile?.playerName ?? (isGuest ? 'Convidado' : '—')}
          </p>
        </section>

        {!isGuest && (
          <section className="rounded-2xl border border-border-muted bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-secondary" />
              <h2 className="font-lexend font-bold text-sm text-navy-900">WhatsApp</h2>
            </div>
            <p className="text-xs text-secondary">
              Use este número para que outros jogadores possam te contatar.
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
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy-900 text-primary-container py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar WhatsApp'}
            </button>
          </section>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border-muted bg-white py-3 text-sm font-bold text-secondary"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </Layout>
  );
};

export default Profile;
