"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "../Context/AuthContext.jsx"
import Navbar from "./Navbar.jsx"
import Sidebar from "./Sidebar.jsx"
import Booking from "./Booking.jsx"
import DailyEntry from "../DailyEntry.jsx"
import StaffAttendance from "../StaffAttendance.jsx"
import Inventory from "../Inventory.jsx"
import Services from "../Services.jsx"
import StaffDB from "../StaffDb.jsx"
import StaffHistory from "../StaffHistory.jsx"
import PaymentCommission from "../payment-commission.jsx"

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("booking")
  const [activeStaffTab, setActiveStaffTab] = useState("staffAttendance")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [allowedTabs, setAllowedTabs] = useState([])

  // Set initial active tab and allowed tabs based on user role
  useEffect(() => {
    // For staff users, allow access to booking, dailyEntry, and inventory
    if (user?.role === "staff") {
      setActiveTab("booking")
      setAllowedTabs(["booking", "dailyEntry", "inventory", "paymentCommission"])
    } else {
      // Admin users have access to all tabs
      setAllowedTabs(["booking", "dailyEntry", "staff", "inventory", "services", "paymentCommission"])
    }
  }, [user])

  // Handle tab change - only allow changing to permitted tabs
  const handleTabChange = (tabName) => {
    if (allowedTabs.includes(tabName)) {
      setActiveTab(tabName)
    }
  }

  // This function handles the main content rendering
  const renderContent = () => {
    // For admin users with staff tab selected
    if (user?.role === "admin" && activeTab === "staff") {
      switch (activeStaffTab) {
        case "staffAttendance":
          return <StaffAttendance />
        case "staffDB":
          return <StaffDB />
        case "staffHistory":
          return <StaffHistory />
        default:
          return <StaffAttendance />
      }
    }

    // Handle other main tabs (available to both admin and staff where permitted)
    switch (activeTab) {
      case "booking":
        return <Booking hideHistoryButton={user?.role === "staff"} />
      case "dailyEntry":
        return <DailyEntry hideHistoryButton={user?.role === "staff"} />
      case "inventory":
        return <Inventory hideHistoryButton={user?.role === "staff"} />
      case "services":
        // Pass isAdmin prop based on user role
        return <Services isAdmin={user?.role === "admin"} />
      case "paymentCommission":
        return <PaymentCommission isAdmin={user?.role === "admin"} />
      default:
        return <Booking hideHistoryButton={user?.role === "staff"} />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeStaffTab={activeStaffTab}
        setActiveStaffTab={setActiveStaffTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        allowedTabs={allowedTabs}
        userRole={user?.role}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} userRole={user?.role} />
        <motion.main
          key={activeTab === "staff" ? activeStaffTab : activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-4 md:p-6"
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  )
}

export default Dashboard

