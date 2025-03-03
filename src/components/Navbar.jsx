"use client"

import { useState } from "react"
import { Menu, Bell, User } from "lucide-react"

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <header className="bg-white border-b border-blue-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center">
          <button
            className="p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 md:hidden"
            aria-label="Open sidebar"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
          <h1 className="ml-2 text-xl font-semibold text-blue-800 md:hidden">Salon Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            className="p-1.5 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center transition-colors duration-300 hover:bg-blue-200">
                <User size={18} className="text-blue-600" />
              </div>
              <span className="hidden text-sm font-medium text-blue-700 md:block">Admin</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-blue-200 fade-in">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors duration-300"
                >
                  Your Profile
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors duration-300"
                >
                  Settings
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 transition-colors duration-300"
                >
                  Sign out
                </a>
              </div>
            )}
          </div> */}

<div className="relative">
          <div className="relative bg-blue-600 h-9 w-24 rounded flex items-center justify-center text-white 
              px-4 py-2 text-sm md:text-base lg:w-32 hover:bg-blue-700 transition duration-300">
  <button className="w-full">Admin Login</button>
</div>
          </div>

          <div className="flex items-center">
          <img src="https://t4.ftcdn.net/jpg/02/88/65/87/240_F_288658769_P0XwssJydQP9EJRBfL6K1HwyNZ5ttw09.jpg" alt="Salon Logo" className="h-10" />

          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar

