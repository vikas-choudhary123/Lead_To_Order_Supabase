"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, User, Lock, AlertCircle, X, Scissors, Calendar, ChevronRight } from "lucide-react"
import { useAuth } from "../Context/AuthContext.jsx"

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

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
      // Always navigate to admin-dashboard
      // The Dashboard component will handle showing the appropriate content based on role
      navigate("/admin-dashboard")
    }
  }, [isAuthenticated, navigate])

  // Google Sheet Details
  const sheetId = "1Kb-fhC1yiFJCyPO7TJDqnu-lQ1n1H6mLErlkSPc6yHc"
  const sheetName = "Login"

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
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}")
      const jsonString = text.substring(jsonStart, jsonEnd + 1)
      const data = JSON.parse(jsonString)

      // Process the login data
      if (!data.table || !data.table.rows) {
        throw new Error("Invalid login data format")
      }

      // Extract credentials from the sheet
      // First column (A) is email/ID, second column (B) is password, and we'll check for a role column (C)
      const credentials = data.table.rows
        .filter((row) => row.c && row.c[0] && row.c[1])
        .map((row) => ({
          id: row.c[0].v,
          password: row.c[1].v,
          // Check if there's a column C with password change flag (optional)
          passwordChangeRequired: row.c[2] ? row.c[2].v === true || row.c[2].v === "true" || row.c[2].v === 1 : false,
          // Check for role in column D (index 3) if it exists
          role: row.c[3] && row.c[3].v ? row.c[3].v : null
        }))

      console.log(`Found ${credentials.length} user records`)

      // Check if credentials match
      const userMatch = credentials.find((cred) => cred.id === email && cred.password === password)

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

    // Determine the role - If username is "admin" or has explicit role in spreadsheet
    let userRole = "staff"; // Default role
    
    // Check if user is admin by username
    if (userMatch?.id.toLowerCase() === "admin") {
      userRole = "admin";
    } 
    // Or check if role is specified in the spreadsheet
    else if (userMatch?.role) {
      userRole = userMatch.role.toLowerCase();
    }

    // Create user object with determined role
    const userData = {
      email: userMatch?.id || email,
      name: (userMatch?.id || email).split("@")[0],
      role: userRole
    }

    // Log the user in
    login(userData)
    console.log("User logged in, userData:", userData)

    // Navigate to the appropriate dashboard with a small delay
    setTimeout(() => {
      navigate("/admin-dashboard", { replace: true })
    }, 100)

    setIsLoading(false)
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const floatingAnimation = {
    initial: { y: 0 },
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      },
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-gradient-to-r from-blue-200 to-cyan-200 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-gradient-to-r from-indigo-200 to-purple-200 opacity-20 blur-3xl"></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="flex w-full max-w-5xl bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Left side - Image and branding */}
        <motion.div
          variants={fadeIn}
          className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border-4 border-white/30"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full border-4 border-white/20"></div>
            <div className="absolute top-3/4 left-1/3 w-24 h-24 rounded-full border-4 border-white/10"></div>
          </div>

          <div className="p-8 z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Scissors className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Salon Pro</h1>
            </motion.div>
          </div>

          <motion.div variants={floatingAnimation} initial="initial" animate="animate" className="relative z-10 p-8">
                {/* <img
                src="https://unsplash.com/s/photos/hair-salon?height=500&width=500"
                alt="Salon Management"
                className="mx-auto mb-6 rounded-lg shadow-lg"
                /> */}
            <h2 className="text-2xl font-bold mb-5">Professional Salon Management</h2>
            <p className="text-white/80 mb-6">
              Streamline your salon operations with our comprehensive management solution.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Calendar className="h-5 w-5" />
                </div>
                <p>Appointment scheduling</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-5 w-5" />
                </div>
                <p>Client management</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Scissors className="h-5 w-5" />
                </div>
                <p>Service tracking</p>
              </div>
            </div>
          </motion.div>

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900/50 to-transparent"></div>
        </motion.div>

        {/* Right side - Login form */}
        <motion.div variants={fadeIn} className="w-full md:w-1/2 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your salon dashboard</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-start"
                >
                  <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={fadeIn} className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email or ID
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-indigo-500" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    placeholder="Enter your ID or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white/80 disabled:opacity-50 transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-indigo-500" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 bg-white/80 disabled:opacity-50 transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                variants={fadeIn}
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* Password Change Alert Modal */}
      <AnimatePresence>
        {showPasswordChangeAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 m-4"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <AlertCircle size={20} className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Password Change Required</h3>
                </div>
                <button
                  onClick={() => setShowPasswordChangeAlert(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-gray-600">
                  Your password needs to be changed for security purposes. You'll be redirected to the dashboard now,
                  but please change your password soon.
                </p>
              </div>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => proceedWithLogin({ id: email })}
                  className="inline-flex justify-center px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 border border-transparent rounded-lg shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Continue to Dashboard
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LoginPage