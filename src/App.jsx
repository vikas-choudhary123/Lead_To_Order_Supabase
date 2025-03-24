"use client"

import { useState } from "react"
import Layout from "./components/layout/Layout"
import Dashboard from "./components/dashboard/Dashboard"
import BookingsPage from "./components/bookings/BookingsPage"
import DailyEntryPage from "./components/dailyEntry/DailyEntryPage"
import CarServicePage from "./components/services/CarServicePage"
import BikeServicePage from "./components/services/BikeServicePage"
import AddServicePage from "./components/services/AddServicePage"
import ServiceHistoryPage from "./components/services/ServiceHistoryPage"
import StaffAttendancePage from "./components/staff/StaffAttendancePage"
import AddStaffPage from "./components/staff/AddStaffPage"
import StaffHistoryPage from "./components/staff/StaffHistoryPage"

function App() {
  const [currentRoute, setCurrentRoute] = useState("/")

  // Simple routing function
  const renderContent = () => {
    switch (currentRoute) {
      case "/":
        return <Dashboard />
      case "/bookings":
        return <BookingsPage />
      case "/daily-entry":
        return <DailyEntryPage />
      case "/services/car":
        return <CarServicePage />
      case "/services/bike":
        return <BikeServicePage />
      case "/services/add":
        return <AddServicePage />
      case "/services/history":
        return <ServiceHistoryPage />
      case "/staff/attendance":
        return <StaffAttendancePage />
      case "/staff/add":
        return <AddStaffPage />
      case "/staff/history":
        return <StaffHistoryPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentRoute={currentRoute} setCurrentRoute={setCurrentRoute}>
      {renderContent()}
    </Layout>
  )
}

export default App

