import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Conferindo sua sessão..." />;
  if (!user) return <Navigate to="/entrar" state={{ from: location }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/minha-conta" replace />;
  return children;
}
