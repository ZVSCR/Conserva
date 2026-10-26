import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadSession, loginUser, logoutUser } from '../services/auth.js';
import { AuthContext } from './authContext.js';
import { advanceSessionRevision, onSessionExpired } from '../services/apiClient.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [sessionError, setSessionError] = useState('');
  const requestNumber = useRef(0);
  const sessionController = useRef(null);
  const authOperation = useRef(false);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    setStatus(nextUser ? 'authenticated' : 'anonymous');
    setSessionError('');
  }, []);

  const refreshSession = useCallback(async ({ silent = false } = {}) => {
    const request = ++requestNumber.current;
    sessionController.current?.abort();
    const controller = new AbortController();
    sessionController.current = controller;
    if (!silent) setStatus('checking');
    setSessionError('');
    try {
      const nextUser = await loadSession({ signal: controller.signal });
      if (request === requestNumber.current) applyUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error.name === 'AbortError') return null;
      if (request === requestNumber.current) {
        if (!silent) {
          setUser(null);
          setStatus('error');
        }
        setSessionError(error.message);
      }
      throw error;
    }
  }, [applyUser]);

  useEffect(() => onSessionExpired(() => {
    ++requestNumber.current;
    advanceSessionRevision();
    sessionController.current?.abort();
    applyUser(null);
    setSessionError('Sua sessão expirou. Faça login novamente.');
  }), [applyUser]);

  useEffect(() => {
    const recheck = () => {
      if (!authOperation.current) refreshSession({ silent: true }).catch(() => {});
    };
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [refreshSession]);

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
    authOperation.current = true;
    const request = ++requestNumber.current;
    advanceSessionRevision();
    sessionController.current?.abort();
    try {
      const nextUser = await loginUser(credentials);
      if (request === requestNumber.current) applyUser(nextUser);
      return nextUser;
    } catch (error) {
      if (request === requestNumber.current) applyUser(user);
      throw error;
    } finally {
      authOperation.current = false;
    }
  }, [applyUser, user]);

  const logout = useCallback(async () => {
    authOperation.current = true;
    const request = ++requestNumber.current;
    advanceSessionRevision();
    sessionController.current?.abort();
    try {
      await logoutUser();
      if (request === requestNumber.current) applyUser(null);
    } finally {
      authOperation.current = false;
    }
  }, [applyUser]);

  const value = useMemo(() => ({ user, status, sessionError, login, logout, refreshSession }),
    [user, status, sessionError, login, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

