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
// import Quotation from "./pages/Quotation"
import Quotation from "./pages/Quotation/Quotation"
import MainNav from "./components/MainNav"
import Footer from "./components/Footer"
import Notification from "./components/Notification"
import supabase from "./utils/supabase" // Import supabase client

// Create auth context
export const AuthContext = createContext(null)
// Create data context to manage data access based on user type
export const DataContext = createContext(null)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notification, setNotification] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [userData, setUserData] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated")
    const storedUser = localStorage.getItem("currentUser")
    const storedUserType = localStorage.getItem("userType")
    
    if (auth === "true" && storedUser) {
      setIsAuthenticated(true)
      setCurrentUser(JSON.parse(storedUser))
      setUserType(storedUserType)
      // Fetch data based on user type
      fetchUserData(JSON.parse(storedUser).username, storedUserType)
    }
  }, [])

  // Function to fetch data based on user type
  const fetchUserData = async (username, userType) => {
    try {
      // Example: Fetch data from Google Sheet
      const dataUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Data"
      const response = await fetch(dataUrl)
      const text = await response.text()
      
      // Extract JSON from response
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      const data = JSON.parse(jsonData)
      
      if (!data || !data.table || !data.table.rows) {
        showNotification("Failed to fetch data", "error")
        return
      }
      
      // Filter data based on user type
      if (userType === "admin") {
        // Admin sees all data
        setUserData(data.table.rows)
      } else {
        // Regular user only sees their own data
        const filteredData = data.table.rows.filter(row => 
          row.c && row.c[0] && row.c[0].v === username
        )
        setUserData(filteredData)
      }
    } catch (error) {
      console.error("Data fetching error:", error)
      showNotification("An error occurred while fetching data", "error")
    }
  }

  const login = async (username, password) => {
    try {
      // Query Supabase login table
      const { data, error } = await supabase
        .from('login')
        .select('username, usertype')
        .eq('username', username)
        .eq('password', password)
        .single()
      
      if (error) {
        console.error("Login error:", error)
        showNotification("Invalid credentials", "error")
        return false
      }
      
      if (data) {
        // Store user info
        const userInfo = {
          username: data.username,
          loginTime: new Date().toISOString()
        }
        
        setIsAuthenticated(true)
        setCurrentUser(userInfo)
        setUserType(data.usertype)
        
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("currentUser", JSON.stringify(userInfo))
        localStorage.setItem("userType", data.usertype)
        
        // Fetch data based on user type
        await fetchUserData(data.username, data.usertype)
        
        showNotification(`Welcome, ${username}! (${data.usertype})`, "success")
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
    setUserData(null)
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
      <DataContext.Provider value={{ userData, fetchUserData }}>
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
      </DataContext.Provider>
    </AuthContext.Provider>
  )
}

export default App