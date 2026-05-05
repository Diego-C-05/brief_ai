import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe } from '../services/authService';

export default function ProtectedRoute() {
  const [status, setStatus] = useState<'loading'|'ok'|'unauth'>('loading');

  useEffect(() => {
    getMe().then(user =>
      setStatus(user ? 'ok' : 'unauth')
    ).catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') return <div>Caricamento...</div>;
  if (status === 'unauth') return <Navigate to='/login' replace />;
  return <Outlet />;
}
