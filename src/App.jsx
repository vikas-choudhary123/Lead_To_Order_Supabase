import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./Context/AuthContext.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import ProtectedRoute from "./Routes/ProtectedRoute.jsx";
import LoginPage from "./Pages/LoginPage.jsx";
import "./index.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AnimatePresence>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Single dashboard route that handles all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin-dashboard" element={<Dashboard />} />
            </Route>
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
}

export default App;