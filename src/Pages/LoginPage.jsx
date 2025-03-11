"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, User, Lock, AlertCircle, X } from "lucide-react"
import { useAuth } from '../Context/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  // State for password change alert
  const [showPasswordChangeAlert, setShowPasswordChangeAlert] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin-dashboard")
    }
  }, [isAuthenticated, navigate])

  // Google Sheet Details
  const sheetId = '1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc'
  const sheetName = 'Login'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      // Validate input
      if (!email || !password) {
        setError("Please enter both email and password")
        setIsLoading(false)
        return
      }

      // Fetch login data from Google Sheet
      console.log("Fetching login credentials from Google Sheet...")
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }
      
      // Extract the JSON part from the response
      const text = await response.text()
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}')
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)
      
      // Process the login data
      if (!data.table || !data.table.rows) {
        throw new Error("Invalid login data format")
      }
      
      // Extract credentials from the sheet
      // First column (A) is email/ID, second column (B) is password
      const credentials = data.table.rows
        .filter(row => row.c && row.c[0] && row.c[1])
        .map(row => ({
          id: row.c[0].v,
          password: row.c[1].v,
          // Check if there's a column C with password change flag (optional)
          passwordChangeRequired: row.c[2] ? row.c[2].v === true || row.c[2].v === "true" || row.c[2].v === 1 : false
        }))
      
      console.log(`Found ${credentials.length} user records`)
      
      // Check if credentials match
      const userMatch = credentials.find(cred => 
        cred.id === email && cred.password === password
      )
      
      if (userMatch) {
        console.log("Login successful")
        
        // Check if password change is required
        if (userMatch.passwordChangeRequired) {
          // Show password change alert
          setShowPasswordChangeAlert(true)
          setIsLoading(false)
          return
        }
        
        // Continue with normal login flow
        proceedWithLogin(userMatch)
      } else {
        console.log("Login failed: Invalid credentials")
        setError("Invalid email or password")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again later.")
      setIsLoading(false)
    }
  }

  // Function to handle proceeding with login after alert
  const proceedWithLogin = (userMatch) => {
    setShowPasswordChangeAlert(false)
    
    // Create user object with role
    const userData = { 
      email: userMatch?.id || email, 
      name: (userMatch?.id || email).split('@')[0], 
      role: "admin"
    }
    
    // Log the user in
    login(userData)
    console.log("User logged in, userData:", userData)
    
    // Navigate to the admin dashboard with a small delay
    setTimeout(() => {
      navigate("/admin-dashboard", { replace: true })
    }, 100)
    
    setIsLoading(false)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md w-full max-w-md overflow-hidden"
      >
        <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="p-6 border-b border-blue-100">
          <h2 className="text-2xl text-center font-bold text-blue-800">Salon Login</h2>
          <p className="text-center text-blue-500 mt-1">Access your professional dashboard</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-md flex items-start">
                <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-blue-700">Email or ID</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-blue-400" />
                </div>
                <input 
                  id="email" 
                  type="text" 
                  placeholder="Enter your ID or email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="pl-10 w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-blue-50 disabled:opacity-50" 
                  disabled={isLoading} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-blue-700">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Forgot password?</a>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-blue-400" />
                </div>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pl-10 w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-blue-50 disabled:opacity-50" 
                  disabled={isLoading} 
                />
                <button 
                  type="button" 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700" 
                  onClick={() => setShowPassword(!showPassword)} 
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-blue-700">
                Remember me
              </label>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Password Change Alert Modal */}
      {showPasswordChangeAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Password Change Required</h3>
              <button 
                onClick={() => setShowPasswordChangeAlert(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-5">
              <p className="text-gray-600">
                Your password needs to be changed for security purposes. You'll be redirected to the dashboard now, but please change your password soon.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => proceedWithLogin({ id: email })}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default LoginPage