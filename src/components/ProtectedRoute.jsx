import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  if (authService.isAuthenticated()) {
    return <Navigate to="/energymonitoring" state={{ from: location }} replace />;
  }

  return children;
};