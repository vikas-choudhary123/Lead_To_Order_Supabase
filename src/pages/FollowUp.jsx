"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PlusIcon, SearchIcon, ArrowRightIcon, CalendarIcon, ClockIcon, BuildingIcon } from "../components/Icons"

function FollowUp() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingFollowUps, setPendingFollowUps] = useState([])
  const [historyFollowUps, setHistoryFollowUps] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to determine priority based on lead source
  const determinePriority = (source) => {
    if (!source) return "Low"
    
    const sourceLower = source.toLowerCase()
    if (sourceLower.includes("indiamart")) return "High"
    if (sourceLower.includes("website")) return "Medium"
    return "Low"
  }

  // Helper function to calculate next call date (3 days after created date)
  const calculateNextCallDate = (createdDate) => {
    if (!createdDate) return ""
    
    try {
      // Parse the date - assuming format is DD/MM/YYYY
      const parts = createdDate.split('/')
      if (parts.length !== 3) return ""
      
      const date = new Date(parts[2], parts[1] - 1, parts[0])
      date.setDate(date.getDate() + 3) // Add 3 days for next call
      
      // Format as YYYY-MM-DD for display
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

  // Function to fetch data from FMS and Leads Tracker sheets
  useEffect(() => {
    const fetchFollowUpData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch data from FMS sheet for Pending Follow-ups
        const pendingUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=FMS"
        const pendingResponse = await fetch(pendingUrl)
        const pendingText = await pendingResponse.text()
        
        // Extract the JSON part from the FMS sheet response
        const pendingJsonStart = pendingText.indexOf('{')
        const pendingJsonEnd = pendingText.lastIndexOf('}') + 1
        const pendingJsonData = pendingText.substring(pendingJsonStart, pendingJsonEnd)
        
        const pendingData = JSON.parse(pendingJsonData)
        
        // Fetch data from Leads Tracker sheet for History
        const historyUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=Leads Tracker"
        const historyResponse = await fetch(historyUrl)
        const historyText = await historyResponse.text()
        
        // Extract the JSON part from the Leads Tracker sheet response
        const historyJsonStart = historyText.indexOf('{')
        const historyJsonEnd = historyText.lastIndexOf('}') + 1
        const historyJsonData = historyText.substring(historyJsonStart, historyJsonEnd)
        
        const historyData = JSON.parse(historyJsonData)
        
        // Process Pending Follow-ups from FMS sheet
        if (pendingData && pendingData.table && pendingData.table.rows) {
          const pendingFollowUpData = []
          
          // Skip the header row (index 0)
          pendingData.table.rows.slice(0).forEach(row => {
            if (row.c) {
              // Check if column K (index 10) has data and column L (index 11) is null
              const hasColumnK = row.c[10] && row.c[10].v;
              const isColumnLEmpty = !row.c[11] || row.c[11].v === null || row.c[11].v === "";
              
              // Only include rows where column K has data and column L is null/empty
              if (hasColumnK && isColumnLEmpty) {
                const followUpItem = {
                  id: row.c[0] ? row.c[0].v : "",
                  leadId: row.c[1] ? row.c[1].v : "", // Column B - Lead Number
                  receiverName: row.c[2] ? row.c[2].v : "", // Column C - Lead Receiver Name
                  leadSource: row.c[13] ? row.c[13].v : "", // Column D - Lead Source
                  salespersonName: row.c[14] ? row.c[14].v : "", // Column E - Salesperson Name
                  companyName: row.c[15] ? row.c[15].v : "", // Column G - Company Name
                  createdAt: row.c[0] ? row.c[0].v : "", // Using date from column A
                  status: "Expected", // Default status for pending
                  priority: determinePriority(row.c[3] ? row.c[3].v : ""), // Determine priority based on source
                  nextCallDate: calculateNextCallDate(row.c[0] ? row.c[0].v : ""), // Calculate next call date
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
          historyData.table.rows.slice(0).forEach(row => {
            if (row.c) {
              const followUpItem = {
                leadNo: row.c[1] ? row.c[1].v : "", // Column B - Lead No.
                customerSay: row.c[2] ? row.c[2].v : "", // Column C - What did the customer say?
                status: row.c[3] ? row.c[3].v : "", // Column D - Status
                enquiryReceivedStatus: row.c[4] ? row.c[4].v : "", // Column E - Enquiry Received Status
                enquiryReceivedDate: row.c[5] ? formatDateToDDMMYYYY(row.c[5] ? row.c[5].v : "") : "",
                enquiryState: row.c[6] ? row.c[6].v : "", // Column G - Enquiry for State
                projectName: row.c[7] ? row.c[7].v : "", // Column H - Project Name
                salesType: row.c[8] ? row.c[8].v : "", // Column I - Sales Type
                requiredProductDate: row.c[9] ? formatDateToDDMMYYYY(row.c[9] ? row.c[9].v : ""): "", // Column J - Required Product Date
                projectApproxValue: row.c[10] ? row.c[10].v : "", // Column K - Project Approximate Value
                
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
                nextCallDate: row.c[22] ? formatDateToDDMMYYYY(row.c[22] ? row.c[22].v : ""): "", // Column W - Next Call Date
                nextCallTime: row.c[23] ? row.c[23].v : "", // Column X - Next Call Time
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
            receiverName: "John Smith",
            leadSource: "Indiamart",
            salespersonName: "Sarah Johnson",
            companyName: "ABC Corp",
            status: "Expected",
            nextCallDate: "2023-05-20",
            createdAt: "2023-05-15",
            priority: "High",
          }
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
            nextCallTime: "10:00 AM"
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFollowUpData()
  }, [])

  // Filter function for search in both sections
  const filteredPendingFollowUps = pendingFollowUps.filter(
    (followUp) =>
      followUp.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.leadId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredHistoryFollowUps = historyFollowUps.filter(
    (followUp) =>
      followUp.leadNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      followUp.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Follow-Up Tracker
          </h1>
          <p className="text-slate-600 mt-1">Track and manage all your follow-up calls</p>
        </div>

        <div className="flex gap-2">
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

          <Link to="/follow-up/new">
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
              <PlusIcon className="inline-block mr-2 h-4 w-4" /> New Follow-Up
            </button>
          </Link>
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
                          Status
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
                          Enquiry Received Status
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
                      {filteredPendingFollowUps.length > 0 ? (
                        filteredPendingFollowUps.map((followUp) => (
                          <tr key={followUp.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {followUp.leadId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {followUp.receiverName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {followUp.salespersonName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-2 text-slate-400" />
                                {followUp.companyName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link to={`/follow-up/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}>
                                  <button className="px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md">
                                    Call Now <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                                  </button>
                                </Link>
                                <Link to={`/follow-up/${followUp.id}`}>
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
                            No pending follow-ups found
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">What did the customer say?</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry Received Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry Received Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enquiry for State</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Product Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Approximate Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity 1</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity 2</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name 3</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity 3</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name 4</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity 4</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name 5</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity 5</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Call Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Call Time</th>
                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryFollowUps.length > 0 ? (
                        filteredHistoryFollowUps.map((followUp, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{followUp.leadNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.customerSay}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.enquiryReceivedStatus}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.enquiryReceivedDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.enquiryState}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.projectName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.salesType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.requiredProductDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.projectApproxValue}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.itemName1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.quantity1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.itemName2}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.quantity2}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.itemName3}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.quantity3}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.itemName4}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.quantity4}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.itemName5}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.quantity5}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.nextAction}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.nextCallDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{followUp.nextCallTime}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {/* <Link to={`/follow-up/${followUp.leadNo}`}>
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
                          <td colSpan={24} className="px-6 py-4 text-center text-sm text-slate-500">No history found</td>
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

export default FollowUp