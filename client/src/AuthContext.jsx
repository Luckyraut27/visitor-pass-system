import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) => (role === 'visitor' ? '/my-passes' : role === 'host' ? '/appointments' : '/');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('vpms_token')) return setLoading(false);
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('vpms_token'))
      .finally(() => setLoading(false));
  }, []);

  const store = ({ token, user }) => {
    localStorage.setItem('vpms_token', token);
    setUser(user);
    return user;
  };

  const login = async (email, password) => store((await api.post('/auth/login', { email, password })).data);
  const register = async (form) => store((await api.post('/auth/register', form)).data);
  const logout = () => {
    localStorage.removeItem('vpms_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
