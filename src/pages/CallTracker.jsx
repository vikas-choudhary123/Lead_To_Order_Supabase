"use client"

import { useState, useEffect, useContext } from "react"
import { Link } from "react-router-dom"
import { PlusIcon, SearchIcon, ArrowRightIcon, BuildingIcon } from "../components/Icons"
import { AuthContext } from "../App" // Import AuthContext just like in the FollowUp component

// Animation classes
const slideIn = "animate-in slide-in-from-right duration-300"
const slideOut = "animate-out slide-out-to-right duration-300"
const fadeIn = "animate-in fade-in duration-300"
const fadeOut = "animate-out fade-out duration-300"

function CallTracker() {
  const { currentUser, userType, isAdmin } = useContext(AuthContext) // Get user info and admin function
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingCallTrackers, setPendingCallTrackers] = useState([])
  const [historyCallTrackers, setHistoryCallTrackers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewCallTrackerForm, setShowNewCallTrackerForm] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [directEnquiryPendingTrackers, setDirectEnquiryPendingTrackers] = useState([])
  const [callingDaysFilter, setCallingDaysFilter] = useState([])
  const [enquiryNoFilter, setEnquiryNoFilter] = useState([])
  const [currentStageFilter, setCurrentStageFilter] = useState([])
  const [availableEnquiryNos, setAvailableEnquiryNos] = useState([])
  
  // Dropdown visibility states
  const [showCallingDaysDropdown, setShowCallingDaysDropdown] = useState(false)
  const [showEnquiryNoDropdown, setShowEnquiryNoDropdown] = useState(false)
  const [showCurrentStageDropdown, setShowCurrentStageDropdown] = useState(false)

  // Helper function to determine priority based on status
  const determinePriority = (status) => {
    if (!status) return "Low"

    const statusLower = status.toLowerCase()
    if (statusLower === "hot") return "High"
    if (statusLower === "warm") return "Medium"
    return "Low"
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
        return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`
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

  // Helper function to format time to 12-hour format with AM/PM
  const formatTimeTo12Hour = (timeValue) => {
    if (!timeValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(1899,11,30,17,9,0)")
      if (typeof timeValue === "string" && timeValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD,HH,MM,SS) format
        const dateString = timeValue.substring(5, timeValue.length - 1)
        const parts = dateString.split(",")

        // If we have at least 5 parts (year, month, day, hour, minute)
        if (parts.length >= 5) {
          const hour = Number.parseInt(parts[3].trim())
          const minute = Number.parseInt(parts[4].trim())

          // Convert to 12-hour format
          const period = hour >= 12 ? "PM" : "AM"
          const displayHour = hour % 12 || 12 // Convert 0 to 12 for 12 AM

          // Format as h:mm AM/PM with leading zero for minutes when needed
          return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`
        }
      }

      // Handle HH:MM:SS format
      if (typeof timeValue === "string" && timeValue.includes(":")) {
        const [hour, minute] = timeValue.split(":").map((part) => Number.parseInt(part))

        // Convert to 12-hour format
        const period = hour >= 12 ? "PM" : "AM"
        const displayHour = hour % 12 || 12 // Convert 0 to 12 for 12 AM

        // Format as h:mm AM/PM
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`
      }

      // If it's already in the correct format or we can't parse it, return as is
      return timeValue
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeValue // Return the original value if formatting fails
    }
  }

  // Helper function to check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr.split("/").reverse().join("-")) // Convert DD/MM/YYYY to YYYY-MM-DD
      const today = new Date()
      return date.toDateString() === today.toDateString()
    } catch {
      return false
    }
  }

  // Helper function to check if a date is overdue
  const isOverdue = (dateStr) => {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr.split("/").reverse().join("-"))
      const today = new Date()
      return date < today
    } catch {
      return false
    }
  }

  // Helper function to check if a date is upcoming
  const isUpcoming = (dateStr) => {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr.split("/").reverse().join("-"))
      const today = new Date()
      return date > today
    } catch {
      return false
    }
  }

  // Helper function to check calling days filter
  const matchesCallingDaysFilter = (dateStr, activeTab) => {
    if (callingDaysFilter.length === 0) return true

    return callingDaysFilter.some((filter) => {
      switch (filter) {
        case "today":
          return isToday(dateStr)
        case "overdue":
          return isOverdue(dateStr)
        case "upcoming":
          return isUpcoming(dateStr)
        default:
          return false
      }
    })
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCallingDaysDropdown(false)
        setShowEnquiryNoDropdown(false)
        setShowCurrentStageDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Function to fetch data from FMS and Enquiry Tracker sheets
  useEffect(() => {
    const fetchCallTrackerData = async () => {
      try {
        setIsLoading(true)

        // Fetch data from FMS sheet for Pending Call Trackers
        const pendingUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=FMS"
        const pendingResponse = await fetch(pendingUrl)
        const pendingText = await pendingResponse.text()

        // Extract the JSON part from the FMS sheet response
        const pendingJsonStart = pendingText.indexOf("{")
        const pendingJsonEnd = pendingText.lastIndexOf("}") + 1
        const pendingJsonData = pendingText.substring(pendingJsonStart, pendingJsonEnd)

        const pendingData = JSON.parse(pendingJsonData)

        // Fetch data from Enquiry Tracker sheet for History
        const historyUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=Enquiry Tracker"
        const historyResponse = await fetch(historyUrl)
        const historyText = await historyResponse.text()

        // Extract the JSON part from the Enquiry Tracker sheet response
        const historyJsonStart = historyText.indexOf("{")
        const historyJsonEnd = historyText.lastIndexOf("}") + 1
        const historyJsonData = historyText.substring(historyJsonStart, historyJsonEnd)

        const historyData = JSON.parse(historyJsonData)

        // Fetch data from ENQUIRY TO ORDER sheet for Direct Enquiry Pending
        const directEnquiryUrl =
          "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=ENQUIRY TO ORDER"
        const directEnquiryResponse = await fetch(directEnquiryUrl)
        const directEnquiryText = await directEnquiryResponse.text()

        // Extract the JSON part from the ENQUIRY TO ORDER sheet response
        const directEnquiryJsonStart = directEnquiryText.indexOf("{")
        const directEnquiryJsonEnd = directEnquiryText.lastIndexOf("}") + 1
        const directEnquiryJsonData = directEnquiryText.substring(directEnquiryJsonStart, directEnquiryJsonEnd)

        const directEnquiryData = JSON.parse(directEnquiryJsonData)

        // Process Pending Call Trackers from FMS sheet
        let pendingCallTrackerData = []
        if (pendingData && pendingData.table && pendingData.table.rows) {
          pendingCallTrackerData = []

          // Skip the header row (index 0)
          pendingData.table.rows.slice(2).forEach((row, index) => {
            // Only show rows where column AJ (index 35) is not null and column AK (index 36) is null
            if (row.c && row.c[52] && row.c[52].v && (!row.c[53] || !row.c[53].v)) {
              // Get the assigned user from column CC (index 88) like in the FollowUp component
              const assignedUser = row.c[88] ? row.c[88].v : ""

              // For admin users, include all rows; for regular users, filter by their username
              const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)

              if (shouldInclude) {
                const callTrackerItem = {
                  id: index + 1,
                  leadId: row.c[1] ? row.c[1].v : "", // Column B - Lead Number
                  receiverName: row.c[2] ? row.c[2].v : "", // Column C - Lead Receiver Name
                  leadSource: row.c[3] ? row.c[3].v : "", // Column D - Lead Source
                  salespersonName: row.c[6] ? row.c[6].v : "", // Column E - Salesperson Name
                  phoneNumber: row.c[5] ? row.c[5].v : "", // Added phone number from column F (index 5)
                  companyName: row.c[4] ? row.c[4].v : "", // Column G - Company Name
                  createdAt: row.c[0] ? formatDateToDDMMYYYY(row.c[0].v) : "", // Using date from column A
                  status: "Expected", // Default status for pending
                  priority: determinePriority(row.c[3] ? row.c[3].v : ""), // Determine priority based on source
                  stage: "Pending", // Default stage
                  dueDate: "", // You might want to add logic to calculate due date
                  assignedTo: assignedUser, // Add assigned user to the tracker item
                  currentStage: row.c[57] ? row.c[57].v : "", // Column BF - Current Stage
                  callingDate: row.c[90] ? formatDateToDDMMYYYY(row.c[90].v) : "", // Column CM - Calling Date
                }

                pendingCallTrackerData.push(callTrackerItem)
              }
            }
          })

          setPendingCallTrackers(pendingCallTrackerData)
        }

        // Process History Call Trackers from Enquiry Tracker sheet
        let historyCallTrackerData = []
        if (historyData && historyData.table && historyData.table.rows) {
          historyCallTrackerData = []

          // Start from index 1 to skip header row
          historyData.table.rows.slice(0).forEach((row, index) => {
            if (row.c) {
              const callTrackerItem = {
                id: index + 1,
                timestamp: formatDateToDDMMYYYY(row.c[0] ? row.c[0].v : ""), // Column A - Timestamp
                enquiryNo: row.c[1] ? row.c[1].v : "", // Column B - Enquiry No
                enquiryStatus: row.c[2] ? row.c[2].v : "", // Column C - Enquiry Status
                customerFeedback: row.c[3] ? row.c[3].v : "", // Column D - What Did Customer Say
                currentStage: row.c[4] ? row.c[4].v : "", // Column E - Current Stage
                sendQuotationNo: row.c[5] ? row.c[5].v : "", // Column F - Send Quotation No
                quotationSharedBy: row.c[6] ? row.c[6].v : "", // Column G - Quotation Shared By
                quotationNumber: row.c[7] ? row.c[7].v : "", // Column H - Quotation Number
                valueWithoutTax: row.c[8] ? row.c[8].v : "", // Column I - Value Without Tax
                valueWithTax: row.c[9] ? row.c[9].v : "", // Column J - Value With Tax
                quotationUpload: row.c[10] ? row.c[10].v : "", // Column K - Quotation Upload
                quotationRemarks: row.c[11] ? row.c[11].v : "", // Column L - Quotation Remarks
                validatorName: row.c[12] ? row.c[12].v : "", // Column M - Validator Name
                sendStatus: row.c[13] ? row.c[13].v : "", // Column N - Send Status
                validationRemark: row.c[14] ? row.c[14].v : "", // Column O - Validation Remark
                faqVideo: row.c[15] ? row.c[15].v : "", // Column P - FAQ Video
                productVideo: row.c[16] ? row.c[16].v : "", // Column Q - Product Video
                offerVideo: row.c[17] ? row.c[17].v : "", // Column R - Offer Video
                productCatalog: row.c[18] ? row.c[18].v : "", // Column S - Product Catalog
                productImage: row.c[19] ? row.c[19].v : "", // Column T - Product Image
                nextCallDate: formatDateToDDMMYYYY(row.c[20] ? row.c[20].v : ""), // Column U - Next Call Date
                nextCallTime: formatTimeTo12Hour(row.c[21] ? row.c[21].v : ""), // Column V - Next Call Time
                orderStatus: row.c[22] ? row.c[22].v : "", // Column W - Is Order Received? Status
                acceptanceVia: row.c[23] ? row.c[23].v : "", // Column X - Acceptance Via
                paymentMode: row.c[24] ? row.c[24].v : "", // Column Y - Payment Mode
                paymentTerms: row.c[25] ? row.c[25].v : "", // Column Z - Payment Terms
                transportMode: row.c[26] ? row.c[26].v : "", // Column Z - Payment Terms
                registrationFrom: row.c[27] ? row.c[27].v : "", // Column Z - Payment Terms
                orderVideo: row.c[28] ? row.c[28].v : "", // Column AA - Order Video
                acceptanceFile: row.c[29] ? row.c[29].v : "", // Column AB - Acceptance File
                orderRemark: row.c[30] ? row.c[30].v : "", // Column AC - Remark
                apologyVideo: row.c[31] ? row.c[31].v : "", // Column AD - Apology Video
                reasonStatus: row.c[32] ? row.c[32].v : "", // Column AE - Reason Status
                reasonRemark: row.c[33] ? row.c[33].v : "", // Column AF - Reason Remark
                holdReason: row.c[34] ? row.c[34].v : "", // Column AG - Hold Reason
                holdingDate: formatDateToDDMMYYYY(row.c[35] ? row.c[35].v : ""), // Column AH - Holding Date
                holdRemark: row.c[36] ? row.c[36].v : "", // Column AI - Hold Remark
                priority: determinePriority(row.c[2] ? row.c[2].v : ""), // Determine priority based on status
                callingDate: formatDateToDDMMYYYY(row.c[41] ? row.c[41].v : ""), // Column AP - Calling Date
              }

              historyCallTrackerData.push(callTrackerItem)
            }
          })

          setHistoryCallTrackers(historyCallTrackerData)
        }

        // Process Direct Enquiry Pending from ENQUIRY TO ORDER sheet
        let directEnquiryPendingData = []
        if (directEnquiryData && directEnquiryData.table && directEnquiryData.table.rows) {
          directEnquiryPendingData = []

          // Skip the header row (index 0)
          directEnquiryData.table.rows.slice(1).forEach((row, index) => {
            // Only show rows where column AH (index 37) is not null and column AI (index 38) is null
            if (row.c && row.c[37] && row.c[37].v && (!row.c[38] || !row.c[38].v)) {
              // Get the assigned user from column BX (index 75)
              const assignedUser = row.c[75] ? row.c[75].v : ""

              // For admin users, include all rows; for regular users, filter by their username
              const shouldInclude = isAdmin() || (currentUser && assignedUser === currentUser.username)

              if (shouldInclude) {
                const directEnquiryItem = {
                  id: index + 1,
                  leadId: row.c[1] ? row.c[1].v : "", // Column B - Lead Number
                  receiverName: row.c[2] ? row.c[2].v : "", // Column C - Lead Receiver Name
                  leadSource: row.c[3] ? row.c[3].v : "", // Column D - Lead Source
                  salespersonName: row.c[41] ? row.c[41].v : "", // Column E - Salesperson Name
                  companyName: row.c[42] ? row.c[42].v : "", // Column G - Company Name
                  createdAt: row.c[0] ? formatDateToDDMMYYYY(row.c[0].v) : "", // Using date from column A
                  status: "Expected", // Default status for pending
                  priority: determinePriority(row.c[3] ? row.c[3].v : ""), // Determine priority based on source
                  stage: "Pending", // Default stage
                  dueDate: "", // You might want to add logic to calculate due date
                  assignedTo: assignedUser, // Add assigned user to the tracker item
                  currentStage: row.c[42] ? row.c[42].v : "", // Column AQ - Current Stage
                  callingDate: row.c[76] ? formatDateToDDMMYYYY(row.c[76].v) : "", // Column BY - Calling Date
                }

                directEnquiryPendingData.push(directEnquiryItem)
              }
            }
          })

          setDirectEnquiryPendingTrackers(directEnquiryPendingData)
        }

        // Extract unique enquiry numbers for filter dropdown
        const allEnquiryNos = new Set()

        // Add enquiry numbers from pending data
        pendingCallTrackerData.forEach((item) => {
          if (item.leadId) allEnquiryNos.add(item.leadId)
        })

        // Add enquiry numbers from direct enquiry data
        directEnquiryPendingData.forEach((item) => {
          if (item.leadId) allEnquiryNos.add(item.leadId)
        })

        // Add enquiry numbers from history data
        historyCallTrackerData.forEach((item) => {
          if (item.enquiryNo) allEnquiryNos.add(item.enquiryNo)
        })

        setAvailableEnquiryNos(Array.from(allEnquiryNos).sort())
      } catch (error) {
        console.error("Error fetching call tracker data:", error)
        // Fallback to mock data if fetch fails
        setPendingCallTrackers([
          {
            id: "1",
            leadId: "En-001",
            receiverName: "John Doe",
            leadSource: "Website",
            salespersonName: "Jane Smith",
            phoneNumber: "9876543210", // Added sample phone number
            companyName: "Sample Corp",
            status: "Expected",
            priority: "Medium",
            stage: "Pending",
            dueDate: "2023-05-20",
            currentStage: "make-quotation",
            callingDate: "15/05/2023",
          },
        ])

        setHistoryCallTrackers([
          {
            id: "2",
            timestamp: "10/05/2023",
            enquiryNo: "En-002",
            enquiryStatus: "Cold",
            customerFeedback: "Will think about it",
            currentStage: "Order Status",
            priority: "Low",
            nextCallDate: "15/05/2023",
            nextCallTime: "5:30 PM",
            holdingDate: "20/05/2023",
            callingDate: "12/05/2023",
          },
        ])

        setDirectEnquiryPendingTrackers([
          {
            id: "3",
            leadId: "En-003",
            receiverName: "Alice Brown",
            leadSource: "Referral",
            salespersonName: "Bob Johnson",
            companyName: "Test Corp",
            createdAt: "05/05/2023",
            status: "Expected",
            priority: "High",
            stage: "Pending",
            currentStage: "quotation-validation",
            callingDate: "18/05/2023",
          },
        ])

        setAvailableEnquiryNos(["En-001", "En-002", "En-003"])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCallTrackerData()
  }, [currentUser, isAdmin]) // Add isAdmin to dependencies like in FollowUp

  // Enhanced filter function for search and dropdown filters
  const filterTrackers = (tracker, searchTerm, activeTab) => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesSearch = Object.values(tracker).some(
        (value) => value && value.toString().toLowerCase().includes(term),
      )
      if (!matchesSearch) return false
    }

    // Enquiry number filter
    if (enquiryNoFilter.length > 0) {
      const enquiryNo = activeTab === "history" ? tracker.enquiryNo : tracker.leadId
      if (!enquiryNoFilter.includes(enquiryNo)) return false
    }

    // Current stage filter
    if (currentStageFilter.length > 0) {
      const currentStage = tracker.currentStage || ""
      if (!currentStageFilter.includes(currentStage)) return false
    }

    // Calling days filter
    if (callingDaysFilter.length > 0) {
      const callingDate = tracker.callingDate || ""
      if (!matchesCallingDaysFilter(callingDate, activeTab)) return false
    }

    return true
  }

  const filteredPendingCallTrackers = pendingCallTrackers.filter((tracker) =>
    filterTrackers(tracker, searchTerm, "pending"),
  )

  const filteredHistoryCallTrackers = historyCallTrackers.filter((tracker) =>
    filterTrackers(tracker, searchTerm, "history"),
  )

  const filteredDirectEnquiryPendingTrackers = directEnquiryPendingTrackers.filter((tracker) =>
    filterTrackers(tracker, searchTerm, "directEnquiry"),
  )

  // Toggle dropdown visibility
  const toggleCallingDaysDropdown = (e) => {
    e.stopPropagation()
    setShowCallingDaysDropdown(!showCallingDaysDropdown)
    setShowEnquiryNoDropdown(false)
    setShowCurrentStageDropdown(false)
  }

  const toggleEnquiryNoDropdown = (e) => {
    e.stopPropagation()
    setShowEnquiryNoDropdown(!showEnquiryNoDropdown)
    setShowCallingDaysDropdown(false)
    setShowCurrentStageDropdown(false)
  }

  const toggleCurrentStageDropdown = (e) => {
    e.stopPropagation()
    setShowCurrentStageDropdown(!showCurrentStageDropdown)
    setShowCallingDaysDropdown(false)
    setShowEnquiryNoDropdown(false)
  }

  // Handle checkbox changes
  const handleCallingDaysChange = (value) => {
    if (callingDaysFilter.includes(value)) {
      setCallingDaysFilter(callingDaysFilter.filter(item => item !== value))
    } else {
      setCallingDaysFilter([...callingDaysFilter, value])
    }
  }

  const handleEnquiryNoChange = (value) => {
    if (enquiryNoFilter.includes(value)) {
      setEnquiryNoFilter(enquiryNoFilter.filter(item => item !== value))
    } else {
      setEnquiryNoFilter([...enquiryNoFilter, value])
    }
  }

  const handleCurrentStageChange = (value) => {
    if (currentStageFilter.includes(value)) {
      setCurrentStageFilter(currentStageFilter.filter(item => item !== value))
    } else {
      setCurrentStageFilter([...currentStageFilter, value])
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Call Tracker
          </h1>
          <p className="text-slate-600 mt-1">Track the progress of enquiries through the sales pipeline</p>
          {isAdmin() && <p className="text-green-600 font-semibold mt-1">Admin View: Showing all data</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
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

          {/* Calling Days Filter */}
          <div className="relative dropdown-container">
            <button
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white flex items-center"
              onClick={toggleCallingDaysDropdown}
            >
              <span>Calling Days {callingDaysFilter.length > 0 && `(${callingDaysFilter.length})`}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${showCallingDaysDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCallingDaysDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-full">
                <div className="p-2">
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={callingDaysFilter.includes("today")}
                      onChange={() => handleCallingDaysChange("today")}
                    />
                    <span>Today</span>
                  </label>
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={callingDaysFilter.includes("overdue")}
                      onChange={() => handleCallingDaysChange("overdue")}
                    />
                    <span>Overdue</span>
                  </label>
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={callingDaysFilter.includes("upcoming")}
                      onChange={() => handleCallingDaysChange("upcoming")}
                    />
                    <span>Upcoming</span>
                  </label>
                </div>
              </div>
            )}
            {callingDaysFilter.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {callingDaysFilter.map((filter) => (
                  <span key={filter} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {filter}
                    <button
                      onClick={() => setCallingDaysFilter(callingDaysFilter.filter((item) => item !== filter))}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Enquiry No Filter */}
          <div className="relative dropdown-container">
            <button
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white flex items-center"
              onClick={toggleEnquiryNoDropdown}
            >
              <span>Enquiry No. {enquiryNoFilter.length > 0 && `(${enquiryNoFilter.length})`}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${showEnquiryNoDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showEnquiryNoDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-full max-h-60 overflow-y-auto">
                <div className="p-2">
                  {availableEnquiryNos.map((enquiryNo) => (
                    <label key={enquiryNo} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={enquiryNoFilter.includes(enquiryNo)}
                        onChange={() => handleEnquiryNoChange(enquiryNo)}
                      />
                      <span>{enquiryNo}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {enquiryNoFilter.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {enquiryNoFilter.map((filter) => (
                  <span key={filter} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {filter}
                    <button
                      onClick={() => setEnquiryNoFilter(enquiryNoFilter.filter((item) => item !== filter))}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Current Stage Filter */}
          <div className="relative dropdown-container">
            <button
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white flex items-center"
              onClick={toggleCurrentStageDropdown}
            >
              <span>Current Stage {currentStageFilter.length > 0 && `(${currentStageFilter.length})`}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${showCurrentStageDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCurrentStageDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-full">
                <div className="p-2">
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("make-quotation")}
                      onChange={() => handleCurrentStageChange("make-quotation")}
                    />
                    <span>Make Quotation</span>
                  </label>
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("quotation-validation")}
                      onChange={() => handleCurrentStageChange("quotation-validation")}
                    />
                    <span>Quotation Validation</span>
                  </label>
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("order-status")}
                      onChange={() => handleCurrentStageChange("order-status")}
                    />
                    <span>Order Status</span>
                  </label>
                  <label className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("order-expected")}
                      onChange={() => handleCurrentStageChange("order-expected")}
                    />
                    <span>Order Expected</span>
                  </label>
                </div>
              </div>
            )}
            {currentStageFilter.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {currentStageFilter.map((filter) => (
                  <span key={filter} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {filter.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    <button
                      onClick={() => setCurrentStageFilter(currentStageFilter.filter((item) => item !== filter))}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {(callingDaysFilter.length > 0 || enquiryNoFilter.length > 0 || currentStageFilter.length > 0) && (
            <button
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={() => {
                setCallingDaysFilter([])
                setEnquiryNoFilter([])
                setCurrentStageFilter([])
              }}
            >
              Clear Filters
            </button>
          )}

          <button
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={() => setShowNewCallTrackerForm(true)}
          >
            <PlusIcon className="inline-block mr-2 h-4 w-4" /> Direct Enquiry
          </button>
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
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "pending"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("directEnquiry")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "directEnquiry"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Direct Enquiry Pending
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

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Loading call tracker data...</p>
            </div>
          ) : (
            <>
              {activeTab === "pending" && (
                <div className="rounded-md border overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead No.
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead Receiver Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead Source
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Phone No.
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Salesperson Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Calling Date
                        </th>
                        {isAdmin() && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Assigned To
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPendingCallTrackers.length > 0 ? (
                        filteredPendingCallTrackers.map((tracker) => (
                          <tr key={tracker.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/call-tracker/new?leadId=${tracker.leadId}`}>
                                  <button className="px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md">
                                    Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                                  </button>
                                </Link>
                                {/* <button
                                  onClick={() => {
                                    setSelectedTracker(tracker)
                                    setShowPopup(true)
                                  }}
                                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md"
                                >
                                  View
                                </button> */}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tracker.leadId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.receiverName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tracker.priority === "High"
                                    ? "bg-red-100 text-red-800"
                                    : tracker.priority === "Medium"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {tracker.leadSource}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">{tracker.phoneNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.salespersonName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {tracker.companyName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.currentStage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.callingDate}
                            </td>
                            {isAdmin() && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {tracker.assignedTo}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isAdmin() ? 10 : 9} className="px-6 py-4 text-center text-sm text-slate-500">
                            No pending call trackers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "directEnquiry" && (
                <div className="rounded-md border overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead No.
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Lead Source
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Company Name
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
                          Calling Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDirectEnquiryPendingTrackers.length > 0 ? (
                        filteredDirectEnquiryPendingTrackers.map((tracker) => (
                          <tr key={tracker.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/call-tracker/new?leadId=${tracker.leadId}`}>
                                  <button className="px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md">
                                    Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedTracker(tracker)
                                    setShowPopup(true)
                                  }}
                                  className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tracker.leadId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.receiverName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tracker.priority === "High"
                                    ? "bg-red-100 text-red-800"
                                    : tracker.priority === "Medium"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {tracker.leadSource}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.currentStage}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.callingDate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                            No direct enquiry pending trackers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

{activeTab === "history" && (
  <div className="rounded-md border overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry No.</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">What Did Customer Say</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Quotation No.</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Shared By</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Number</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Value Without Tax</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Value With Tax</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Upload</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Remarks</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Validator Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Send Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation Validation Remark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send FAQ Video</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Product Video</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Offer Video</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Product Catalog</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send Product Image</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Call Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Call Time</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is Order Received? Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acceptance Via</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Terms (In Days)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Mode</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONVEYED FOR REGISTRATION FORM</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Video</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acceptance File Upload</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Lost Apology Video</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">If No Then Get Relevant Reason Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">If No Then Get Relevant Reason Remark</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Order Hold Reason Category</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holding Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hold Remark</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredHistoryCallTrackers.length > 0 ? (
          filteredHistoryCallTrackers.map((tracker) => (
            <tr key={tracker.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.timestamp}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tracker.enquiryNo}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tracker.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : tracker.priority === "Medium"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {tracker.enquiryStatus}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.customerFeedback}>{tracker.customerFeedback}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.currentStage}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.sendQuotationNo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.quotationSharedBy}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.quotationNumber}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.valueWithoutTax}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.valueWithTax}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tracker.quotationUpload && (
                  <a href={tracker.quotationUpload} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View File
                  </a>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.quotationRemarks}>{tracker.quotationRemarks}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.validatorName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.sendStatus}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.validationRemark}>{tracker.validationRemark}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.faqVideo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productVideo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.offerVideo}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productCatalog}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.productImage}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.nextCallDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.nextCallTime}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.orderStatus}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.acceptanceVia}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.paymentMode}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.paymentTerms}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.transportMode}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.registrationFrom}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tracker.orderVideo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tracker.acceptanceFile}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.orderRemark}>{tracker.orderRemark}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tracker.apologyVideo && (
                  <a href={tracker.apologyVideo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Video
                  </a>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.reasonStatus}>{tracker.reasonStatus}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.reasonRemark}>{tracker.reasonRemark}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.holdReason}>{tracker.holdReason}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tracker.holdingDate}</td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={tracker.holdRemark}>{tracker.holdRemark}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={36} className="px-6 py-4 text-center text-sm text-slate-500">
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

      {/* New Call Tracker Form Modal */}
      {showNewCallTrackerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">New Call Tracker</h2>
                <button onClick={() => setShowNewCallTrackerForm(false)} className="text-gray-500 hover:text-gray-700">
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
            </div>
            <CallTrackerForm />
          </div>
        </div>
      )}

      {/* View Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${fadeIn}`}
            onClick={() => setShowPopup(false)}
          ></div>
          <div
            className={`relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto ${slideIn}`}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "pending" || activeTab === "directEnquiry"
                  ? `Call Tracker Details: ${selectedTracker?.leadId}`
                  : `Call Tracker History: ${selectedTracker?.enquiryNo}`}
              </h3>
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
              {activeTab === "pending" || activeTab === "directEnquiry" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column B - Lead ID */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Number</p>
                    <p className="text-base font-semibold">{selectedTracker?.leadId}</p>
                  </div>

                  {/* Column C - Receiver Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Receiver Name</p>
                    <p className="text-base">{selectedTracker?.receiverName}</p>
                  </div>

                  {/* Column D - Lead Source */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Lead Source</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.leadSource}
                      </span>
                    </p>
                  </div>

                  {/* Column E - Salesperson Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Salesperson Name</p>
                    <p className="text-base">{selectedTracker?.salespersonName}</p>
                  </div>

                  {/* Column G - Company Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="text-base">{selectedTracker?.companyName}</p>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Created Date</p>
                    <p className="text-base">{selectedTracker?.createdAt}</p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-base">{selectedTracker?.status}</p>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.priority}
                      </span>
                    </p>
                  </div>

                  {/* Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Stage</p>
                    <p className="text-base">{selectedTracker?.stage}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Enquiry No */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Enquiry No.</p>
                    <p className="text-base font-semibold">{selectedTracker?.enquiryNo}</p>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Timestamp</p>
                    <p className="text-base">{selectedTracker?.timestamp}</p>
                  </div>

                  {/* Enquiry Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Enquiry Status</p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.enquiryStatus}
                      </span>
                    </p>
                  </div>

                  {/* Current Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Current Stage</p>
                    <p className="text-base">{selectedTracker?.currentStage}</p>
                  </div>

                  {/* Next Call Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Next Call Date</p>
                    <p className="text-base">{selectedTracker?.nextCallDate}</p>
                  </div>

                  {/* Next Call Time */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Next Call Time</p>
                    <p className="text-base">{selectedTracker?.nextCallTime}</p>
                  </div>

                  {/* Holding Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Holding Date</p>
                    <p className="text-base">{selectedTracker?.holdingDate}</p>
                  </div>

                  {/* Order Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Order Status</p>
                    <p className="text-base">{selectedTracker?.orderStatus}</p>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Payment Mode</p>
                    <p className="text-base">{selectedTracker?.paymentMode}</p>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Payment Terms</p>
                    <p className="text-base">{selectedTracker?.paymentTerms}</p>
                  </div>
                </div>
              )}

              {/* Customer Feedback - Full width */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">What Did Customer Say</p>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-base">
                    {activeTab === "pending" || activeTab === "directEnquiry"
                      ? "No feedback yet"
                      : selectedTracker?.customerFeedback}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Close
              </button>
              {(activeTab === "pending" || activeTab === "directEnquiry") && (
                <Link to={`/call-tracker/new?leadId=${selectedTracker?.leadId}`}>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    Process <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallTracker
