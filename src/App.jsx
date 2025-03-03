import { BrowserRouter as Router } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import "./index.css"
import Dashboard from "./Components/Dashboard"

function App() {
  return (
    <Router>
      <AnimatePresence>
        <div className="App">
          <Dashboard/>
        </div>
      </AnimatePresence>
    </Router>
  )
}

export default App

