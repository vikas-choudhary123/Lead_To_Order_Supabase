"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../App"

function Leads() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    receiverName: "",
    source: "",
    companyName: "",
    phoneNumber: "",
    salespersonName: "",
    location: "",
    email: "",
    contactPersons: [{ name: "", designation: "", number: "" }], // New array for contact persons
    state: "", // New field
    address: "", // New field
    customerRegistrationForm: "", // New field
    creditAccess: "", // New field
    creditDays: "", // New field
    creditLimit: "", // New field
    nob: "", // New field for Nature of Business
    gst: "", // New field for GST
    notes: ""
  })
  const [receiverNames, setReceiverNames] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [companyOptions, setCompanyOptions] = useState([]) // State for company dropdown
  const [companyDetailsMap, setCompanyDetailsMap] = useState({}) // State to store company details
  const [nextLeadNumber, setNextLeadNumber] = useState("")
  const [creditDaysOptions, setCreditDaysOptions] = useState([]) // New state for credit days dropdown
  const [creditLimitOptions, setCreditLimitOptions] = useState([]) // New state for credit limit dropdown
  const { showNotification } = useContext(AuthContext)
  const [designationOptions, setDesignationOptions] = useState([])
  const [nobOptions, setNobOptions] = useState([]) // New state for nature of business dropdown
  const [stateOptions, setStateOptions] = useState([]) 
  
  // Script URL
  const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"

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
        // Fetch company data for dropdown and auto-fill
        await fetchCompanyData()
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
      const publicUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      // The response is a callback with JSON data - extract just the JSON part
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      // Extract columns A, B, C (states), BQ (credit days), BR (credit limit), BV (designations), and AL (nature of business)
      if (data && data.table && data.table.rows) {
        const receivers = []
        const sources = []
        const states = []     // New array for state options
        const creditDays = []
        const creditLimits = []
        const designations = [] // Array for designations
        const nobs = [] // Array for nature of business options
        
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
          
          // Column C (states) - skip empty values
          // Column index 2 (0-based, so C is 2)
          if (row.c && row.c[2] && row.c[2].v) {
            states.push(row.c[2].v.toString())
          }
          
          // Column BQ (credit days) - skip empty values
          // Column index 67 (0-based, so BQ is 67)
          if (row.c && row.c[68] && row.c[68].v) {
            creditDays.push(row.c[68].v.toString())
          }
          
          // Column BR (credit limit) - skip empty values
          // Column index 68 (0-based, so BR is 68)
          if (row.c && row.c[69] && row.c[69].v) {
            creditLimits.push(row.c[69].v.toString())
          }
          
          // Column BV (designations) - skip empty values
          // Column index 73 (0-based, so BV is 73)
          if (row.c && row.c[73] && row.c[73].v) {
            designations.push(row.c[73].v.toString())
          }
          
          // Column AL (nature of business) - skip empty values
          // Column index 37 (0-based, so AL is 37)
          if (row.c && row.c[37] && row.c[37].v) {
            nobs.push(row.c[37].v.toString())
          }
        })
        
        setReceiverNames(receivers)
        setLeadSources(sources)
        setStateOptions(states)     // Set the state options
        setCreditDaysOptions(creditDays)
        setCreditLimitOptions(creditLimits)
        setDesignationOptions(designations) // Set the designation options
        setNobOptions(nobs) // Set the nature of business options
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to default values if needed
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"])
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"])
      setStateOptions(["Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"]) // Default state options
      setCreditDaysOptions(["7 days", "15 days", "30 days", "45 days", "60 days"])
      setCreditLimitOptions(["₹50,000", "₹100,000", "₹500,000", "₹1,000,000"])
      setDesignationOptions(["Manager", "Director", "CEO", "CFO", "Proprietor"]) // Default designations
      setNobOptions(["Manufacturing", "Trading", "Service", "Retail"]) // Default NOB options
    }
  }

  // Function to fetch company data from DROPDOWN sheet
  const fetchCompanyData = async () => {
    try {
      const publicUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        const companies = []
        const detailsMap = {}
        
        // Skip the header row
        data.table.rows.slice(0).forEach(row => {
          // Add null check for row.c[41] and row.c[41].v
          if (row.c && row.c[40] && row.c[40].v !== null) {
            const companyName = row.c[40].v.toString()
            companies.push(companyName)
            
            // Store company details for auto-fill - with null checks for each property
            detailsMap[companyName] = {
              salesPerson: (row.c[41] && row.c[41].v !== null) ? row.c[41].v.toString() : "", 
              phoneNumber: (row.c[42] && row.c[42].v !== null) ? row.c[42].v.toString() : "", 
              email: (row.c[43] && row.c[43].v !== null) ? row.c[43].v.toString() : "",
              location: (row.c[44] && row.c[44].v !== null) ? row.c[44].v.toString() : ""
            }
          }
        })
        
        setCompanyOptions(companies)
        setCompanyDetailsMap(detailsMap)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      // Fallback to empty values
      setCompanyOptions([])
      setCompanyDetailsMap({})
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))

    // Auto-fill related fields if company is selected
    if (id === 'companyName' && value) {
      const companyDetails = companyDetailsMap[value] || {}
      setFormData(prevData => ({
        ...prevData,
        companyName: value,
        phoneNumber: companyDetails.phoneNumber || "",
        salespersonName: companyDetails.salesPerson || "",
        location: companyDetails.location || "",
        email: companyDetails.email || ""
      }))
    }
  }

  // Function to handle change in contact person fields
  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons[index] = {
      ...updatedContactPersons[index],
      [field]: value
    }
    
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  // Function to add a new contact person section (max 3)
  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: "", designation: "", number: "" }]
      })
    }
  }

  // Function to remove a contact person section
  const removeContactPerson = (index) => {
    const updatedContactPersons = [...formData.contactPersons]
    updatedContactPersons.splice(index, 1)
    
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons
    })
  }

  const generateLeadNumber = async () => {
    try {
      // Get the latest lead number from the FMS sheet
      const publicUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=FMS"
      
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
      formData.companyName,
      formData.phoneNumber,
      formData.salespersonName,
      formData.location,
      formData.email,
      formData.state,
      formData.address,
      // Submit each contact person's data individually in separate cells
      formData.contactPersons[0]?.name || "", // First contact person name
      formData.contactPersons[0]?.designation || "", // First contact person designation
      formData.contactPersons[0]?.number || "", // First contact person number
      formData.contactPersons[1]?.name || "", // Second contact person name (if exists)
      formData.contactPersons[1]?.designation || "", // Second contact person designation
      formData.contactPersons[1]?.number || "", // Second contact person number
      formData.contactPersons[2]?.name || "", // Third contact person name (if exists)
      formData.contactPersons[2]?.designation || "", // Third contact person designation
      formData.contactPersons[2]?.number || "", // Third contact person number
"", // Remove nob from here (originally line 30)
  "", // Remove gst from here
  "", // Remove customerRegistrationForm from here
  "", // Remove creditAccess from here
  "", // Remove creditDays from here
  "", // Remove creditLimit from here
  "", // Remove notes from here
    ]
  
      // Add additional columns (W to AC) for the nature of business
      // First, extend the rowData array with empty values to ensure it has enough cells
      // Columns W to AC would be indices 22-28 (if starting from 0)
      while (rowData.length < 27) {
        rowData.push("")
      }
  
      // If NOB (Nature of Business) is filled, add its value to additional columns
      if (formData.nob) {
        // Assuming columns W to AC need the NOB value or related information
        // Columns W to AC correspond to indices 22 to 28 (0-based)
        rowData[20] = formData.nob // Column W
        rowData[21] = formData.gst // Column X
        rowData[22] = formData.customerRegistrationForm // Column Y
        rowData[23] = formData.creditAccess // Column Z
        rowData[24] = formData.creditDays // Column AA
        rowData[25] = formData.creditLimit // Column AB
        rowData[26] = formData.notes // Column AC
        
        // Note: You can customize what goes into each column as needed
        // For example, you might want different transformations of the NOB data
      }
  
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
          companyName: "",
          phoneNumber: "",
          salespersonName: "",
          location: "",
          email: "",
          contactPersons: [{ name: "", designation: "", number: "" }],
          state: "",
          address: "",
          customerRegistrationForm: "",
          creditAccess: "",
          creditDays: "",
          creditLimit: "",
          nob: "",
          gst: "",
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

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
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
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
  list="companyOptions"
  id="companyName"
  value={formData.companyName}
  onChange={handleChange}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
/>
<datalist id="companyOptions">
  {companyOptions.map((company, index) => (
    <option key={index} value={company} />
  ))}
</datalist>

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
                  placeholder="Phone number will auto-fill"
                  // readOnly={formData.companyName !== ""}
                  // required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-medium text-gray-700">
                  Person Name
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Salesperson name will auto-fill"
                  // readOnly={formData.companyName !== ""}
                  // required
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
                  placeholder="Location will auto-fill"
                  // readOnly={formData.companyName !== ""}
                  // required
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
                  placeholder="Email will auto-fill"
                  // readOnly={formData.companyName !== ""}
                />
              </div>

              <div className="space-y-2">
  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
    State
  </label>
  <select
    id="state"
    value={formData.state}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select state</option>
    {stateOptions.map((state, index) => (
      <option key={index} value={state}>{state}</option>
    ))}
  </select>
</div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter complete address"
                rows="2"
                // required
              />
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Contact Person Details</h3>
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Person
                  </button>
                )}
              </div>
              
              {formData.contactPersons.map((person, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Person {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        value={person.name}
                        onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact name"
                        // required
                      />
                    </div>
                    <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Designation</label>
  <select
    value={person.designation}
    onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    required
  >
    <option value="">Select designation</option>
    {designationOptions.map((designation, idx) => (
      <option key={idx} value={designation}>{designation}</option>
    ))}
  </select>
</div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        value={person.number}
                        onChange={(e) => handleContactPersonChange(index, 'number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contact number"
                        // required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
  <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
    Nature of Business (NOB)
  </label>
  <select
    id="nob"
    value={formData.nob}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    // required
  >
    <option value="">Select nature of business</option>
    {nobOptions.map((option, index) => (
      <option key={index} value={option}>{option}</option>
    ))}
  </select>
</div>

              <div className="space-y-2">
                <label htmlFor="gst" className="block text-sm font-medium text-gray-700">
                  GST Number
                </label>
                <input
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GST number"
                  // required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="customerRegistrationForm" className="block text-sm font-medium text-gray-700">
                  Customer Registration Form
                </label>
                <select
                  id="customerRegistrationForm"
                  value={formData.customerRegistrationForm}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditAccess" className="block text-sm font-medium text-gray-700">
                  Credit Access
                </label>
                <select
                  id="creditAccess"
                  value={formData.creditAccess}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // required
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditDays" className="block text-sm font-medium text-gray-700">
                  Credit Days
                </label>
                <select
                  id="creditDays"
                  value={formData.creditDays}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // required={formData.creditAccess === "Yes"}
                  // disabled={formData.creditAccess !== "Yes"}
                >
                  <option value="">Select credit days</option>
                  {creditDaysOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                  Credit Limit
                </label>
                <select
                  id="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // required={formData.creditAccess === "Yes"}
                  // disabled={formData.creditAccess !== "Yes"}
                >
                  <option value="">Select credit limit</option>
                  {creditLimitOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
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