import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: any | null; // Keeping signature for compatibility
  profile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  loginAsPlayer: (playerName: string, isAdmin?: boolean) => Promise<void>;
  setGuestMode: (val: boolean) => void;
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
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Load from local storage
    const storedProfile = localStorage.getItem('tennis_profile');
    const storedGuest = localStorage.getItem('tennis_guest');
    
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
    
    if (storedGuest === 'true') {
      setIsGuest(true);
    }
    
    setLoading(false);
  }, []);

  const loginAsPlayer = async (playerName: string, isAdminRole: boolean = false) => {
    setLoading(true);
    try {
      // Create a mock uid based on name
      const uid = playerName.toLowerCase().replace(/\s+/g, '-');
      
      const newProfile: UserProfile = {
        uid: uid,
        email: '',
        displayName: playerName,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}&backgroundColor=f1f5f9`,
        role: isAdminRole ? UserRole.ADMIN : UserRole.PLAYER,
        playerName: playerName
      };

      setProfile(newProfile);
      setIsGuest(false);
      localStorage.setItem('tennis_profile', JSON.stringify(newProfile));
      localStorage.removeItem('tennis_guest');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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

  const isAdmin = profile?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ 
      user: null, 
      profile, 
      loading, 
      isGuest, 
      isAdmin, 
      loginAsPlayer,
      setGuestMode: handleSetGuestMode,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
