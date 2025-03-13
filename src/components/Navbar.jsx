"use client"

import React from "react";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from '../Context/AuthContext'; // Import the auth context
import { useNavigate } from 'react-router-dom'; // Import navigate hook

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useAuth(); // Get the logout function from auth context
  const navigate = useNavigate(); // Use navigate for redirection
  
  // Function to handle logout - clear auth state and navigate to login page
  const handleLogout = () => {
    console.log("Logging out...");
    
    // Call the logout function from auth context to clear the user state
    logout();
    
    // Navigate to login page
    navigate('/login');
    
    // If navigate doesn't work, fallback to window.location
    // setTimeout(() => {
    //   if (window.location.pathname !== '/login') {
    //     window.location.href = '/login';
    //   }
    // }, 100);
  };
  
  return (
    <>
      <header className="bg-white border-b border-blue-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center">
            <button
              className="p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
            <h1 className="ml-2 text-xl font-semibold text-blue-800 md:hidden">Salon Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="p-1.5 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
            >
              <Bell size={20} />
            </button>
            {/* Logout Button */}
            <button
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span className="text-sm">Logout</span>
            </button>
            <img
              src="https://t4.ftcdn.net/jpg/02/88/65/87/240_F_288658769_P0XwssJydQP9EJRBfL6K1HwyNZ5ttw09.jpg"
              alt="Salon Logo"
              className="h-10 hidden sm:block"
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;