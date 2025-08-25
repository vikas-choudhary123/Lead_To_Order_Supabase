"use client"

import { useState, useContext } from "react"
import { Link, useLocation } from "react-router-dom"
import { HomeIcon, UsersIcon, PhoneCallIcon, BarChartIcon, MenuIcon, XIcon, FileTextIcon } from "./Icons"
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
  const routes = [
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
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 sm:mr-8 flex items-center flex-shrink-0">
          <Link to="/" className="flex items-center">
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <span className="hidden sm:inline">Leads To Order System</span>
              <span className="sm:hidden">LTO System</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-1 flex-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              to={route.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                route.active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {route.icon}
              <span className="hidden xl:inline">{route.label}</span>
              <span className="xl:hidden">{route.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center mr-2 sm:mr-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                {currentUser?.username || "User"}
              </span>
              {userType && (
                <span
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    userType === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {userType}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="hidden md:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
          >
            Logout
          </button>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="container mx-auto py-3 space-y-1 px-4 sm:px-6">
            <div className="flex items-center px-3 py-3 border-b border-slate-100 mb-3">
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">{currentUser?.username || "User"}</span>
                {userType && (
                  <span
                    className={`mt-1 px-2 py-1 text-xs rounded-full w-fit ${
                      userType === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {userType}
                  </span>
                )}
              </div>
            </div>

            {routes.map((route) => (
              <Link
                key={route.href}
                to={route.href}
                className={`flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors ${
                  route.active ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}

            <button
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
              className="flex w-full items-center px-3 py-3 text-base font-medium rounded-md transition-colors text-slate-700 hover:bg-slate-100"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default MainNav
