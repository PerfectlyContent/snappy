import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState({ calendar: false, drive: false, contacts: false });

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.getAuthStatus();
      setAuthenticated(data.authenticated);
      setUser(data.user);
      if (data.grants) setGrants(data.grants);
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

  // Check for auth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success' || params.get('scope_granted')) {
      checkAuth();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkAuth]);

  const login = () => {
    window.location.href = '/auth/google';
  };

  const requestScope = (feature) => {
    const returnTo = window.location.pathname;
    window.location.href = `/auth/google/scope/${feature}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const logout = async () => {
    await api.logout();
    setAuthenticated(false);
    setUser(null);
    setGrants({ calendar: false, drive: false, contacts: false });
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, grants, login, logout, requestScope, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
