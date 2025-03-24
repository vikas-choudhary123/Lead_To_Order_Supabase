"use client"

import { motion } from "framer-motion"
import { Bell, Menu, Search, User } from "lucide-react"

export default function Navbar({ sidebarOpen, setSidebarOpen, isMobile, currentRoute }) {
  // Function to format the current route for display
  const formatRouteTitle = (route) => {
    if (route === "/") return "Dashboard"
    return route.split("/").filter(Boolean).join(" / ")
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      <div className="flex items-center gap-2">
        {isMobile && (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold capitalize bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          {formatRouteTitle(currentRoute)}
        </motion.h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-64 rounded-full bg-gray-800 border-gray-700 pl-8 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
        </button>
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  )
}

