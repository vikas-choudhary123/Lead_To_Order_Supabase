import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// Protected route component that only checks for authentication
const ProtectedRoute = ({ 
  redirectPath = '/login' // Default redirect path
}) => {
  const { isAuthenticated } = useAuth();
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // If authenticated, render the child routes
  // Role-based restrictions will be handled inside the Dashboard component
  return <Outlet />;
};

export default ProtectedRoute;