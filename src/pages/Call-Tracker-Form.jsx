"use client"

import { useState, useEffect } from "react"

const CallTrackerForm = ({ onClose = () => window.history.back() }) => {
  const [leadSources, setLeadSources] = useState([])
  const [scNameOptions, setScNameOptions] = useState([]) // Added SC Name options
  const [enquiryStates, setEnquiryStates] = useState([])
  const [nobOptions, setNobOptions] = useState([])
  const [salesTypes, setSalesTypes] = useState([])
  const [enquiryApproachOptions, setEnquiryApproachOptions] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})
  const [lastEnquiryNo, setLastEnquiryNo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiverOptions, setReceiverOptions] = useState([])
const [assignToProjectOptions, setAssignToProjectOptions] = useState([])

  const [newCallTrackerData, setNewCallTrackerData] = useState({
    enquiryNo: "Will be generated on submit", // Changed from "" to placeholder
    leadSource: "",
    scName: "", // Added SC Name field
    companyName: "",
    phoneNumber: "",
    salesPersonName: "",
    location: "",
    emailAddress: "",
    shippingAddress: "",
    enquiryReceiverName: "",
    enquiryAssignToProject: "",
    gstNumber: "",
    isCompanyAutoFilled: true // Added to track auto-fill status
  })

  const [enquiryFormData, setEnquiryFormData] = useState({
    enquiryDate: "",
    enquiryState: "",
    projectName: "",
    salesType: "",
    enquiryApproach: "",
  })

  const [items, setItems] = useState([{ id: "1", name: "", quantity: "" }])
  const [isCompanyAutoFilled, setIsCompanyAutoFilled] = useState(false);

  const [expectedFormData, setExpectedFormData] = useState({
    nextAction: "",
    nextCallDate: "",
    nextCallTime: "",
  })

  // Fetch dropdown data and company data when component mounts - REMOVED fetchLastEnquiryNumber
  useEffect(() => {
    fetchDropdownData()
    fetchCompanyData()
    // Removed: fetchLastEnquiryNumber()
  }, [])

  // Function to get and reserve next enquiry number atomically
  const getAndReserveNextEnquiryNumber = async () => {
    console.log('React: getAndReserveNextEnquiryNumber called at:', new Date());
    
    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec";
      const params = {
        action: "getAndReserveNextEnquiryNumber",
        sheetName: "ENQUIRY TO ORDER",
      };
  
      console.log('React: Sending request with params:', params);
  
      const urlParams = new URLSearchParams();
      for (const key in params) {
        urlParams.append(key, params[key]);
      }
  
      console.log('React: Making fetch request...');
      
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams,
      });
  
      console.log('React: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('React: Response result:', result);
      
      if (result.success) {
        console.log('React: Successfully got enquiry number:', result.enquiryNumber);
        return result.enquiryNumber;
      } else {
        console.error('React: Server returned error:', result.error);
        throw new Error(result.error || "Failed to get enquiry number");
      }
    } catch (error) {
      console.error("React: Error getting next enquiry number:", error);
      throw error;
    }
  };
  

  // Function to fetch dropdown data from DROPDOWN sheet with updated column references
  const fetchDropdownData = async () => {
    try {
      const publicUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
      
      const response = await fetch(publicUrl)
      const text = await response.text()
      
      const jsonStart = text.indexOf('{')
      const jsonEnd = text.lastIndexOf('}') + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        const sources = []        // Column B (Lead Sources)
        const scNames = []        // Column AK (SC Name Options) - index 36
        const states = []         // Column C (Enquiry States)
        const salesTypeOptions = [] // Column D (Sales Types)
        const productItems = []   // Column AJ (index 35) - Product Categories
        const nobItems = []       // Column AL (index 37) - NOB Options
        const approachOptions = [] // Column AM (index 38) - Enquiry Approach
        const receivers = []      // Column BW (index 74) - Enquiry Receiver Name Options
        const assignToProjects = [] // Column BX (index 75) - Enquiry Assign to Project Options
        
        // Skip the header row
        data.table.rows.slice(0).forEach(row => {
          if (row.c) {
            // Column B (Lead Sources)
            if (row.c[1] && row.c[1].v) {
              sources.push(row.c[1].v.toString())
            }
            
            // Column AK (SC Name Options) - index 36
            if (row.c[36] && row.c[36].v) {
              scNames.push(row.c[36].v.toString())
            }
            
            // Column C (Enquiry States)
            if (row.c[2] && row.c[2].v) {
              states.push(row.c[2].v.toString())
            }
            
            // Column D (Sales Types)
            if (row.c[3] && row.c[3].v) {
              salesTypeOptions.push(row.c[3].v.toString())
            }
            
            // Column AJ (Product Categories) - index 35
            if (row.c[76] && row.c[76].v) {
              productItems.push(row.c[76].v.toString())
            }
            
            // Column AL (NOB Options) - index 37
            if (row.c[37] && row.c[37].v) {
              nobItems.push(row.c[37].v.toString())
            }
            
            // Column AM (Enquiry Approach) - index 38
            if (row.c[38] && row.c[38].v) {
              approachOptions.push(row.c[38].v.toString())
            }
            
            // Column BW (Enquiry Receiver Name) - index 74
            if (row.c[74] && row.c[74].v) {
              receivers.push(row.c[74].v.toString())
            }
            
            // Column BX (Enquiry Assign to Project) - index 75
            if (row.c[75] && row.c[75].v) {
              assignToProjects.push(row.c[75].v.toString())
            }
          }
        })
        
        // Update state with fetched values (using unique values to prevent duplicates)
        setLeadSources([...new Set(sources.filter(Boolean))])
        setScNameOptions([...new Set(scNames.filter(Boolean))]) // Added SC Name options
        setEnquiryStates([...new Set(states.filter(Boolean))])
        setSalesTypes([...new Set(salesTypeOptions.filter(Boolean))])
        setProductCategories([...new Set(productItems.filter(Boolean))])
        setNobOptions([...new Set(nobItems.filter(Boolean))])
        setEnquiryApproachOptions([...new Set(approachOptions.filter(Boolean))])
        setReceiverOptions([...new Set(receivers.filter(Boolean))])
        setAssignToProjectOptions([...new Set(assignToProjects.filter(Boolean))])
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to empty arrays if there's an error
      setLeadSources(["Website", "Justdial", "Sulekha", "Indiamart", "Referral", "Other"])
      setScNameOptions(["SC 1", "SC 2", "SC 3"]) // Added fallback for SC Name
      setEnquiryStates(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi"])
      setNobOptions(["NOB 1", "NOB 2", "NOB 3"])
      setSalesTypes(["NBD", "CRR", "NBD_CRR"])
      setEnquiryApproachOptions(["Approach 1", "Approach 2", "Approach 3"])
      setProductCategories(["Product 1", "Product 2", "Product 3"])
      setReceiverOptions(["Receiver 1", "Receiver 2", "Receiver 3"])
      setAssignToProjectOptions(["Project 1", "Project 2", "Project 3"])
    }
  }

  // Function to fetch company data
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
          // Column AX for company name
          if (row.c && row.c[49] && row.c[49].v !== null) {
            const companyName = row.c[49].v.toString()
            companies.push(companyName)
            
            // Store company details for auto-fill
            detailsMap[companyName] = {
              phoneNumber: (row.c[51] && row.c[51].v !== null) ? row.c[51].v.toString() : "", // Column AZ
              salesPerson: (row.c[50] && row.c[50].v !== null) ? row.c[50].v.toString() : "", // Column AY
              gstNumber: (row.c[53] && row.c[53].v !== null) ? row.c[53].v.toString() : "", // Column BB
              billingAddress: (row.c[54] && row.c[54].v !== null) ? row.c[54].v.toString() : "", // Column BC
              // shippingAddress: (row.c[55] && row.c[55].v !== null) ? row.c[55].v.toString() : "", // Column BD
              // enquiryReceiverName: (row.c[56] && row.c[56].v !== null) ? row.c[56].v.toString() : "", // Column BE
              // enquiryAssignToProject: (row.c[57] && row.c[57].v !== null) ? row.c[57].v.toString() : "" // Column BF
            }
          }
        })
        
        setCompanyOptions(companies)
        setCompanyDetailsMap(detailsMap)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
      setCompanyOptions([])
      setCompanyDetailsMap({})
    }
  }

  // Handle company name change and auto-fill other fields
  const handleCompanyChange = (companyName) => {
    const isAutoFilled = true
    setNewCallTrackerData(prev => ({
      ...prev,
      companyName: companyName,
      isCompanyAutoFilled: true // Set to true when a company is selected
    }));

    // Auto-fill related fields if company is selected
    if (companyName) {
      const companyDetails = companyDetailsMap[companyName] || {}
      setNewCallTrackerData(prev => ({
        ...prev,
        phoneNumber: companyDetails.phoneNumber || "",
        salesPersonName: companyDetails.salesPerson || "",
        location: companyDetails.billingAddress || "",
        gstNumber: companyDetails.gstNumber || "",
        shippingAddress: companyDetails.shippingAddress || "",
        enquiryReceiverName: companyDetails.enquiryReceiverName || "",
        enquiryAssignToProject: companyDetails.enquiryAssignToProject || "",
        isCompanyAutoFilled: isAutoFilled
      }))
    }
  }

  // Function to handle adding a new item
  const addItem = () => {
    if (items.length < 300) { // Only add if less than 10 items
      const newId = (items.length + 1).toString()
      setItems([...items, { id: newId, name: "", quantity: "" }])
    }
  }

  // Function to handle removing an item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  // Function to update an item
  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""

    try {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      }
      return dateValue
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  const calculateTotalQuantity = () => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0
      return total + quantity
    }, 0)
  }

  // UPDATED handleSubmit function - gets enquiry number only on submission
