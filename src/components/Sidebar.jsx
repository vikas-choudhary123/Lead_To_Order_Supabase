import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "../Context/AuthContext"
import { 
  Calendar, 
  ClipboardCheck, 
  UserCheck, 
  Package, 
  Scissors, 
  ChevronDown, 
  ChevronUp,
  Database,
  History
} from "lucide-react"  // Make sure to import the new icons

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  activeStaffTab,
  setActiveStaffTab,
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  allowedTabs = [] // Tabs that the user is allowed to access
}) => {
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false)
  const { user } = useAuth()
  
  // Toggle staff submenu
  const toggleStaffMenu = () => {
    // Only toggle if user has permission
    if (user?.role === "admin") {
      setIsStaffMenuOpen(!isStaffMenuOpen)
      if (!isStaffMenuOpen) {
        setActiveTab("staff")
      }
    }
  }
  
  // Handle clicking a staff submenu item
  const handleStaffItemClick = (tabName) => {
    // Only allow admin users to access staff features
    if (user?.role === "admin") {
      setActiveStaffTab(tabName)
      setActiveTab("staff")
      setIsMobileMenuOpen(false)
    }
  }

  // Handle clicking a main menu item
  const handleTabClick = (tabName) => {
    // Only change tab if it's allowed for this user
    if (allowedTabs.includes(tabName)) {
      setActiveTab(tabName)
      setIsMobileMenuOpen(false)
    }
  }
  
  // Define menu items
  const menuItems = [
    { id: "booking", label: "Booking", icon: <Calendar size={20} /> },
    { id: "dailyEntry", label: "Daily Entry", icon: <ClipboardCheck size={20} /> },
    // Staff section with submenu
    { 
      id: "staff", 
      label: "Staff", 
      icon: <UserCheck size={20} />,
      hasSubmenu: true,
      adminOnly: true, // Only admins can access staff features
      submenuItems: [
        { id: "staffAttendance", label: "Staff Attendance", icon: <UserCheck size={18} /> },
        { id: "staffDB", label: "Staff DB", icon: <Database size={18} /> },
        { id: "staffHistory", label: "Staff History", icon: <History size={18} /> }
      ]
    },
    { id: "inventory", label: "Inventory", icon: <Package size={20} /> },
    { id: "services", label: "Services", icon: <Scissors size={20} />, adminOnly: true },
  ]
  
  return (
    <motion.div
      className={`w-full md:w-64 bg-white shadow-lg z-20 md:relative fixed inset-0 transform ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } transition-transform duration-300 ease-in-out`}
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold text-indigo-700">Dashboard</h2>
        {user && (
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: <span className="font-medium">{user.name}</span> 
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-md">
              {user.role}
            </span>
          </p>
        )}
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Skip items that are admin-only if user is not admin
            if (item.adminOnly && user?.role !== "admin") {
              return null;
            }

            // Skip items that are not in allowed tabs
            if (!allowedTabs.includes(item.id)) {
              return null;
            }

            return (
              <li key={item.id}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={toggleStaffMenu}
                      className={`flex items-center justify-between w-full p-2 rounded-md hover:bg-indigo-50 ${
                        activeTab === item.id ? "bg-indigo-100 text-indigo-700" : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-500">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {isStaffMenuOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                    
                    {/* Staff submenu */}
                    {isStaffMenuOpen && (
                      <ul className="ml-8 mt-2 space-y-1">
                        {item.submenuItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleStaffItemClick(subItem.id)}
                              className={`flex items-center w-full p-2 rounded-md hover:bg-indigo-50 ${
                                activeTab === "staff" && activeStaffTab === subItem.id
                                  ? "bg-indigo-100 text-indigo-700"
                                  : ""
                              }`}
                            >
                              <span className="mr-3 text-gray-500">{subItem.icon}</span>
                              <span className="text-sm">{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center w-full p-2 rounded-md hover:bg-indigo-50 ${
                      activeTab === item.id ? "bg-indigo-100 text-indigo-700" : ""
                    }`}
                  >
                    <span className="mr-3 text-gray-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.div>
  )
}

export default Sidebar