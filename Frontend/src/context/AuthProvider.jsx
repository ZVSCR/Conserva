import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadSession, loginUser, logoutUser } from '../services/auth.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [sessionError, setSessionError] = useState('');
  const requestNumber = useRef(0);
  const sessionController = useRef(null);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setStatus(nextUser ? 'authenticated' : 'anonymous');
    setSessionError('');
  }, []);

  const refreshSession = useCallback(async () => {
    const request = ++requestNumber.current;
    sessionController.current?.abort();
    const controller = new AbortController();
    sessionController.current = controller;
    setStatus('checking');
    setSessionError('');
    try {
      const nextUser = await loadSession({ signal: controller.signal });
      if (request === requestNumber.current) applyUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error.name === 'AbortError') return null;
      if (request === requestNumber.current) {
        setUser(null);
        setStatus('error');
        setSessionError(error.message);
      }
      throw error;
    }
  }, [applyUser]);

  useEffect(() => {
    const controller = new AbortController();
    const request = ++requestNumber.current;
    sessionController.current = controller;
    loadSession({ signal: controller.signal }).then((nextUser) => {
      if (!controller.signal.aborted && request === requestNumber.current) applyUser(nextUser);
    }).catch((error) => {
      if (!controller.signal.aborted && request === requestNumber.current) {
        setStatus('error');
        setSessionError(error.message);
      }
    });
    return () => controller.abort();
  }, [applyUser]);

  const login = useCallback(async (credentials) => {
    const request = ++requestNumber.current;
    sessionController.current?.abort();
    try {
      const nextUser = await loginUser(credentials);
      if (request === requestNumber.current) applyUser(nextUser);
      return nextUser;
    } catch (error) {
      if (request === requestNumber.current) applyUser(user);
      throw error;
    }
  }, [applyUser, user]);

  const logout = useCallback(async () => {
    const request = ++requestNumber.current;
    sessionController.current?.abort();
    await logoutUser();
    if (request === requestNumber.current) applyUser(null);
  }, [applyUser]);

  const value = useMemo(() => ({ user, status, sessionError, login, logout, refreshSession }),
    [user, status, sessionError, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

