import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/lable"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

function UserForm() {
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({})
  
  // New state for application number options and entries
  const [applicationNumbers, setApplicationNumbers] = useState([])
  const [applicationEntries, setApplicationEntries] = useState([])

  // Configuration - YOUR SHEET ID
  const SHEET_ID = "16m252lG1dp3B4WKibqowje5xC41XxEnTSmjATCwMl9I"
  const SHEET_NAME = "Data"
  const ENTRY_SHEET_NAME = "ENTRY"
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxI9XSK_4Pxo7TR44mv73s52wzjuTW2vIhXoFofD3vOJssERBILxaKyfFkr4zD8zsEA/exec"

  // Fetch headers and application numbers
  useEffect(() => {
    const fetchHeadersAndApplicationNumbers = async () => {
      try {
        setLoading(true)
        
        // Fetch headers from main sheet
        const headersUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&range=1:1`
        const entriesUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(ENTRY_SHEET_NAME)}`
        
        // Fetch headers
        const headersResponse = await fetch(headersUrl)
        const headersText = await headersResponse.text()
        
        const jsonHeadersStart = headersText.indexOf('{')
        const jsonHeadersEnd = headersText.lastIndexOf('}') + 1
        const jsonHeadersText = headersText.slice(jsonHeadersStart, jsonHeadersEnd)
        
        const jsonHeadersData = JSON.parse(jsonHeadersText)
        
        // Extract headers
        const extractedHeaders = jsonHeadersData.table.rows[0].c
          .filter(cell => cell && cell.v !== null)
          .map(cell => String(cell.v))
        
        setHeaders(extractedHeaders)
        
        // Initialize form data with empty values
        const initialFormData = {}
        extractedHeaders.forEach(header => {
          initialFormData[header] = ""
        })
        setFormData(initialFormData)
        
        // Fetch entries from ENTRY sheet
        const entriesResponse = await fetch(entriesUrl)
        const entriesText = await entriesResponse.text()
        
        const jsonEntriesStart = entriesText.indexOf('{')
        const jsonEntriesEnd = entriesText.lastIndexOf('}') + 1
        const jsonEntriesText = entriesText.slice(jsonEntriesStart, jsonEntriesEnd)
        
        const jsonEntriesData = JSON.parse(jsonEntriesText)
        
        // Log the entire row data for debugging
        console.log("Full Entries Data:", jsonEntriesData.table.rows)
        
        // Extract application numbers from column B of ENTRY sheet
        const applicationNumberEntries = jsonEntriesData.table.rows
          .slice(1) // Skip header row
          .map(row => {
            // Carefully check the column index for Application No.
            // Assuming Application No. is in the exact column B (index 1)
            const appNoCell = row.c && row.c[1]
            return appNoCell && appNoCell.v ? String(appNoCell.v) : null
          })
          .filter(Boolean)
        
        console.log("Extracted Application Numbers:", applicationNumberEntries)
        
        const uniqueApplicationNumbers = [...new Set(applicationNumberEntries)];
        setApplicationNumbers(uniqueApplicationNumbers);
        
        // Store full entries for auto-fill
        const fullEntries = jsonEntriesData.table.rows.slice(1).map(row => {
          const entry = {}
          row.c.forEach((cell, index) => {
            // Use column labels from the sheet
            entry[jsonEntriesData.table.cols[index].label] = cell ? cell.v : null
          })
          return entry
        })
        
        setApplicationEntries(fullEntries)
        
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHeadersAndApplicationNumbers()
  }, [SHEET_ID, SHEET_NAME, ENTRY_SHEET_NAME])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplicationNumberChange = (applicationNumber) => {
    // Find the corresponding entry
    const selectedEntry = applicationEntries.find(
      entry => String(entry['Application No']) === applicationNumber
    )
    
    if (selectedEntry) {
      // Create a new form data object
      const newFormData = { ...formData }
      
      // Set the Application No. 
      const applicationNoHeader = headers.find(h => h.toLowerCase() === 'application no')
      if (applicationNoHeader) {
        newFormData[applicationNoHeader] = applicationNumber
      }
      
      // Auto-fill fields from the selected entry
      headers.forEach(header => {
        // Skip setting Application No. again
        if (header.toLowerCase() === 'application no') return
        
        // Find a matching header in the entry
        const matchingEntryKey = Object.keys(selectedEntry).find(
          key => key.toLowerCase() === header.toLowerCase()
        )
        
        if (matchingEntryKey) {
          newFormData[header] = String(selectedEntry[matchingEntryKey] || '')
        }
      })
      
      setFormData(newFormData)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Convert formData object to array in the order of headers
      const rowData = headers.map(header => formData[header] || "")
      
      // Prepare the form data for submission
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("sheetName", SHEET_NAME)
      formDataToSubmit.append("action", "insert")
      formDataToSubmit.append("rowData", JSON.stringify(rowData))
      
      console.log("Submitting data:", {
        sheetName: SHEET_NAME,
        action: "insert",
        rowData: rowData
      })
      
      // Submit to Google Apps Script
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formDataToSubmit,
        mode: "no-cors" // Required for Google Apps Script
      })
      
      console.log("Form submitted")
      setFormSubmitted(true)
    } catch (err) {
      console.error("Error submitting form:", err)
      alert("There was an error submitting the form. Please try again.")
    }
  }

  // Determine the type of input field based on the header name
  const getInputField = (header) => {
    // If the header is 'Application No.', create a dropdown
    if (header.toLowerCase() === 'application no') {
      return (
        <Select 
          onValueChange={(value) => {
            handleApplicationNumberChange(value)
          }} 
          value={formData[header] || ""}
        >
          <SelectTrigger className="w-full border border-gray-300 bg-white text-gray-900">
            <SelectValue placeholder="Select Application Number" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-300 shadow-lg">
          {applicationNumbers.map((appNo, index) => (
  <SelectItem 
    key={`${appNo}-${index}`}
    value={appNo}
    className="hover:bg-gray-100 cursor-pointer"
  >
    {appNo}
  </SelectItem>
))}
          </SelectContent>
        </Select>
      )
    }

    // Rest of the input field logic remains the same as in the previous implementation
    const lowerHeader = String(header).toLowerCase()
    
    // Special case for Date
    if (lowerHeader.includes("date") || lowerHeader.includes("timestamp")) {
      return (
        <Input
          id={header}
          name={header}
          type="date"
          placeholder={`Enter ${header}`}
          value={formData[header] || ""}
          onChange={handleChange}
          required
        />
      )
    }
    
    // Special case for gender field
    if (lowerHeader.includes("gender")) {
      return (
        <Select 
          onValueChange={(value) => handleSelectChange(header, value)} 
          value={formData[header] || ""}
        >
          <SelectTrigger className="w-full border border-gray-300 bg-white text-gray-900">
            <SelectValue placeholder={`Select ${header}`} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-300 shadow-lg">
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    
    // Fields that might be better as textareas
    if (lowerHeader.includes("address") || 
        lowerHeader.includes("message") || 
        lowerHeader.includes("description") || 
        lowerHeader.includes("comment")) {
      return (
        <Textarea
          id={header}
          name={header}
          placeholder={`Enter ${header}`}
          value={formData[header] || ""}
          onChange={handleChange}
          required={!lowerHeader.includes("message")} // Messages often optional
        />
      )
    }
    
    // Email field
    if (lowerHeader.includes("email")) {
      return (
        <Input
          id={header}
          name={header}
          type="email"
          placeholder={`Enter ${header}`}
          value={formData[header] || ""}
          onChange={handleChange}
          required
        />
      )
    }
    
    // Phone field
    if (lowerHeader.includes("phone")) {
      return (
        <Input
          id={header}
          name={header}
          type="tel"
          placeholder={`Enter ${header}`}
          value={formData[header] || ""}
          onChange={handleChange}
          required
        />
      )
    }
    
    // Number fields
    if (
      lowerHeader.includes("number") || 
      lowerHeader.includes("amount") || 
      lowerHeader.includes("price") ||
      lowerHeader.includes("year") ||
      !isNaN(header) // If header is a number
    ) {
      return (
        <Input
          id={header}
          name={header}
          type="number"
          placeholder={`Enter ${header}`}
          value={formData[header] || ""}
          onChange={handleChange}
          required
        />
      )
    }
    
    // Default to a standard text input
    return (
      <Input
        id={header}
        name={header}
        placeholder={`Enter ${header}`}
        value={formData[header] || ""}
        onChange={handleChange}
        required
      />
    )
  }

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Loading Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>Loading form fields from your Google Sheet...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Error Loading Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>There was an error loading the form: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (formSubmitted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Submission Successful</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p>Thank you for your submission!</p>
            <Button onClick={() => setFormSubmitted(false)}>Submit Another Response</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Booking Form</CardTitle>
        <CardDescription className="text-center">Please fill out the form below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {headers.map((header) => (
            <div key={header} className="space-y-2">
              <Label htmlFor={header}>{header}</Label>
              {getInputField(header)}
            </div>
          ))}

          <Button type="submit" className="w-full bg-black text-white">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default UserForm