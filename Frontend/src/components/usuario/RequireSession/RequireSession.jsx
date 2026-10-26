import { Fragment } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';

export default function RequireSession() {
  const { user, status, sessionError, refreshSession } = useAuth();
  if (status === 'checking') return <p role="status">Verificando sessão...</p>;
  if (status === 'error') return (
    <div>
      <p role="alert">{sessionError || 'Não foi possível verificar a sessão.'}</p>
      <button type="button" onClick={() => refreshSession().catch(() => {})}>Tentar novamente</button>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  // Trocar de conta também descarta os estados e dados da conta anterior.
  return <Fragment key={user.id}><Outlet /></Fragment>;
}
