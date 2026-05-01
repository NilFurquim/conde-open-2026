import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { savePlayerContact } from '../lib/matchService';

interface AuthContextType {
  user: null;
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  loginAsPlayer: (playerName: string, whatsapp?: string) => Promise<void>;
  setGuestMode: (val: boolean) => void;
  updateWhatsapp: (whatsapp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isGuest: false,
  isAdmin: false,
  loginAsPlayer: async () => {},
  setGuestMode: () => {},
  updateWhatsapp: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem('tennis_profile');
    const storedGuest = localStorage.getItem('tennis_guest');
    if (storedProfile) {
      try { setProfile(JSON.parse(storedProfile)); } catch {}
    }
    if (storedGuest === 'true') setIsGuest(true);
    setLoading(false);
  }, []);

  const loginAsPlayer = async (playerName: string, whatsapp?: string) => {
    setLoading(true);
    try {
      const isAdminRole = playerName === 'Organizador';
      const newProfile: UserProfile = {
        uid: playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        displayName: playerName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=406900&textColor=ffffff`,
        role: isAdminRole ? UserRole.ADMIN : UserRole.PLAYER,
        playerName,
        whatsapp: whatsapp || undefined,
      };
      setProfile(newProfile);
      setIsGuest(false);
      localStorage.setItem('tennis_profile', JSON.stringify(newProfile));
      localStorage.removeItem('tennis_guest');
      if (whatsapp && !isAdminRole) {
        await savePlayerContact(playerName, whatsapp).catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWhatsapp = async (whatsapp: string) => {
    if (!profile) return;
    const updated = { ...profile, whatsapp };
    setProfile(updated);
    localStorage.setItem('tennis_profile', JSON.stringify(updated));
    await savePlayerContact(profile.playerName, whatsapp).catch(() => {});
  };

  const handleSetGuestMode = (val: boolean) => {
    setIsGuest(val);
    if (val) {
      localStorage.setItem('tennis_guest', 'true');
      setProfile(null);
      localStorage.removeItem('tennis_profile');
    } else {
      localStorage.removeItem('tennis_guest');
    }
  };

  const logout = async () => {
    setProfile(null);
    setIsGuest(false);
    localStorage.removeItem('tennis_profile');
    localStorage.removeItem('tennis_guest');
  };

  return (
    <AuthContext.Provider value={{
      user: null,
      profile,
      loading,
      isGuest,
      isAdmin: profile?.role === UserRole.ADMIN,
      loginAsPlayer,
      setGuestMode: handleSetGuestMode,
      updateWhatsapp,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
