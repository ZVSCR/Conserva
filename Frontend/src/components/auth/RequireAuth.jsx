import { Fragment } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

function RequireAuth() {
    const { user, loading, status, sessionError, refreshSession } = useAuth();

    if (loading) {
        return <p role="status">Verificando sessão...</p>;
    }

    if (status === 'error') return (
        <div>
            <p role="alert">{sessionError || 'Não foi possível verificar a sessão.'}</p>
            <button type="button" onClick={() => refreshSession().catch(() => {})}>Tentar novamente</button>
        </div>
    );

    return user ? <Fragment key={user.id}><Outlet /></Fragment> : <Navigate to="/login" replace />;
}

export default RequireAuth;
