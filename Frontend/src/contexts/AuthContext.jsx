import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthContext from './auth-context';
import { API_BASE_URL } from '../services/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const expireSession = () => setUser(null);
        window.addEventListener('conserva:session-expired', expireSession);
        return () => window.removeEventListener('conserva:session-expired', expireSession);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function restoreSession() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    credentials: 'include'
                });

                if (response.status === 401) {
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Falha ao restaurar sessão (HTTP ${response.status}).`);
                }

                const data = await response.json();
                if (isMounted) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Erro ao restaurar sessão:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        restoreSession();
        return () => {
            isMounted = false;
        };
    }, []);

    const logout = useCallback(async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Falha ao encerrar sessão (HTTP ${response.status}).`);
        }

        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        setUser,
        logout
    }), [user, loading, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
