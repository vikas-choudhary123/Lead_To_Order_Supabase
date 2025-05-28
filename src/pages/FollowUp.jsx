"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { SearchIcon, ArrowRightIcon } from "../components/Icons"
import { AuthContext } from "../App" // Import AuthContext

const slideIn = "animate-in slide-in-from-right duration-300"
const slideOut = "animate-out slide-out-to-right duration-300"
const fadeIn = "animate-in fade-in duration-300"
const fadeOut = "animate-out fade-out duration-300"

function FollowUp() {
  const { currentUser, userType, isAdmin } = useContext(AuthContext) // Get user info and admin function
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingFollowUps, setPendingFollowUps] = useState([])
  const [historyFollowUps, setHistoryFollowUps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // New state for date filter
  const [showPopup, setShowPopup] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState(null)

  // Helper function to determine priority based on lead source
  const determinePriority = (source) => {
    if (!source) return "Low"

    const sourceLower = source.toLowerCase()
    if (sourceLower.includes("indiamart")) return "High"
    if (sourceLower.includes("website")) return "Medium"
    return "Low"
  }

  // Helper function to format next call time
  const formatNextCallTime = (timeValue) => {
    if (!timeValue) return ""

    try {
      // Check if it's a Date(YYYY,MM,DD,HH,MM,SS) format
      if (typeof timeValue === "string" && timeValue.startsWith("Date(")) {
        // Extract hours and minutes from the Date string
        const timeString = timeValue.substring(5, timeValue.length - 1)
        const [year, month, day, hours, minutes, seconds] = timeString
          .split(",")
          .map((part) => Number.parseInt(part.trim()))

        // Convert to 12-hour format
        const formattedHours = hours % 12 || 12 // Convert to 12-hour format
        const period = hours >= 12 ? "PM" : "AM"

        // Pad minutes with leading zero if needed
        const formattedMinutes = minutes.toString().padStart(2, "0")

        return `${formattedHours}:${formattedMinutes} ${period}`
      }

      // If it's already in HH:MM:SS format
      if (typeof timeValue === "string" && /^\d{2}:\d{2}:\d{2}$/.test(timeValue)) {
        const [hours, minutes] = timeValue.split(":").map(Number)

        // Convert to 12-hour format
        const formattedHours = hours % 12 || 12
        const period = hours >= 12 ? "PM" : "AM"

        // Pad minutes with leading zero if needed
        const formattedMinutes = minutes.toString().padStart(2, "0")

        return `${formattedHours}:${formattedMinutes} ${period}`
      }

      // Fallback to original value if parsing fails
      return timeValue
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeValue
    }
  }

  // Helper function to calculate next call date (3 days after created date)
  const calculateNextCallDate = (createdDate) => {
    if (!createdDate) return ""

    try {
      // Parse the date - assuming format is DD/MM/YYYY
      const parts = createdDate.split("/")
      if (parts.length !== 3) return ""

      const date = new Date(parts[2], parts[1] - 1, parts[0])
      date.setDate(date.getDate() + 3) // Add 3 days for next call

      // Format as YYYY-MM-DD for display
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } catch (error) {
      console.error("Error calculating next call date:", error)
      return ""
    }
  }

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,3,22)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))

        // JavaScript months are 0-indexed, but we need to display them as 1-indexed
        // Also ensure day and month are padded with leading zeros if needed
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }

      // Handle other date formats if needed
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      }

      // If it's already in the correct format, return as is
      return dateValue
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Helper function to parse date from column CL and compare with today
  const getDateFromColumnCL = (dateValue) => {
    if (!dateValue) return null

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,4,27)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))
        // JavaScript months are 0-indexed
        return new Date(year, month, day)
      }

      // Try to parse as regular date
      const parsedDate = new Date(dateValue)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }

      return null
    } catch (error) {
      console.error("Error parsing date from column CL:", error)
      return null
    }
  }

  // Helper function to check date filter condition
  // Helper function to check date filter condition
  const checkDateFilter = (followUp, filterType) => {
    if (filterType === "all") return true

    // Get the text value from column CL (nextCallDate field)
    const columnCLValue = followUp.nextCallDate
    if (!columnCLValue) return false

    // Convert the column CL value to lowercase for comparison
    const columnCLText = String(columnCLValue).toLowerCase()

    // Match the filter type with the text in column CL
    switch (filterType) {
      case "today":
        return columnCLText.includes("today")
      case "overdue":
        return columnCLText.includes("overdue")
      case "upcoming":
        return columnCLText.includes("upcoming")
      default:
        return true
    }
  }

  // Function to fetch data from FMS and Leads Tracker sheets
  useEffect(() => {
    const fetchFollowUpData = async () => {
      try {
        setIsLoading(true)

        // Fetch data from FMS sheet for Pending Follow-ups
        const pendingUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=FMS"
        const pendingResponse = await fetch(pendingUrl)
        const pendingText = await pendingResponse.text()

        // Extract the JSON part from the FMS sheet response
        const pendingJsonStart = pendingText.indexOf("{")
        const pendingJsonEnd = pendingText.lastIndexOf("}") + 1
        const pendingJsonData = pendingText.substring(pendingJsonStart, pendingJsonEnd)

        const pendingData = JSON.parse(pendingJsonData)

        // Fetch data from Leads Tracker sheet for History
        const historyUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Leads Tracker"
        const historyResponse = await fetch(historyUrl)
        const historyText = await historyResponse.text()

        // Extract the JSON part from the Leads Tracker sheet response
        const historyJsonStart = historyText.indexOf("{")
        const historyJsonEnd = historyText.lastIndexOf("}") + 1
        const historyJsonData = historyText.substring(historyJsonStart, historyJsonEnd)

        const historyData = JSON.parse(historyJsonData)

        // Process Pending Follow-ups from FMS sheet
        if (pendingData && pendingData.table && pendingData.table.rows) {
          const pendingFollowUpData = []

          // Skip the header row (index 0)
          pendingData.table.rows.slice(0).forEach((row) => {
            if (row.c) {
              // Check if column K (index 10) has data and column L (index 11) is null
              const hasColumnK = row.c[27] && row.c[27].v
              const isColumnLEmpty = !row.c[28] || row.c[28].v === null || row.c[28].v === ""
              
              // Get the assigned user 
              const assignedUser = row.c[88] ? row.c[88].v : ""
              
              // For admin users, include all rows; for regular users, filter by their username
              const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)

              // Only include rows where column K has data, column L is null/empty, and user has access
              if (hasColumnK && isColumnLEmpty && shouldInclude) {
                const followUpItem = {
                  id: row.c[0] ? row.c[0].v : "",
                  leadId: row.c[1] ? row.c[1].v : "",
                  companyName: row.c[4] ? row.c[4].v : "",
                  personName: row.c[6] ? row.c[6].v : "",
                  phoneNumber: row.c[5] ? row.c[5].v : "", // Added phone number from column F (index 5)
                  leadSource: row.c[3] ? row.c[3].v : "",
                  location: row.c[7] ? row.c[7].v : "",
                  customerSay: row.c[31] ? row.c[31].v : "",
                  enquiryStatus: row.c[32] ? row.c[32].v : "",
                  createdAt: row.c[0] ? row.c[0].v : "",
                  nextCallDate: row.c[89] ? row.c[89].v : "", // Column CL (index 89) for date filtering
                  priority: determinePriority(row.c[3] ? row.c[3].v : ""),
                  assignedTo: assignedUser // Add assigned user to the follow-up item
                }

                pendingFollowUpData.push(followUpItem)
              }
            }
          })

          setPendingFollowUps(pendingFollowUpData)
        }

        // Process History Follow-ups from Leads Tracker sheet
        if (historyData && historyData.table && historyData.table.rows) {
          const historyFollowUpData = []

          // Start from index 1 to skip header row, process rows starting from index 2 in the sheet
          historyData.table.rows.slice(0).forEach((row) => {
            if (row.c) {
              // NEW: Check if the username matches column (you'll need to determine which column stores the assigned user in Leads Tracker)
              const followUpItem = {
                leadNo: row.c[1] ? row.c[1].v : "",
                customerSay: row.c[2] ? row.c[2].v : "",
                status: row.c[3] ? row.c[3].v : "",
                enquiryReceivedStatus: row.c[4] ? row.c[4].v : "",
                enquiryReceivedDate: row.c[5] ? formatDateToDDMMYYYY(row.c[5] ? row.c[5].v : "") : "",
                enquiryState: row.c[6] ? row.c[6].v : "",
                projectName: row.c[7] ? row.c[7].v : "",
                salesType: row.c[8] ? row.c[8].v : "",
                requiredProductDate: row.c[9] ? formatDateToDDMMYYYY(row.c[9] ? row.c[9].v : "") : "",
                projectApproxValue: row.c[10] ? row.c[10].v : "",
              
                // Item details
                itemName1: row.c[11] ? row.c[11].v : "", // Column L - Item Name1
                quantity1: row.c[12] ? row.c[12].v : "", // Column M - Quantity1
                itemName2: row.c[13] ? row.c[13].v : "", // Column N - Item Name2
                quantity2: row.c[14] ? row.c[14].v : "", // Column O - Quantity2
                itemName3: row.c[15] ? row.c[15].v : "", // Column P - Item Name3
                quantity3: row.c[16] ? row.c[16].v : "", // Column Q - Quantity3
                itemName4: row.c[17] ? row.c[17].v : "", // Column R - Item Name4
                quantity4: row.c[18] ? row.c[18].v : "", // Column S - Quantity4
                itemName5: row.c[19] ? row.c[19].v : "", // Column T - Item Name5
                quantity5: row.c[20] ? row.c[20].v : "", // Column U - Quantity5
              
                nextAction: row.c[21] ? row.c[21].v : "", // Column V - Next Action
                nextCallDate: row.c[22] ? formatDateToDDMMYYYY(row.c[22] ? row.c[22].v : "") : "", // Column W - Next Call Date
                nextCallTime: row.c[23] ? formatNextCallTime(row.c[23].v) : "", // Column X - Next Call Time
                
                // ADD THIS NEW LINE for column Z (index 25):
                historyDateFilter: row.c[25] ? row.c[25].v : "", // Column Z - Date filter for history
              }

              historyFollowUpData.push(followUpItem)
            }
          })

          setHistoryFollowUps(historyFollowUpData)
        }
      } catch (error) {
        console.error("Error fetching follow-up data:", error)
        // Fallback to mock data if fetch fails
        setPendingFollowUps([
          {
            id: "1",
            leadId: "LD-001",
            companyName: "ABC Corp",
            personName: "John Smith",
            phoneNumber: "9876543210", // Added sample phone number
            leadSource: "Indiamart",
            location: "Mumbai",
            customerSay: "Interested in product details",
            enquiryStatus: "New",
            createdAt: "2023-05-15",
            nextCallDate: "Date(2025,4,27)", // Sample date for testing
            priority: "High",
          },
        ])

        setHistoryFollowUps([
          {
            leadNo: "LD-001",
            customerSay: "Interested in product details",
            status: "Pending",
            enquiryReceivedStatus: "New",
            enquiryReceivedDate: "15/05/2023",
            enquiryState: "Maharashtra",
            projectName: "Sample Project",
            salesType: "Direct",
            requiredProductDate: "15/06/2023",
            projectApproxValue: "₹500,000",
            itemName1: "Product A",
            quantity1: "10",
            nextAction: "Follow-up call",
            nextCallDate: "20/05/2023",
            nextCallTime: "10:00 AM",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }


    fetchFollowUpData()
  }, [currentUser, isAdmin])  // Add isAdmin to dependencies

// Add this function or modify the existing formatDateToDDMMYYYY function
const formatPopupDate = (dateValue) => {
  if (!dateValue) return "";

  try {
    // Check if it's a Date object-like string (e.g. "Date(2025,4,3)")
    if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
      // Extract the parts from Date(YYYY,MM,DD) format
      const dateString = dateValue.substring(5, dateValue.length - 1);
      const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()));
      
      // JavaScript months are 0-indexed, but we need to display them as 1-indexed
      // Also ensure day and month are padded with leading zeros if needed
      return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`;
    }
    
    // If it's already in the correct format, return as is
    return dateValue;
  } catch (error) {
    console.error("Error formatting popup date:", error);
    return dateValue; // Return the original value if formatting fails
  }
};

  // Filter function for search in both sections
  const filteredPendingFollowUps = pendingFollowUps.filter((followUp) => {
    const matchesSearch =
      followUp.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.leadId.toLowerCase().includes(searchTerm.toLowerCase())

    // Apply filter type for Column R
    const matchesFilterType = (() => {
      if (filterType === "first") {
        return followUp.enquiryStatus === "" || followUp.enquiryStatus === null
      } else if (filterType === "multi") {
        return followUp.enquiryStatus === "expected"
      } else {
        return true
      }
    })()

    // Apply date filter based on column CL
    const matchesDateFilter = checkDateFilter(followUp, dateFilter)

    return matchesSearch && matchesFilterType && matchesDateFilter
  })

  const filteredHistoryFollowUps = historyFollowUps.filter((followUp) => {
    const matchesSearch =
      followUp.leadNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  
    // Apply filter type for history - check column E (enquiryReceivedStatus)
    const matchesFilterType = (() => {
      if (filterType === "first") {
        return followUp.enquiryReceivedStatus === "" || followUp.enquiryReceivedStatus === null || followUp.enquiryReceivedStatus === "New"
      } else if (filterType === "multi") {
        return followUp.enquiryReceivedStatus === "Expected" || followUp.enquiryReceivedStatus === "expected"
      } else {
        return true
      }
    })()
  
    // ADD THIS NEW SECTION: Apply date filter based on column Z
    const matchesDateFilter = (() => {
      if (dateFilter === "all") return true
  
      // Get the text value from column Z (historyDateFilter field)
      const columnZValue = followUp.historyDateFilter
      if (!columnZValue) return false
  
      // Convert the column Z value to lowercase for comparison
      const columnZText = String(columnZValue).toLowerCase()
  
      // Match the filter type with the text in column Z
      switch (dateFilter) {
        case "today":
          return columnZText.includes("today")
        case "overdue":
          return columnZText.includes("overdue")
        case "upcoming":
          return columnZText.includes("upcoming")
        default:
          return true
      }
    })()
  
    return matchesSearch && matchesFilterType && matchesDateFilter
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Follow-Up Tracker
          </h1>
          <p className="text-slate-600 mt-1">Track and manage all your follow-up calls</p>
          {isAdmin() && <p className="text-green-600 font-semibold mt-1">Admin View: Showing all data</p>}
        </div>

        <div className="flex gap-2">
          {/* Date Filter Dropdown */}
          {/* {activeTab === "pending" && ( */}
    <div>
      <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="all">All</option>
        <option value="today">Today</option>
        <option value="overdue">Overdue</option>
        <option value="upcoming">Upcoming</option>
      </select>
    </div>
  {/* )} */}

          {/* Filter Dropdown */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All</option>
              <option value="first">First Followup</option>
              <option value="multi">Expected</option>
            </select>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search follow-ups..."
              className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* <Link to="/follow-up/new">
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              <PlusIcon className="inline-block mr-2 h-4 w-4" /> New Follow-Up
            </button>
          </Link> */}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">All Follow-Ups</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  activeTab === "pending" ? "bg-amber-100 text-amber-800" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "history" ? "bg-amber-100 text-amber-800" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                History
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Loading follow-up data...</p>
            </div>
          ) : (
            <>
              {activeTab === "pending" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead No.
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Company Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Person Name
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Phone No.
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead Source
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          What did customer say
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Enquiry Status
                        </th>
                        {isAdmin() && (
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Assigned To
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPendingFollowUps.length > 0 ? (
                        filteredPendingFollowUps.map((followUp) => (
                          <tr key={followUp.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/follow-up/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}>
                                  <button className="px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md">
                                    Call Now <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                                  </button>
                                </Link>
                                {/* <button
                                  onClick={() => {
                                    setSelectedFollowUp(followUp)
                                    setShowPopup(true)
                                  }}
                                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md"
                                >
                                  View
                                </button> */}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {followUp.leadId}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px] break-words">
                              {followUp.companyName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">
                              {followUp.personName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.phoneNumber}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  followUp.priority === "High"
                                    ? "bg-red-100 text-red-800"
                                    : followUp.priority === "Medium"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {followUp.leadSource}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">
                              {followUp.location}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] break-words">
                              {followUp.customerSay}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">
                              {followUp.enquiryStatus}
                            </td>
                            {isAdmin() && (
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {followUp.assignedTo}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isAdmin() ? 10 : 9} className="px-4 py-4 text-center text-sm text-slate-500">
                            No pending follow-ups found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "history" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          What did the customer say?
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enquiry Received Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enquiry Received Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enquiry for State
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Required Product Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Approximate Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name 1
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity 1
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name 2
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity 2
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name 3
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity 3
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name 4
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity 4
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name 5
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity 5
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Call Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Call Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryFollowUps.length > 0 ? (
                        filteredHistoryFollowUps.map((followUp, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 max-w-[100px] break-words">
                              {followUp.leadNo}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[200px] break-words">
                              {followUp.customerSay}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  followUp.status === "Completed"
                                    ? "bg-green-100 text-green-800"
                                    : followUp.status === "Pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {followUp.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">
                              {followUp.enquiryReceivedStatus}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.enquiryReceivedDate}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[100px] break-words">
                              {followUp.enquiryState}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">
                              {followUp.projectName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.salesType}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.requiredProductDate}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.projectApproxValue}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.itemName1}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.quantity1}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.itemName2}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.quantity2}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.itemName3}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.quantity3}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.itemName4}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.quantity4}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.itemName5}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">{followUp.quantity5}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 max-w-[120px] break-words">{followUp.nextAction}</td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.nextCallDate}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {followUp.nextCallTime}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={24} className="px-4 py-4 text-center text-sm text-slate-500">
                            No history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Popup Modal */}
      {showPopup && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${fadeIn}`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPopup(false)}></div>
          <div
            className={`relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto ${slideIn}`}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Follow-up Details: {selectedFollowUp?.leadId}</h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column B - Lead ID */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Lead Number</p>
                  <p className="text-base font-semibold">{selectedFollowUp?.leadId}</p>
                </div>

                {/* Column C - Person Name */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Person Name</p>
                  <p className="text-base">{selectedFollowUp?.personName}</p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base">{selectedFollowUp?.phoneNumber}</p>
                </div>

                {/* Column D - Lead Source */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Lead Source</p>
                  <p className="text-base">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedFollowUp?.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : selectedFollowUp?.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {selectedFollowUp?.leadSource}
                    </span>
                  </p>
                </div>

                {/* Column G - Company Name */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Company Name</p>
                  <p className="text-base">{selectedFollowUp?.companyName}</p>
                </div>

                {/* Column J - Location */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-base">{selectedFollowUp?.location}</p>
                </div>

                {/* Column K - Created At (using id as placeholder) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Created Date</p>
                  <p className="text-base">{formatPopupDate(selectedFollowUp?.createdAt)}</p>
                </div>

                {/* Column L - Priority (derived from lead source) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <p className="text-base">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedFollowUp?.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : selectedFollowUp?.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {selectedFollowUp?.priority}
                    </span>
                  </p>
                </div>
              </div>

              {/* Customer Say - Full width */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">What Customer Said</p>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-base">{selectedFollowUp?.customerSay}</p>
                </div>
              </div>

              {/* Enquiry Status - Full width */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Enquiry Status</p>
                <p className="text-base">{selectedFollowUp?.enquiryStatus}</p>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Close
              </button>
              <Link to={`/follow-up/new?leadId=${selectedFollowUp?.leadId}&leadNo=${selectedFollowUp?.leadId}`}>
                <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                  Call Now <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FollowUp