// Complete handleSubmit function - replace your existing handleSubmit function with this:

const handleSubmit = async () => {
  setIsSubmitting(true)
  console.log('Form submission started at:', new Date());
  
  try {
    console.log('Getting fresh enquiry number...');
    // Get a fresh enquiry number at submission time to ensure uniqueness
    const enquiryNumber = await getAndReserveNextEnquiryNumber();
    console.log('Got enquiry number:', enquiryNumber);
    
    const currentDate = new Date()
    const formattedDate = formatDateToDDMMYYYY(currentDate)

    // Prepare base row data (columns A-E) - use the fresh enquiry number
    const rowData = [
      formattedDate, // A: Current date
      enquiryNumber, // B: Lead Number - use fresh number instead of newCallTrackerData.enquiryNo
      newCallTrackerData.leadSource, // C: Lead Source
      newCallTrackerData.companyName,
      newCallTrackerData.phoneNumber, // G: Phone Number
      newCallTrackerData.salesPersonName, // H: Sales Person Name
      newCallTrackerData.location, // I: Location
      newCallTrackerData.emailAddress, // J: Email Address
      newCallTrackerData.shippingAddress, // K: Shipping Address
      newCallTrackerData.enquiryReceiverName, // L: Enquiry Receiver Name
      newCallTrackerData.enquiryAssignToProject, // M: Enquiry Assign to Project
      newCallTrackerData.gstNumber, // N: GST Number
    ]

    // Add columns O-S for the enquiry form data
    rowData.push(
      enquiryFormData.enquiryDate ? formatDateToDDMMYYYY(enquiryFormData.enquiryDate) : "", // O: Enquiry Received Date
      enquiryFormData.enquiryState, // P: Enquiry for State
      enquiryFormData.projectName, // Q: Project Name (NOB)
      enquiryFormData.salesType, // R: Sales Type
      enquiryFormData.enquiryApproach, // S: Enquiry Approach
    )

    // Handle first 10 items (columns T-AC)
    const first10Items = items.slice(0, 10)
    
    // Add first 10 items in pairs (name, quantity)
    first10Items.forEach((item) => {
      rowData.push(item.name || "") // Product name
      rowData.push(item.quantity || "0") // Quantity (0 if null/empty)
    })

    // If less than 10 items, fill remaining slots with empty values
    const remainingSlots = 10 - first10Items.length
    for (let i = 0; i < remainingSlots; i++) {
      rowData.push("", "0") // Empty name and 0 quantity
    }

    // Add expected form data
    rowData.push(
      expectedFormData.nextAction || "", // Next Action
      expectedFormData.nextCallDate || "", // Next Call Date
      expectedFormData.nextCallTime || "" // Next Call Time
    )

    // Add empty columns up to column BX (index 75) to place SC Name in the correct position
    // Calculate how many empty columns we need to add to reach column BX
    const currentLength = rowData.length
    const targetIndex = 75 // Column BX is index 75 (0-based)
    
    // Add empty columns if needed
    while (rowData.length < targetIndex) {
      rowData.push("")
    }
    
    // Add SC Name at column BX (index 75)
    rowData.push(newCallTrackerData.scName || "") // BX: SC Name

    // Add empty columns up to column CB (index 81) for additional items JSON
    while (rowData.length < 79) {
      rowData.push("")
    }

    // Handle items 11 and onwards as JSON in column CB (index 81)
    if (items.length > 10) {
      const additionalItems = items.slice(10).map(item => ({
        name: item.name || "",
        quantity: item.quantity || "0"
      }))
      rowData.push(JSON.stringify(additionalItems)) // Column CB
    } else {
      rowData.push("") // Empty if no additional items
    }

    // Add total quantity in column CC (index 82)
    rowData.push(calculateTotalQuantity().toString())

    console.log("Row Data to be submitted:", rowData)
    console.log("Generated Enquiry Number:", enquiryNumber)

    // Submit data to Google Sheets using fetch
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"
    
    // Parameters for Google Apps Script
    const params = {
      sheetName: "ENQUIRY TO ORDER",
      action: "insert",
      rowData: JSON.stringify(rowData)
    }

    // Create URL-encoded string for the parameters
    const urlParams = new URLSearchParams()
    for (const key in params) {
      urlParams.append(key, params[key])
    }
    
    console.log('Submitting data to Google Sheets...');
    
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
      console.log('Form submitted successfully with enquiry number:', enquiryNumber);
      alert(`Data submitted successfully! Enquiry Number: ${enquiryNumber}`)
      onClose() // Close the form after successful submission
    } else {
      console.error('Form submission failed:', result.error);
      alert("Error submitting data: " + (result.error || "Unknown error"))
    }
  } catch (error) {
    console.error("Error submitting form:", error)
    alert("Error submitting form: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">New Call Tracker</h2>
            <button 
              type="button" 
              onClick={() => {
                try {
                  onClose();
                } catch (error) {
                  console.error("Error closing form:", error);
                  // Fallback close method if onClose fails
                  const modal = document.querySelector('.fixed.inset-0');
                  if (modal) {
                    modal.style.display = 'none';
                  }
                }
              }} 
              className="text-gray-500 hover:text-gray-700"
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
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Added Enquiry Number Display */}
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Enquiry Number
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                value={newCallTrackerData.enquiryNo}
                readOnly
                placeholder="Will be generated automatically"
              />
              <p className="text-xs text-gray-500">Enquiry number will be generated when you submit the form</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                Lead Source
              </label>
              <select
                id="leadSource"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.leadSource}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, leadSource: e.target.value })}
                required
              >
                <option value="">Select source</option>
                {leadSources.map((source, index) => (
                  <option key={index} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            {/* Added SC Name field after Lead Source */}
            <div className="space-y-2">
              <label htmlFor="scName" className="block text-sm font-medium text-gray-700">
                SC Name
              </label>
              <select
                id="scName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.scName}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, scName: e.target.value })}
                required
              >
                <option value="">Select SC Name</option>
                {scNameOptions.map((scName, index) => (
                  <option key={index} value={scName}>
                    {scName}
                  </option>
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
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={newCallTrackerData.companyName}
    onChange={(e) => handleCompanyChange(e.target.value)}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Phone number will auto-fill"
                value={newCallTrackerData.phoneNumber}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, phoneNumber: e.target.value })}
                readOnly={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                Person Name
              </label>
              <input
                id="salesPersonName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Sales person name will auto-fill"
                value={newCallTrackerData.salesPersonName}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, salesPersonName: e.target.value })}
                readOnly={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Billing Address
              </label>
              <input
                id="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Location will auto-fill"
                value={newCallTrackerData.location}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, location: e.target.value })}
                readOnly={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="emailAddress"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                placeholder="Email will auto-fill"
                value={newCallTrackerData.emailAddress}
                onChange={(e) => setNewCallTrackerData({ ...newCallTrackerData, emailAddress: e.target.value })}
                readOnly={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
              />
            </div>

            <div className="space-y-2">
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
              Shipping Address
            </label>
            <input
              id="shippingAddress"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter shipping address"
              value={newCallTrackerData.shippingAddress}
              onChange={(e) => setNewCallTrackerData({ 
                ...newCallTrackerData, 
                shippingAddress: e.target.value,
                isCompanyAutoFilled: false // Allow manual editing
              })}
              readOnly={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
            />
          </div>

          <div className="space-y-2">
  <label htmlFor="enquiryReceiverName" className="block text-sm font-medium text-gray-700">
    Enquiry Receiver Name
  </label>
  <select
    id="enquiryReceiverName"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={newCallTrackerData.enquiryReceiverName}
    onChange={(e) => setNewCallTrackerData({ 
      ...newCallTrackerData, 
      enquiryReceiverName: e.target.value,
      isCompanyAutoFilled: false // Allow manual selection
    })}
    disabled={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
  >
    <option value="">Select receiver</option>
    {receiverOptions.map((receiver, index) => (
      <option key={index} value={receiver}>
        {receiver}
      </option>
    ))}
  </select>
</div>

<div className="space-y-2">
  <label htmlFor="enquiryAssignToProject" className="block text-sm font-medium text-gray-700">
    Enquiry Assign to Project
  </label>
  <select
    id="enquiryAssignToProject"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={newCallTrackerData.enquiryAssignToProject}
    onChange={(e) => setNewCallTrackerData({ 
      ...newCallTrackerData, 
      enquiryAssignToProject: e.target.value,
      isCompanyAutoFilled: false // Allow manual selection
    })}
    disabled={isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
  >
    <option value="">Select project</option>
    {assignToProjectOptions.map((project, index) => (
      <option key={index} value={project}>
        {project}
      </option>
    ))}
  </select>
</div>


          <div className="space-y-2">
            <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
              GST Number
            </label>
            <input
              id="gstNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter GST number"
              value={newCallTrackerData.gstNumber}
              onChange={(e) => setNewCallTrackerData({ 
                ...newCallTrackerData, 
                gstNumber: e.target.value,
                isCompanyAutoFilled: false // Allow manual editing
              })}
              readOnly={newCallTrackerData.isCompanyAutoFilled && newCallTrackerData.companyName !== ""}
            />
          </div>

          </div>

          {/* Enquiry Details section */}
          <div className="space-y-6 border p-4 rounded-md mt-4">
            <h3 className="text-lg font-medium">Enquiry Details</h3>
            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-700">
                  Enquiry Received Date
                </label>
                <input
                  id="enquiryDate"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.enquiryDate}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="enquiryState" className="block text-sm font-medium text-gray-700">
                  Enquiry for State
                </label>
                <select
                  id="enquiryState"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.enquiryState}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryState: e.target.value })}
                  required
                >
                  <option value="">Select state</option>
                  {enquiryStates.map((state, index) => (
                    <option key={index} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                  NOB
                </label>
                <select
                  id="projectName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.projectName}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, projectName: e.target.value })}
                  required
                >
                  <option value="">Select NOB</option>
                  {nobOptions.map((nob, index) => (
                    <option key={index} value={nob}>
                      {nob}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="salesType" className="block text-sm font-medium text-gray-700">
                  Enquiry Type
                </label>
                <select
                  id="salesType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.salesType}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, salesType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  {salesTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="enquiryApproach" className="block text-sm font-medium text-gray-700">
                  Enquiry Approach
                </label>
                <select
                  id="enquiryApproach"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.enquiryApproach}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryApproach: e.target.value })}
                  required
                >
                  <option value="">Select approach</option>
                  {enquiryApproachOptions.map((approach, index) => (
                    <option key={index} value={approach}>
                      {approach}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items</h4>
                <button
  type="button"
  onClick={addItem}
  disabled={items.length >= 300}
  className={`px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md ${items.length >= 300 ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  + Add Item {items.length >= 300 ? '(Max reached)' : ''}
</button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5 space-y-2">
  <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-gray-700">
    Item Name
  </label>
  <input
    list={`item-options-${item.id}`}
    id={`itemName-${item.id}`}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
    value={item.name}
    onChange={(e) => updateItem(item.id, "name", e.target.value)}
    required
  />
  <datalist id={`item-options-${item.id}`}>
    {productCategories.map((category, index) => (
      <option key={index} value={category} />
    ))}
  </datalist>
</div>


                  <div className="md:col-span-5 space-y-2">
                    <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      id={`quantity-${item.id}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter quantity"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            type="button"
            onClick={() => {
              try {
                onClose();
              } catch (error) {
                console.error("Error closing form:", error);
                // Fallback close method if onClose fails
                const modal = document.querySelector('.fixed.inset-0');
                if (modal) {
                  modal.style.display = 'none';
                }
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallTrackerForm