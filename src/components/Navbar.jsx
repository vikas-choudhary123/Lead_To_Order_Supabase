"use client"

import React, { useState, useEffect } from "react";
import { Menu, Bell, X } from "lucide-react";

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [formAnimation, setFormAnimation] = useState(false);

  const toggleAdminForm = () => {
    if (!showAdminForm) {
      setShowAdminForm(true);
      setTimeout(() => setFormAnimation(true), 10);
    } else {
      setFormAnimation(false);
      setTimeout(() => setShowAdminForm(false), 300);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        toggleAdminForm();
      }
    };

    if (showAdminForm) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [showAdminForm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Admin login submitted");
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

            <button
  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 w-auto max-w-fit"
  onClick={toggleAdminForm}
>
  Admin Login
</button>


            <img
              src="https://t4.ftcdn.net/jpg/02/88/65/87/240_F_288658769_P0XwssJydQP9EJRBfL6K1HwyNZ5ttw09.jpg"
              alt="Salon Logo"
              className="h-10 hidden sm:block"
            />
          </div>
        </div>
      </header>

      {showAdminForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-transform duration-300 ${formAnimation ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Admin Login</h3>
              <button className="p-2 rounded-full hover:bg-gray-200" onClick={toggleAdminForm}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input id="username" type="text" className="w-full p-2 border border-gray-300 rounded-md" required />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input id="password" type="password" className="w-full p-2 border border-gray-300 rounded-md" required />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition duration-300"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;