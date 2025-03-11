import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, hasRole } = useAuth();
  
  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated());
  
  if (!isAuthenticated()) {
    // Not logged in, redirect to login
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" />;
  }
  
  // If a specific role is required
  if (role && !hasRole(role)) {
    console.log(`User doesn't have required role: ${role}`);
    // User doesn't have the required role, redirect to login or unauthorized page
    return <Navigate to="/login" />;
  }
  
  // User is authenticated and has the required role
  console.log("Access granted");
  return children;
};

export default ProtectedRoute;