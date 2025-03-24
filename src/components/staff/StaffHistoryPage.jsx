"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { format } from "date-fns"

export default function StaffHistoryPage() {
  const [date, setDate] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const staffHistory = [
    {
      id: 1,
      name: "John Smith",
      position: "Senior Mechanic",
      date: "2023-03-01",
      status: "Present",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      hours: 9,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Mechanic",
      date: "2023-03-01",
      status: "Present",
      checkIn: "08:15 AM",
      checkOut: "05:15 PM",
      hours: 9,
    },
    {
      id: 3,
      name: "Mike Williams",
      position: "Mechanic",
      date: "2023-03-01",
      status: "Present",
      checkIn: "08:30 AM",
      checkOut: "05:30 PM",
      hours: 9,
    },
    {
      id: 4,
      name: "Emily Davis",
      position: "Service Advisor",
      date: "2023-03-01",
      status: "Present",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      hours: 9,
    },
    {
      id: 5,
      name: "Robert Brown",
      position: "Apprentice",
      date: "2023-03-01",
      status: "Absent",
      checkIn: null,
      checkOut: null,
      hours: 0,
    },
    {
      id: 6,
      name: "John Smith",
      position: "Senior Mechanic",
      date: "2023-03-02",
      status: "Present",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      hours: 9,
    },
    {
      id: 7,
      name: "Sarah Johnson",
      position: "Mechanic",
      date: "2023-03-02",
      status: "Late",
      checkIn: "09:30 AM",
      checkOut: "05:30 PM",
      hours: 8,
    },
    {
      id: 8,
      name: "Mike Williams",
      position: "Mechanic",
      date: "2023-03-02",
      status: "Present",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      hours: 9,
    },
  ]

  const filteredHistory = staffHistory.filter((record) => {
    if (statusFilter !== "all" && record.status.toLowerCase() !== statusFilter) {
      return false
    }

    if (activeTab !== "all") {
      const position = record.position.toLowerCase()
      if (activeTab === "mechanics" && !position.includes("mechanic")) {
        return false
      }
      if (activeTab === "service" && !position.includes("service")) {
        return false
      }
      if (activeTab === "management" && !position.includes("manager")) {
        return false
      }
    }

    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Staff History</h1>
          <p className="text-gray-400">View historical attendance records for all staff</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <button
              className="inline-flex w-full justify-between items-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "MMMM yyyy")}
              </div>
            </button>
            {calendarOpen && (
              <div className="absolute z-10 mt-1 w-auto rounded-md border border-gray-700 bg-gray-900 p-4 shadow-lg">
                {/* Simple calendar UI */}
                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-400">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      className={`rounded-md p-1 text-center text-sm ${
                        day === date.getDate() ? "bg-blue-600 text-white" : "hover:bg-gray-800 text-gray-300"
                      }`}
                      onClick={() => {
                        const newDate = new Date(date)
                        newDate.setDate(day)
                        setDate(newDate)
                        setCalendarOpen(false)
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Attendance History</h2>
              <p className="text-sm text-gray-400">Historical attendance records for all staff</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search staff..."
                  className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[200px]"
                />
              </div>
              <select
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[150px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex border-b border-gray-800 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "all" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("all")}
            >
              All Staff
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "mechanics" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("mechanics")}
            >
              Mechanics
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "service" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("service")}
            >
              Service Advisors
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "management" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("management")}
            >
              Management
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">#{record.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.position}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.checkIn || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.checkOut || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${record.status === "Present" ? "bg-green-900/50 text-green-400" : ""}
                        ${record.status === "Absent" ? "bg-red-900/50 text-red-400" : ""}
                        ${record.status === "Late" ? "bg-yellow-900/50 text-yellow-400" : ""}
                      `}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing <strong>1-{filteredHistory.length}</strong> of <strong>{filteredHistory.length}</strong> records
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                disabled
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                disabled
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

