import { Calendar, ClipboardList, Users, Package, Scissors, ChevronDown, ChevronRight, User, X } from "lucide-react"

const Sidebar = ({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const menuItems = [
    {
      id: "booking",
      name: "Booking",
      icon: <Calendar size={20} />,
    },
    {
      id: "dailyEntry",
      name: "Daily Entry",
      icon: <ClipboardList size={20} />,
    },
    {
      id: "staffAttendance",
      name: "Staff Attendance",
      icon: <Users size={20} />,
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: <Package size={20} />,
    },
    {
      id: "services",
      name: "Services",
      icon: <Scissors size={20} />,
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r md:border-blue-200">
        <div className="flex items-center justify-center h-16 border-b border-blue-200 bg-blue-50">
          <h1 className="text-xl font-bold text-blue-800">Salon Dashboard</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`cursor-pointer flex items-center w-full px-4 py-3 text-left rounded-md sidebar-link ${
                    activeTab === item.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="mr-3 text-blue-600">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                  {activeTab === item.id ? (
                    <ChevronDown className="ml-auto" size={16} />
                  ) : (
                    <ChevronRight className="ml-auto" size={16} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* <div className="p-4 border-t border-blue-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-700">Admin User</p>
              <p className="text-xs text-blue-500">admin@salonapp.com</p>
            </div>
          </div>
        </div> */}
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-blue-600 bg-opacity-75 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
        <div className="fixed inset-y-0 left-0 flex flex-col w-full max-w-xs bg-white shadow-xl transition-transform duration-300 ease-in-out">
          <div className="flex items-center justify-between h-16 px-6 border-b border-blue-200 bg-blue-50">
            <h1 className="text-xl font-bold text-blue-800">Salon Dashboard</h1>
            <button
              className="p-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`flex items-center w-full px-4 py-3 text-left rounded-md sidebar-link ${
                      activeTab === item.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <span className="mr-3 text-blue-600">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}

export default Sidebar

