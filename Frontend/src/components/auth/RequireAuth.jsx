import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

function RequireAuth() {
    const { user, loading } = useAuth();

    if (loading) {
        return <p role="status">Verificando sessão...</p>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default RequireAuth;
