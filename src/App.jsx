"use client"

import { useState } from "react"
import LoginForm from "./components/login-form"
import UserForm from "./components/user-form"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = (username, password) => {
    if (username === "vikas" && password === "vikas@123") {
      setIsLoggedIn(true)
    } else {
      alert("Invalid credentials. Please try again.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">{!isLoggedIn ? <LoginForm onLogin={handleLogin} /> : <UserForm />}</div>
    </main>
  )
}

export default App

