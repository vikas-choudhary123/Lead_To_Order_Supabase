import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  // Use state to track the authenticated user
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user in localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('salonUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem('salonUser');
      }
    }
    setLoading(false);
  }, []);

  // Login function - saves user to state and localStorage
  const login = (userData) => {
    console.log("Setting user in auth context:", userData);
    setUser(userData);
    localStorage.setItem('salonUser', JSON.stringify(userData));
  };

  // Logout function - clears user from state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('salonUser');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user is an admin
  const isAdmin = () => {
    return user && user.role === "admin";
  };

  // Check if user is staff
  const isStaff = () => {
    return user && user.role === "staff";
  };

  // Get staff name
  const getStaffName = () => {
    return user && user.staffName ? user.staffName : "";
  };

  // Value to be provided by the context
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isStaff,
    getStaffName
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;