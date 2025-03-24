"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { useMediaQuery } from "../../hooks/useMobile"

export default function Layout({ children, currentRoute, setCurrentRoute }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-200">
      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          currentRoute={currentRoute}
        />

        {/* Main Content */}
        <motion.main
          key={currentRoute}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

