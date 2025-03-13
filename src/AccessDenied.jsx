import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from './Context/AuthContext';

const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Access Denied</h2>
          
          <p className="text-gray-600 text-center mb-6">
            Sorry, you don't have permission to access this page. 
            {user?.role === 'staff' && (
              <span> As a staff member, you only have access to the booking system.</span>
            )}
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={() => navigate(user?.role === 'staff' ? '/admin-dashboard' : '/')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {user?.role === 'staff' ? 'Go to Booking' : 'Go to Home'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessDenied;