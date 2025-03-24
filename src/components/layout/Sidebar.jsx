"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Car, ChevronDown, ClipboardList, Home, LogOut, Users, X } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: Calendar,
  },
  {
    title: "Daily Entry",
    href: "/daily-entry",
    icon: ClipboardList,
  },
  {
    title: "Services",
    href: "/services",
    icon: Car,
    submenu: [
      { title: "Car Service", href: "/services/car", icon: Car },
      { title: "Bike Service", href: "/services/bike", icon: Motorcycle },
      { title: "Add Service", href: "/services/add", icon: Car },
      { title: "History", href: "/services/history", icon: Car },
    ],
  },
  {
    title: "Staff DB",
    href: "/staff",
    icon: Users,
    submenu: [
      { title: "Staff Attendance", href: "/staff/attendance", icon: Users },
      { title: "Add Staff", href: "/staff/add", icon: Users },
      { title: "Staff History", href: "/staff/history", icon: Users },
    ],
  },
]

export default function Sidebar({ sidebarOpen, setSidebarOpen, isMobile, currentRoute, setCurrentRoute }) {
  const [expandedItems, setExpandedItems] = useState({})

  // Auto-expand the current section in the sidebar
  useEffect(() => {
    const newExpandedItems = {}
    navItems.forEach((item) => {
      if (item.submenu && (currentRoute === item.href || currentRoute.startsWith(item.href + "/"))) {
        newExpandedItems[item.title] = true
      }
    })
    setExpandedItems(newExpandedItems)
  }, [currentRoute])

  const toggleSubmenu = (title) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  const isActive = (href) => {
    return currentRoute === href || currentRoute.startsWith(href + "/")
  }

  const handleNavigation = (href) => {
    setCurrentRoute(href)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <motion.aside
      initial={isMobile ? { x: "-100%" } : false}
      animate={isMobile ? { x: sidebarOpen ? 0 : "-100%" } : {}}
      transition={{ type: "spring", damping: 20 }}
      className={`fixed top-0 left-0 z-30 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col ${isMobile ? "" : "md:relative"}`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white overflow-hidden">
            <motion.div
              animate={{
                rotate: [0, 10, 0, -10, 0],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                duration: 5,
                ease: "easeInOut",
              }}
            >
              <Car className="h-6 w-6" />
            </motion.div>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AutoService
          </span>
        </div>
        {isMobile && (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <div key={index} className="space-y-1">
              {item.submenu ? (
                <>
                  <button
                    className={`inline-flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive(item.href) ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800 hover:text-blue-400"}`}
                    onClick={() => toggleSubmenu(item.title)}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </div>
                    <motion.div
                      animate={{ rotate: expandedItems[item.title] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedItems[item.title] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 space-y-1 border-l border-gray-800 pl-2"
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <motion.div
                            key={subIndex}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: subIndex * 0.05 }}
                          >
                            <button
                              onClick={() => handleNavigation(subItem.href)}
                              className={`inline-flex items-center justify-start w-full rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive(subItem.href) ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800 hover:text-blue-400"}`}
                            >
                              <subItem.icon className="mr-2 h-4 w-4" />
                              {subItem.title}
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`inline-flex items-center justify-start gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive(item.href) ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800 hover:text-blue-400"}`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-gray-800 p-4">
        <button className="inline-flex items-center justify-start gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-red-400 hover:text-red-300 hover:bg-red-950/30">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </motion.aside>
  )
}

