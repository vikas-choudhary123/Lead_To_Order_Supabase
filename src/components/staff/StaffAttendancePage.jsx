"use client"

import { useState } from "react"
import { CalendarIcon, Check, ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react"
import { format } from "date-fns"

export default function StaffAttendancePage() {
  const [date, setDate] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const staffAttendance = [
    {
      id: 1,
      name: "John Smith",
      position: "Senior Mechanic",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      status: "Present",
      hours: 9,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Mechanic",
      checkIn: "08:15 AM",
      checkOut: "05:15 PM",
      status: "Present",
      hours: 9,
    },
    {
      id: 3,
      name: "Mike Williams",
      position: "Mechanic",
      checkIn: "08:30 AM",
      checkOut: "05:30 PM",
      status: "Present",
      hours: 9,
    },
    {
      id: 4,
      name: "Emily Davis",
      position: "Service Advisor",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      status: "Present",
      hours: 9,
    },
    { id: 5, name: "Robert Brown", position: "Apprentice", checkIn: null, checkOut: null, status: "Absent", hours: 0 },
    {
      id: 6,
      name: "Jennifer Lee",
      position: "Receptionist",
      checkIn: "08:00 AM",
      checkOut: "05:00 PM",
      status: "Present",
      hours: 9,
    },
    {
      id: 7,
      name: "David Martinez",
      position: "Mechanic",
      checkIn: "09:30 AM",
      checkOut: "05:30 PM",
      status: "Late",
      hours: 8,
    },
    {
      id: 8,
      name: "Lisa Anderson",
      position: "Service Manager",
      checkIn: "07:45 AM",
      checkOut: "06:00 PM",
      status: "Present",
      hours: 10.25,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Staff Attendance</h1>
          <p className="text-gray-400">Track and manage staff attendance records</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <button
              className="inline-flex w-full justify-between items-center rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
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
          <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Mark Attendance
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Attendance for {format(date, "MMMM d, yyyy")}</h2>
              <p className="text-sm text-gray-400">Staff check-in and check-out records</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search staff..."
                className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[250px]"
              />
            </div>
          </div>
        </div>
        <div className="p-6">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffAttendance.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">#{staff.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{staff.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{staff.position}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{staff.checkIn || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{staff.checkOut || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${staff.status === "Present" ? "bg-green-900/50 text-green-400" : ""}
                        ${staff.status === "Absent" ? "bg-red-900/50 text-red-400" : ""}
                        ${staff.status === "Late" ? "bg-yellow-900/50 text-yellow-400" : ""}
                      `}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{staff.hours}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-green-400 hover:text-green-300">
                          <Check className="h-4 w-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing <strong>1-8</strong> of <strong>8</strong> staff members
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

