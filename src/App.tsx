import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Agenda from './pages/Agenda';
import Brackets from './pages/Brackets';
import Rules from './pages/Rules';
import MatchDetail from './pages/MatchDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading, isGuest } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50 text-secondary text-sm">Carregando...</div>;
  if (!profile && !isGuest) return <Navigate to="/login" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
          <Route path="/chaves" element={<PrivateRoute><Brackets /></PrivateRoute>} />
          <Route path="/regras" element={<PrivateRoute><Rules /></PrivateRoute>} />
          <Route path="/match/:id" element={<PrivateRoute><MatchDetail /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
