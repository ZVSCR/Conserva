import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthContext from './auth-context';
import { loadSession, loginUser, logoutUser } from '../services/auth.js';
import { advanceSessionRevision } from '../services/api.js';

export function AuthProvider({ children }) {
    const [user, setUserState] = useState(null);
    const [status, setStatus] = useState('checking');
    const [sessionError, setSessionError] = useState('');
    const currentUser = useRef(null);
    const requestNumber = useRef(0);
    const sessionController = useRef(null);
    const authOperation = useRef(false);

    const applyUser = useCallback((nextUser) => {
        // Uma confirmação de sessão torna respostas anteriores obsoletas.
        advanceSessionRevision();
        currentUser.current = nextUser;
        setUserState(nextUser);
        setStatus(nextUser ? 'authenticated' : 'anonymous');
        setSessionError('');
    }, []);

    // Preserva o contrato de setUser utilizado pela main.
    const setUser = useCallback((value) => {
        applyUser(typeof value === 'function' ? value(currentUser.current) : value);
    }, [applyUser]);

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
                    currentUser.current = null;
                    setUserState(null);
                    setStatus('error');
                }
                setSessionError(error.message);
            }
            throw error;
        }
    }, [applyUser]);

    useEffect(() => {
        const expireSession = () => {
            ++requestNumber.current;
            sessionController.current?.abort();
            applyUser(null);
            setSessionError('Sua sessão expirou. Faça login novamente.');
        };
        window.addEventListener('conserva:session-expired', expireSession);
        return () => window.removeEventListener('conserva:session-expired', expireSession);
    }, [applyUser]);

    useEffect(() => {
        const recheck = () => {
            if (!authOperation.current) refreshSession({ silent: currentUser.current !== null }).catch(() => {});
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
        return () => sessionController.current?.abort();
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
            if (request === requestNumber.current) applyUser(currentUser.current);
            throw error;
        } finally {
            authOperation.current = false;
        }
    }, [applyUser]);

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

    const value = useMemo(() => ({
        user, loading: status === 'checking', status, sessionError, setUser, login, logout, refreshSession
    }), [user, status, sessionError, setUser, login, logout, refreshSession]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
