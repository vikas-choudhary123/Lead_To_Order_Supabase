"use client"

import { useState } from "react"
import { CalendarIcon, Car, ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { BikeIcon as Motorcycle } from "lucide-react"
import { format } from "date-fns"

export default function ServiceHistoryPage() {
  const [date, setDate] = useState(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const serviceHistory = [
    {
      id: 3001,
      type: "Car",
      service: "Oil Change",
      vehicle: "Toyota Camry",
      customer: "John Smith",
      date: "2023-03-01",
      status: "Completed",
      amount: 49.99,
    },
    {
      id: 3002,
      type: "Bike",
      service: "Chain Replacement",
      vehicle: "Honda CBR",
      customer: "Sarah Johnson",
      date: "2023-03-01",
      status: "Completed",
      amount: 79.99,
    },
    {
      id: 3003,
      type: "Car",
      service: "Brake Service",
      vehicle: "Ford F-150",
      customer: "Michael Brown",
      date: "2023-03-02",
      status: "Completed",
      amount: 149.99,
    },
    {
      id: 3004,
      type: "Bike",
      service: "Full Service",
      vehicle: "Yamaha R15",
      customer: "Emily Davis",
      date: "2023-03-02",
      status: "Completed",
      amount: 129.99,
    },
    {
      id: 3005,
      type: "Car",
      service: "Wheel Alignment",
      vehicle: "Honda Civic",
      customer: "Robert Wilson",
      date: "2023-03-03",
      status: "Completed",
      amount: 89.99,
    },
    {
      id: 3006,
      type: "Car",
      service: "Engine Tune-up",
      vehicle: "Nissan Altima",
      customer: "Jennifer Lee",
      date: "2023-03-03",
      status: "Completed",
      amount: 179.99,
    },
    {
      id: 3007,
      type: "Bike",
      service: "Tire Replacement",
      vehicle: "KTM Duke",
      customer: "David Martinez",
      date: "2023-03-04",
      status: "Completed",
      amount: 69.99,
    },
    {
      id: 3008,
      type: "Car",
      service: "Full Service",
      vehicle: "Chevrolet Malibu",
      customer: "Lisa Anderson",
      date: "2023-03-04",
      status: "Completed",
      amount: 199.99,
    },
  ]

  const filteredServices = serviceHistory.filter((service) => {
    if (activeTab !== "all" && service.type.toLowerCase() !== activeTab) {
      return false
    }
    if (filterType !== "all" && service.type.toLowerCase() !== filterType) {
      return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Service History</h1>
          <p className="text-gray-400">View historical service records</p>
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
              <h2 className="text-xl font-semibold text-white">Service Records</h2>
              <p className="text-sm text-gray-400">Historical service records for all vehicles</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search records..."
                  className="rounded-md border border-gray-700 bg-gray-800 pl-8 pr-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[200px]"
                />
              </div>
              <select
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none w-full sm:w-[150px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
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
              All Services
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "car" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("car")}
            >
              Car Services
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "bike" ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("bike")}
            >
              Bike Services
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
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((record) => (
                  <tr key={record.id} className="border-b border-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">#{record.id}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {record.type === "Car" ? (
                        <Car className="h-4 w-4 inline mr-1 text-blue-400" />
                      ) : (
                        <Motorcycle className="h-4 w-4 inline mr-1 text-green-400" />
                      )}
                      {record.type}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.service}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.vehicle}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.customer}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{record.date}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-900/50 text-green-400">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-400">${record.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing <strong>1-{filteredServices.length}</strong> of <strong>{filteredServices.length}</strong> records
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

