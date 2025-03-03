"use client"

import { useState } from "react"
import { Calendar, CheckCircle, XCircle, Users } from "lucide-react"

const StaffAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [staff, setStaff] = useState([
    {
      id: 1,
      name: "Sarah Miller",
      position: "Senior Stylist",
      status: "Present",
      checkIn: "08:45 AM",
      checkOut: "05:30 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "John Davis",
      position: "Barber",
      status: "Present",
      checkIn: "09:00 AM",
      checkOut: "06:00 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Lisa Thompson",
      position: "Nail Technician",
      status: "Absent",
      checkIn: "-",
      checkOut: "-",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Michael Rodriguez",
      position: "Junior Stylist",
      status: "Present",
      checkIn: "08:30 AM",
      checkOut: "05:00 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "Jennifer Wilson",
      position: "Receptionist",
      status: "Late",
      checkIn: "09:45 AM",
      checkOut: "06:30 PM",
      image: "/placeholder.svg?height=40&width=40",
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Staff Attendance</h2>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Users size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-800">5</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <CheckCircle size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-2xl font-bold text-gray-800">3</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <XCircle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Absent/Late</p>
            <p className="text-2xl font-bold text-gray-800">2</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Staff Attendance Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Staff Member
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Check In
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Check Out
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img
                          src={member.image || "/placeholder.svg"}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === "Present"
                          ? "bg-green-100 text-green-800"
                          : member.status === "Late"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.checkIn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.checkOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-pink-600 hover:text-pink-900 mr-3">Edit</button>
                    <button className="text-blue-600 hover:text-blue-900">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default StaffAttendance

