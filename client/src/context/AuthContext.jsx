import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('street095_token')));
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function handleExpired() { setUser(null); setSessionExpired(true); }
    window.addEventListener('street095:session-expired', handleExpired);
    return () => window.removeEventListener('street095:session-expired', handleExpired);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('street095_token')) return;
    api('/auth/me').then(({ user: current }) => setUser(current)).catch(() => {
      localStorage.removeItem('street095_token'); setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  async function signIn(credentials) {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    localStorage.setItem('street095_token', result.token); setSessionExpired(false); setUser(result.user); return result.user;
  }
  async function signUp(details) {
    const result = await api('/auth/register', { method: 'POST', body: JSON.stringify(details) });
    localStorage.setItem('street095_token', result.token); setSessionExpired(false); setUser(result.user); return result.user;
  }
  function signOut() { localStorage.removeItem('street095_token'); setSessionExpired(false); setUser(null); }

  const value = useMemo(() => ({ user, loading, sessionExpired, signIn, signUp, signOut, isAdmin: user?.role === 'admin' }), [user, loading, sessionExpired]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
