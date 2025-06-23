"use client"

import { useState, useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import { HomeIcon, UsersIcon, PhoneCallIcon, BarChartIcon, MenuIcon, XIcon, MoonIcon, SunIcon, FileTextIcon, ShieldIcon } from "./Icons"
import { AuthContext } from "../App"

function MainNav({ logout }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const { currentUser, userType, isAdmin } = useContext(AuthContext)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // In a real app, you would apply dark mode classes to the document here
  }

  // Base routes available to all users
  let routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: <HomeIcon className="h-5 w-5 mr-2" />,
      active: location.pathname === "/",
    },
    {
      href: "/leads",
      label: "Leads",
      icon: <UsersIcon className="h-5 w-5 mr-2" />,
      active: location.pathname.startsWith("/leads"),
    },
    {
      href: "/follow-up",
      label: "Call Tracker",
      icon: <PhoneCallIcon className="h-5 w-5 mr-2" />,
      active: location.pathname.startsWith("/follow-up"),
    },
    {
      href: "/call-tracker",
      label: "Enquiry Tracker",
      icon: <BarChartIcon className="h-5 w-5 mr-2" />,
      active: location.pathname.startsWith("/call-tracker"),
    },
    {
      href: "/quotation",
      label: "Quotation",
      icon: <FileTextIcon className="h-5 w-5 mr-2" />,
      active: location.pathname.startsWith("/quotation"),
    },
  ]
  
  // Add admin-only route if user is admin
  // if (isAdmin && isAdmin()) {
  //   routes.push({
  //     href: "/admin",
  //     label: "Admin",
  //     icon: <ShieldIcon className="h-5 w-5 mr-2" />,
  //     active: location.pathname.startsWith("/admin"),
  //   });
  // }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-8 flex items-center">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Leads To Order System
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-1 flex-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              to={route.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                route.active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {route.icon}
              {route.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {/* User info display */}
          <div className="hidden md:flex items-center mr-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">
                {currentUser?.username || 'User'}
              </span>
              {userType && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  userType === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {userType}
                </span>
              )}
            </div>
          </div>
{/* 
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-100">
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button> */}

          <button
            onClick={logout}
            className="hidden md:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            Logout
          </button>

          <button
            className="md:hidden p-2 rounded-full hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto py-2 space-y-1 px-4">
            {/* Mobile user info display */}
            <div className="flex items-center px-3 py-2 border-b border-slate-100 mb-2">
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">
                  {currentUser?.username || 'User'}
                </span>
                {userType && (
                  <span className={`mt-1 px-2 py-1 text-xs rounded-full w-fit ${
                    userType === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userType}
                  </span>
                )}
              </div>
            </div>
            
            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  route.active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default MainNav