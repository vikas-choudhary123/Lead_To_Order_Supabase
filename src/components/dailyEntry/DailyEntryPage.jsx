"use client"

import { useState } from "react"
import { CalendarIcon, Car, ChevronLeft, ChevronRight, Filter, MoreHorizontal, Plus, Search } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"
import { format } from "date-fns"

export default function DailyEntryPage() {
  const [date, setDate] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const entries = [
    {
      id: 5001,
      type: "Car",
      vehicle: "Toyota Camry",
      plate: "ABC-1234",
      owner: "John Smith",
      time: "08:15 AM",
      status: "Checked In",
      service: "Oil Change",
    },
    {
      id: 5002,
      type: "Bike",
      vehicle: "Honda CBR",
      plate: "XYZ-789",
      owner: "Sarah Johnson",
      time: "08:30 AM",
      status: "In Service",
      service: "Chain Replacement",
    },
    {
      id: 5003,
      type: "Car",
      vehicle: "Ford F-150",
      plate: "DEF-456",
      owner: "Michael Brown",
      time: "09:00 AM",
      status: "Completed",
      service: "Brake Service",
    },
    {
      id: 5004,
      type: "Bike",
      vehicle: "Yamaha R15",
      plate: "GHI-789",
      owner: "Emily Davis",
      time: "09:15 AM",
      status: "Waiting",
      service: "Full Service",
    },
    {
      id: 5005,
      type: "Car",
      vehicle: "Honda Civic",
      plate: "JKL-012",
      owner: "Robert Wilson",
      time: "10:00 AM",
      status: "Checked In",
      service: "Wheel Alignment",
    },
    {
      id: 5006,
      type: "Car",
      vehicle: "Nissan Altima",
      plate: "MNO-345",
      owner: "Jennifer Lee",
      time: "10:30 AM",
      status: "Waiting",
      service: "Engine Tune-up",
    },
    {
      id: 5007,
      type: "Bike",
      vehicle: "KTM Duke",
      plate: "PQR-678",
      owner: "David Martinez",
      time: "11:00 AM",
      status: "In Service",
      service: "Tire Replacement",
    },
    {
      id: 5008,
      type: "Car",
      vehicle: "Chevrolet Malibu",
      plate: "STU-901",
      owner: "Lisa Anderson",
      time: "11:30 AM",
      status: "Scheduled",
      service: "Full Service",
    },
  ]

  const filteredEntries =
    activeTab === "all"
      ? entries
      : entries.filter((entry) => entry.status.toLowerCase().replace(/\s+/g, "-") === activeTab)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Daily Entry</h1>
          <p className="text-gray-400">Track all vehicles entering your service center</p>
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
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Entries for {format(date, "MMMM d, yyyy")}</h2>
              <p className="text-sm text-gray-400">All vehicles checked in today</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search entries..."
                  className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[200px]"
                />
              </div>
              <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 p-2 text-gray-300 hover:bg-gray-700">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex border-b border-gray-800 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "all" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "checked-in" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("checked-in")}
            >
              Checked In
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "in-service" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("in-service")}
            >
              In Service
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "completed" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "waiting" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("waiting")}
            >
              Waiting
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Plate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">#{entry.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {entry.type === "Car" ? (
                        <Car className="h-4 w-4 inline mr-1 text-blue-400" />
                      ) : (
                        <Motorcycle className="h-4 w-4 inline mr-1 text-green-400" />
                      )}
                      {entry.type}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{entry.vehicle}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{entry.plate}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{entry.owner}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{entry.time}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{entry.service}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${entry.status === "Completed" ? "bg-green-900/50 text-green-400" : ""}
                          ${entry.status === "In Service" ? "bg-blue-900/50 text-blue-400" : ""}
                          ${entry.status === "Checked In" ? "bg-purple-900/50 text-purple-400" : ""}
                          ${entry.status === "Waiting" ? "bg-yellow-900/50 text-yellow-400" : ""}
                          ${entry.status === "Scheduled" ? "bg-gray-800 text-gray-300" : ""}
                        `}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button className="text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing <strong>1-{filteredEntries.length}</strong> of <strong>{filteredEntries.length}</strong> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                disabled
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </button>
              <button className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

