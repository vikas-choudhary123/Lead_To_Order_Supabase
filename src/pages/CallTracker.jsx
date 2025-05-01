"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PlusIcon, SearchIcon, ArrowRightIcon, CalendarIcon, ClockIcon, FileTextIcon, BuildingIcon } from "../components/Icons"

function CallTracker() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingCallTrackers, setPendingCallTrackers] = useState([])
  const [historyCallTrackers, setHistoryCallTrackers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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
      if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
        // Extract the parts from Date(YYYY,MM,DD) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(',').map(part => parseInt(part.trim()))
        
        // JavaScript months are 0-indexed, but we need to display them as 1-indexed
        // Also ensure day and month are padded with leading zeros if needed
        return `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`
      }
      
      // Handle other date formats if needed
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
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
      if (typeof timeValue === 'string' && timeValue.startsWith('Date(')) {
        // Extract the parts from Date(YYYY,MM,DD,HH,MM,SS) format
        const dateString = timeValue.substring(5, timeValue.length - 1)
        const parts = dateString.split(',')
        
        // If we have at least 5 parts (year, month, day, hour, minute)
        if (parts.length >= 5) {
          const hour = parseInt(parts[3].trim())
          const minute = parseInt(parts[4].trim())
          
          // Convert to 12-hour format
          const period = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour % 12 || 12 // Convert 0 to 12 for 12 AM
          
          // Format as h:mm AM/PM with leading zero for minutes when needed
          return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
        }
      }
      
      // Handle HH:MM:SS format
      if (typeof timeValue === 'string' && timeValue.includes(':')) {
        const [hour, minute] = timeValue.split(':').map(part => parseInt(part))
        
        // Convert to 12-hour format
        const period = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12 // Convert 0 to 12 for 12 AM
        
        // Format as h:mm AM/PM
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
      }
      
      // If it's already in the correct format or we can't parse it, return as is
      return timeValue
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeValue // Return the original value if formatting fails
    }
  }

  // Function to fetch data from FMS and Enquiry Tracker sheets
  useEffect(() => {
    const fetchCallTrackerData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch data from FMS sheet for Pending Call Trackers
        const pendingUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=FMS"
        const pendingResponse = await fetch(pendingUrl)
        const pendingText = await pendingResponse.text()
        
        // Extract the JSON part from the FMS sheet response
        const pendingJsonStart = pendingText.indexOf('{')
        const pendingJsonEnd = pendingText.lastIndexOf('}') + 1
        const pendingJsonData = pendingText.substring(pendingJsonStart, pendingJsonEnd)
        
        const pendingData = JSON.parse(pendingJsonData)
        
        // Fetch data from Enquiry Tracker sheet for History
        const historyUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Enquiry Tracker"
        const historyResponse = await fetch(historyUrl)
        const historyText = await historyResponse.text()
        
        // Extract the JSON part from the Enquiry Tracker sheet response
        const historyJsonStart = historyText.indexOf('{')
        const historyJsonEnd = historyText.lastIndexOf('}') + 1
        const historyJsonData = historyText.substring(historyJsonStart, historyJsonEnd)
        
        const historyData = JSON.parse(historyJsonData)
        
        // Process Pending Call Trackers from FMS sheet
        if (pendingData && pendingData.table && pendingData.table.rows) {
          const pendingCallTrackerData = []
          
          // Skip the header row (index 0)
          pendingData.table.rows.slice(2).forEach((row, index) => {
            // MODIFIED: Only show rows where column AJ (index 35) is not null and column AK (index 36) is null
            if (row.c && 
                row.c[37] && row.c[37].v && 
                (!row.c[38] || !row.c[38].v)) {
              const callTrackerItem = {
                id: index + 1,
                leadId: row.c[1] ? row.c[1].v : "", // Column B - Lead Number
                receiverName: row.c[2] ? row.c[2].v : "", // Column C - Lead Receiver Name
                leadSource: row.c[38] ? row.c[38].v : "", // Column D - Lead Source
                salespersonName: row.c[39] ? row.c[39].v : "", // Column E - Salesperson Name
                companyName: row.c[40] ? row.c[40].v : "", // Column G - Company Name
                createdAt: row.c[0] ? row.c[0].v : "", // Using date from column A
                status: "Expected", // Default status for pending
                priority: determinePriority(row.c[3] ? row.c[3].v : ""), // Determine priority based on source
                stage: "Pending", // Default stage
                dueDate: "", // You might want to add logic to calculate due date
              }
              
              pendingCallTrackerData.push(callTrackerItem)
            }
          })
          
          setPendingCallTrackers(pendingCallTrackerData)
        }
        
        // Process History Call Trackers from Enquiry Tracker sheet
        if (historyData && historyData.table && historyData.table.rows) {
          const historyCallTrackerData = []
          
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
                orderVideo: row.c[26] ? row.c[26].v : "", // Column AA - Order Video
                acceptanceFile: row.c[27] ? row.c[27].v : "", // Column AB - Acceptance File
                orderRemark: row.c[28] ? row.c[28].v : "", // Column AC - Remark
                apologyVideo: row.c[29] ? row.c[29].v : "", // Column AD - Apology Video
                reasonStatus: row.c[30] ? row.c[30].v : "", // Column AE - Reason Status
                reasonRemark: row.c[31] ? row.c[31].v : "", // Column AF - Reason Remark
                holdReason: row.c[32] ? row.c[32].v : "", // Column AG - Hold Reason
                holdingDate: formatDateToDDMMYYYY(row.c[33] ? row.c[33].v : ""), // Column AH - Holding Date
                holdRemark: row.c[34] ? row.c[34].v : "", // Column AI - Hold Remark
                priority: determinePriority(row.c[2] ? row.c[2].v : ""), // Determine priority based on status
              }
              
              historyCallTrackerData.push(callTrackerItem)
            }
          })
          
          setHistoryCallTrackers(historyCallTrackerData)
        }
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
            companyName: "Sample Corp",
            status: "Expected",
            priority: "Medium",
            stage: "Pending",
            dueDate: "2023-05-20",
          }
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
            holdingDate: "20/05/2023"
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCallTrackerData()
  }, [])

  // Filter function for search in both sections
  const filteredPendingCallTrackers = pendingCallTrackers.filter(
    (tracker) =>
      tracker.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.leadId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredHistoryCallTrackers = historyCallTrackers.filter(
    (tracker) =>
      tracker.enquiryNo.toLowerCase().includes(searchTerm.toLowerCase())
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
                  activeTab === "pending" ? "bg-purple-100 text-purple-800" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "history" ? "bg-purple-100 text-purple-800" : "bg-white text-slate-700 hover:bg-slate-50"
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
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
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
                          Enquiry Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          What Did Customer Say
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPendingCallTrackers.length > 0 ? (
                        filteredPendingCallTrackers.map((tracker) => (
                          <tr key={tracker.id} className="hover:bg-slate-50">
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
                              {tracker.salespersonName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {tracker.companyName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/call-tracker/new?leadId=${tracker.leadId}`}>
                                  <button className="px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md">
                                    Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Video</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acceptance File Upload</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Lost Apology Video</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">If No Then Get Relevant Reason Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">If No Then Get Relevant Reason Remark</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Order Hold Reason Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holding Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hold Remark</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.orderVideo && (
                                <a href={tracker.orderVideo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View Video
                                </a>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tracker.acceptanceFile && (
                                <a href={tracker.acceptanceFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View File
                                </a>
                              )}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {/* <Link to={`/call-tracker/${tracker.id}`}>
                                  <button className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
                                    View
                                  </button>
                                </Link> */}
                              </div>
                            </td>
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
    </div>
  )
}

export default CallTracker