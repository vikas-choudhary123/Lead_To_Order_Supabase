"use client"

import { useState, useEffect, createContext } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Leads from "./pages/Leads"
import FollowUp from "./pages/FollowUp"
import NewFollowUp from "./pages/NewFollowUp"
import CallTracker from "./pages/CallTracker"
import NewCallTracker from "./pages/NewCallTracker"
import Quotation from "./pages/Quotation"
import MainNav from "./components/MainNav"
import Footer from "./components/Footer"
import Notification from "./components/Notification"

// Create auth context
export const AuthContext = createContext(null)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notification, setNotification] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (username, password) => {
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true)
      localStorage.setItem("isAuthenticated", "true")
      showNotification("Login successful", "success")
      return true
    }
    showNotification("Invalid credentials", "error")
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
    showNotification("Logged out successfully", "success")
  }

  const showNotification = (message, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />
    }
    return children
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, showNotification }}>
      <Router>
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
          {isAuthenticated && <MainNav logout={logout} />}
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/follow-up"
                element={
                  <ProtectedRoute>
                    <FollowUp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/follow-up/new"
                element={
                  <ProtectedRoute>
                    <NewFollowUp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/call-tracker"
                element={
                  <ProtectedRoute>
                    <CallTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/call-tracker/new"
                element={
                  <ProtectedRoute>
                    <NewCallTracker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotation"
                element={
                  <ProtectedRoute>
                    <Quotation />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          {isAuthenticated && <Footer />}
          {notification && <Notification message={notification.message} type={notification.type} />}
        </div>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
