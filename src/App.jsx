import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./Context/AuthContext";
import Dashboard from "./Components/Dashboard";
import ProtectedRoute from "./Routes/ProtectedRoute";
import "./index.css";
import LoginPage from "./Pages/LoginPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatePresence>
          <Routes>
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute role="admin">
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* Add a regular dashboard route without role restriction for testing */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
}

export default App;