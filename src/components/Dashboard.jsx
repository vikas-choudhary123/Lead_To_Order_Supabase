import { useState } from "react"
import { motion } from "framer-motion"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import Booking from "./Booking"
import DailyEntry from "../DailyEntry"
import StaffAttendance from "../StaffAttendance"
import Inventory from "../Inventory"
import Services from "../Services"

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("booking")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "booking":
        return <Booking />
      case "dailyEntry":
        return <DailyEntry />
      case "staffAttendance":
        return <StaffAttendance />
      case "inventory":
        return <Inventory />
      case "services":
        return <Services />
      default:
        return <Booking />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <motion.main
          key={activeTab}
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

