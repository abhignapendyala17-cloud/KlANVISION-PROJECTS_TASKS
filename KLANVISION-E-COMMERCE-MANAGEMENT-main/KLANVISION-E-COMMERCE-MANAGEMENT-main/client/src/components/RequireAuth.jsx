import { Navigate, useLocation } from 'react-router-dom';
import Loading from './Loading';
import { useApp } from '../context/AppContext';

export default function RequireAuth({ children, role }) {
  const { user, authLoading } = useApp();
  const location = useLocation();
  if (authLoading) return <Loading label="Checking your session…" />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
