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
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated")
    const storedUser = localStorage.getItem("currentUser")
    const storedUserType = localStorage.getItem("userType")
    
    if (auth === "true" && storedUser) {
      setIsAuthenticated(true)
      setCurrentUser(JSON.parse(storedUser))
      setUserType(storedUserType)
    }
  }, [])

  const login = async (username, password) => {
    try {
      // Fetch user credentials from Google Sheet
      const loginUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Login"
      const response = await fetch(loginUrl)
      const text = await response.text()
      
      // Extract JSON from response
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      const data = JSON.parse(jsonData)
      
      if (!data || !data.table || !data.table.rows) {
        showNotification("Failed to fetch user data", "error")
        return false
      }
      
      // Find matching user
      let foundUser = null
      data.table.rows.forEach(row => {
        if (row.c && 
            row.c[0] && row.c[0].v === username && 
            row.c[1] && row.c[1].v === password) {
          foundUser = {
            username: row.c[0].v,
            userType: row.c[2] ? row.c[2].v : "user" // Default to "user" if type is not specified
          }
        }
      })
      
      if (foundUser) {
        // Store user info
        const userInfo = {
          username: foundUser.username,
          loginTime: new Date().toISOString()
        }
        
        setIsAuthenticated(true)
        setCurrentUser(userInfo)
        setUserType(foundUser.userType)
        
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("currentUser", JSON.stringify(userInfo))
        localStorage.setItem("userType", foundUser.userType)
        
        showNotification(`Welcome, ${username}! (${foundUser.userType})`, "success")
        return true
      } else {
        showNotification("Invalid credentials", "error")
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      showNotification("An error occurred during login", "error")
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setUserType(null)
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userType")
    showNotification("Logged out successfully", "success")
  }

  const showNotification = (message, type = "info") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }
  
  // Check if user has admin privileges
  const isAdmin = () => {
    return userType === "admin"
  }

  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />
    }
    
    // If admin-only route and user is not admin, redirect to dashboard
    if (adminOnly && !isAdmin()) {
      showNotification("You don't have permission to access this page", "error")
      return <Navigate to="/" />
    }
    
    return children
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      showNotification, 
      currentUser, 
      userType, 
      isAdmin: isAdmin 
    }}>
      <Router>
        <div className="min-h-screen flex flex-col bg-white text-gray-900">
          {isAuthenticated && <MainNav logout={logout} userType={userType} username={currentUser?.username} />}
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