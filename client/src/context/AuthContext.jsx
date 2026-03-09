import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getAuthStatus();
      setAuthenticated(data.authenticated);
      setUser(data.user);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      checkAuth();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkAuth]);

  const login = () => {
    window.location.href = '/auth/google';
  };

  const logout = async () => {
    await api.logout();
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
