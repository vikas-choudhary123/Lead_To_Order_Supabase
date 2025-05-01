"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../App"

function Leads() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    receiverName: "",
    source: "",
    salesCoordinatorName: "", // New field
    leadAssignTo: "", // New field
    companyName: "",
    phoneNumber: "",
    salespersonName: "",
    location: "",
    email: "",
    notes: ""
  })
  const [receiverNames, setReceiverNames] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [salesCoordinators, setSalesCoordinators] = useState([]) // New state
  const [leadAssignees, setLeadAssignees] = useState([]) // New state
  const [nextLeadNumber, setNextLeadNumber] = useState("")
  const { showNotification } = useContext(AuthContext)
  
  // Script URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"

  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Fetch dropdown data when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch dropdown values from DROPDOWNSHEET
        await fetchDropdownData()
      } catch (error) {
        console.error("Error during initial data fetch:", error)
      }
    }
    
    fetchInitialData()
  }, [])

  // Function to fetch dropdown data from DROPDOWNSHEET
  const fetchDropdownData = async () => {
    try {
      // Call the Google Apps Script with query parameters to get public access to the DROPDOWNSHEET
      const publicUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      // The response is a callback with JSON data - extract just the JSON part
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      // Extract columns A, B, AK (column 36), and AI (column 34)
      if (data && data.table && data.table.rows) {
        const receivers = []
        const sources = []
        const coordinators = []
        const assignees = []
        
        // Skip the first row (index 0) which contains headers
        data.table.rows.slice(0).forEach(row => {
          // Column A (receivers) - skip empty values
          if (row.c && row.c[0] && row.c[0].v) {
            receivers.push(row.c[0].v.toString())
          }
          
          // Column B (sources) - skip empty values
          if (row.c && row.c[1] && row.c[1].v) {
            sources.push(row.c[1].v.toString())
          }
          
          // Column AK (sales coordinators) - skip empty values
          // Column index 36 (0-based, so AK is 36)
          if (row.c && row.c[36] && row.c[36].v) {
            coordinators.push(row.c[36].v.toString())
          }
          
          // Column AI (lead assignees) - skip empty values
          // Column index 34 (0-based, so AI is 34)
          if (row.c && row.c[34] && row.c[34].v) {
            assignees.push(row.c[34].v.toString())
          }
        })
        
        setReceiverNames(receivers)
        setLeadSources(sources)
        setSalesCoordinators(coordinators)
        setLeadAssignees(assignees)
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to default values if needed
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
      setSalesCoordinators(["Coordinator 1", "Coordinator 2", "Coordinator 3"])
      setLeadAssignees(["Assignee 1", "Assignee 2", "Assignee 3"])
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  const generateLeadNumber = async () => {
    try {
      // Get the latest lead number from the FMS sheet
      const publicUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=FMS"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      // Extract the JSON part
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      // Default to LD-001 if no data exists
      if (!data || !data.table || !data.table.rows || data.table.rows.length === 0) {
        return "LD-001"
      }
      
      // Find the last non-empty lead number in column B (index 1)
      let lastLeadNumber = null
      for (let i = data.table.rows.length - 1; i >= 0; i--) {
        const row = data.table.rows[i]
        if (row.c && row.c[1] && row.c[1].v) {
          const cellValue = row.c[1].v.toString()
          if (cellValue.startsWith("LD-")) {
            lastLeadNumber = cellValue
            break
          }
        }
      }
      
      // If no lead number found, start with LD-001
      if (!lastLeadNumber) {
        return "LD-001"
      }
      
      // Extract the numeric part and increment
      const match = lastLeadNumber.match(/LD-(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1], 10)
        const nextNumber = lastNumber + 1
        return `LD-${String(nextNumber).padStart(3, '0')}`
      } else {
        return "LD-001"
      }
    } catch (error) {
      console.error("Error generating lead number:", error)
      return "LD-001" // Default if we can't determine
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Format current date as dd/mm/yyyy
      const formattedDate = formatDate(new Date())
      
      // Generate the next lead number at submission time
      const leadNumber = await generateLeadNumber()
      
      // Convert form data to array format for Google Sheets
      const rowData = [
        formattedDate, // Date in dd/mm/yyyy format
        leadNumber, // Generated lead number based on current sheet data
        formData.receiverName,
        formData.source,
        formData.salesCoordinatorName, // New field
        formData.leadAssignTo, // New field
        formData.companyName,
        formData.phoneNumber,
        formData.salespersonName,
        formData.location,
        formData.email,
        formData.notes,
      ]

      // Parameters for Google Apps Script
      const params = {
        sheetName: "FMS",
        action: "insert",
        rowData: JSON.stringify(rowData)
      }

      // Create URL-encoded string for the parameters
      const urlParams = new URLSearchParams()
      for (const key in params) {
        urlParams.append(key, params[key])
      }
      
      // Send the data
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlParams
      })

      const result = await response.json()
      
      if (result.success) {
        showNotification("Lead created successfully", "success")
        
        // Reset form
        setFormData({
          receiverName: "",
          source: "",
          salesCoordinatorName: "",
          leadAssignTo: "",
          salespersonName: "",
          phoneNumber: "",
          companyName: "",
          location: "",
          email: "",
          notes: ""
        })
      } else {
        showNotification("Error creating lead: " + (result.error || "Unknown error"), "error")
      }
    } catch (error) {
      showNotification("Error submitting form: " + error.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lead Management
          </h1>
          <p className="text-slate-600 mt-1">Enter the details of the new lead</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">New Lead</h2>
          <p className="text-sm text-slate-500">Fill in the lead information below</p>
          {nextLeadNumber && (
            <p className="text-sm font-medium text-blue-600 mt-1">
              Next Lead Number: {nextLeadNumber}
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                  Lead Receiver Name
                </label>
                <select
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select receiver</option>
                  {receiverNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Lead Source
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select source</option>
                  {leadSources.map((source, index) => (
                    <option key={index} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="salesCoordinatorName" className="block text-sm font-medium text-gray-700">
                  Sales Co-ordinator Name
                </label>
                <select
                  id="salesCoordinatorName"
                  value={formData.salesCoordinatorName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select sales coordinator</option>
                  {salesCoordinators.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="leadAssignTo" className="block text-sm font-medium text-gray-700">
                  Lead Assign To
                </label>
                <select
                  id="leadAssignTo"
                  value={formData.leadAssignTo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select assignee</option>
                  {leadAssignees.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-medium text-gray-700">
                  Salesperson Name
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter salesperson name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <input
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional information"
              />
            </div>
          </div>
          <div className="p-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Leads