"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { PlusIcon, SearchIcon, ArrowRightIcon, CalendarIcon, ClockIcon, FileTextIcon } from "../components/Icons"

// Mock data for demonstration
const pendingCallTrackers = [
  {
    id: "1",
    enquiryNo: "En-01",
    companyName: "ABC Corp",
    status: "Hot",
    stage: "Make Quotation",
    lastUpdated: "2023-05-15",
    dueDate: "2023-05-20",
  },
  {
    id: "2",
    enquiryNo: "En-02",
    companyName: "XYZ Ltd",
    status: "Warm",
    stage: "Quotation Validation",
    lastUpdated: "2023-05-14",
    dueDate: "2023-05-21",
  },
  {
    id: "3",
    enquiryNo: "En-05",
    companyName: "RST Solutions",
    status: "Hot",
    stage: "Order Expected",
    lastUpdated: "2023-05-16",
    dueDate: "2023-05-22",
  },
]

const historyCallTrackers = [
  {
    id: "4",
    enquiryNo: "En-03",
    companyName: "PQR Industries",
    status: "Cold",
    stage: "Order Status",
    lastUpdated: "2023-05-13",
    completedAt: "2023-05-15",
    outcome: "Order lost due to pricing issues",
  },
  {
    id: "5",
    enquiryNo: "En-04",
    companyName: "LMN Enterprises",
    status: "Hot",
    stage: "Order Status",
    lastUpdated: "2023-05-10",
    completedAt: "2023-05-12",
    outcome: "Order received, payment terms 30 days",
  },
  {
    id: "6",
    enquiryNo: "En-06",
    companyName: "UVW Corp",
    status: "Warm",
    stage: "Quotation Validation",
    lastUpdated: "2023-05-08",
    completedAt: "2023-05-11",
    outcome: "Quotation validated, waiting for customer response",
  },
]

function CallTracker() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  const filteredPendingCallTrackers = pendingCallTrackers.filter(
    (tracker) =>
      tracker.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredHistoryCallTrackers = historyCallTrackers.filter(
    (tracker) =>
      tracker.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Call Tracker
          </h1>
          <p className="text-slate-600 mt-1">Track the progress of enquiries through the sales pipeline</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search call trackers..."
              className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link to="/call-tracker/new">
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <PlusIcon className="inline-block mr-2 h-4 w-4" /> New Call Tracker
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">All Call Trackers</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  activeTab === "pending"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "history"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                History
              </button>
            </div>
          </div>

          {activeTab === "pending" && (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Enquiry No.
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Company
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
                      Current Stage
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Due Date
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
                  {filteredPendingCallTrackers.length > 0 ? (
                    filteredPendingCallTrackers.map((tracker) => (
                      <tr key={tracker.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tracker.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileTextIcon className="h-4 w-4 mr-2 text-slate-400" />
                            {tracker.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tracker.status === "Hot"
                                ? "bg-red-100 text-red-800"
                                : tracker.status === "Warm"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {tracker.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {tracker.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                            {tracker.dueDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link to={`/call-tracker/new?enquiryNo=${tracker.enquiryNo}`}>
                              <button className="px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md">
                                Update <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                              </button>
                            </Link>
                            <Link to={`/call-tracker/${tracker.id}`}>
                              <button className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
                                View
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                        No pending call trackers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "history" && (
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Enquiry No.
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Company
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
                      Stage
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Outcome
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Completed Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistoryCallTrackers.length > 0 ? (
                    filteredHistoryCallTrackers.map((tracker) => (
                      <tr key={tracker.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tracker.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileTextIcon className="h-4 w-4 mr-2 text-slate-400" />
                            {tracker.companyName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tracker.status === "Hot"
                                ? "bg-red-100 text-red-800"
                                : tracker.status === "Warm"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {tracker.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {tracker.stage}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate"
                          title={tracker.outcome}
                        >
                          {tracker.outcome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-slate-400" />
                            {tracker.completedAt}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                        No history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallTracker
