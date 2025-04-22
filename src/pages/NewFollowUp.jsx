"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../App"

function NewFollowUp() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get("leadId")
  const leadNo = searchParams.get("leadNo")
  const { showNotification } = useContext(AuthContext)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enquiryStatus, setEnquiryStatus] = useState("")
  const [items, setItems] = useState([{ id: "1", name: "", quantity: "" }])
  const [formData, setFormData] = useState({
    leadNo: "",
    nextAction: "",
    nextCallDate: "",
    nextCallTime: "",
    customerFeedback: ""
  })
  const [leadStatus, setLeadStatus] = useState("")

  // New state for dropdown options
  const [enquiryStates, setEnquiryStates] = useState([])
  const [salesTypes, setSalesTypes] = useState([])

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
      
      // Extract columns C and D (if this structure doesn't match, you may need to adjust)
      if (data && data.table && data.table.rows) {
        const states = []
        const types = []
        
        // Skip the first row (index 0) which contains headers
        data.table.rows.slice(1).forEach(row => {
          // Column C (enquiry states) - skip empty values
          if (row.c && row.c[2] && row.c[2].v) {
            states.push(row.c[2].v.toString())
          }
          
          // Column D (sales types) - skip empty values
          if (row.c && row.c[3] && row.c[3].v) {
            types.push(row.c[3].v.toString())
          }
        })
        
        setEnquiryStates(states)
        setSalesTypes(types)
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback to default values if needed
      setEnquiryStates(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi"])
      setSalesTypes(["NBD", "CRR", "NBD_CRR"])
    }
  }

  useEffect(() => {
    // Fetch dropdown data when component mounts
    fetchDropdownData()

    // Prepopulate lead number if available
    if (leadNo) {
      setFormData(prevData => ({
        ...prevData,
        leadNo: leadNo
      }))
    }
  }, [leadNo])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const currentDate = new Date()
      const formattedDate = formatDate(currentDate)
      
      // Prepare base row data (columns A-E)
      let rowData = [
        formattedDate,               // A: Current date
        formData.leadNo,              // B: Lead Number
        document.getElementById("customerFeedback").value,  // C: Customer feedback
        leadStatus,                   // D: Hot/Cold/Warm status
        enquiryStatus                 // E: Enquiry Status
      ]
      
      // Handle different scenarios
      if (enquiryStatus === "expected") {
        // Explicitly add columns F-K as empty (6 empty columns)
        rowData.push("", "", "", "", "", "","", "", "", "", "", "","","","","")
        
        // Then add columns V, W, X
        rowData.push(
          document.getElementById("nextAction").value,      // V: Next action
          document.getElementById("nextCallDate").value,    // W: Next call date
          document.getElementById("nextCallTime").value     // X: Next call time
        )
      } else if (enquiryStatus === "yes") {
        // Add columns F-K
        rowData.push(
          document.getElementById("enquiryDate").value,     // F: Enquiry Received Date
          document.getElementById("enquiryState").value,    // G: Enquiry for State
          document.getElementById("projectName").value,     // H: Project Name
          document.getElementById("salesType").value,       // I: Sales Type
          document.getElementById("requiredDate").value,    // J: Required Product Date
          document.getElementById("projectValue").value     // K: Project Approximate Value
        )
        
        // Add item details
        items.forEach(item => {
          rowData.push(item.name, item.quantity)
        })
      } else if (enquiryStatus === "not-interested") {
        // Pad columns F-K and then V-X with empty values
        rowData.push("", "", "", "", "", "", "", "", "")
      }
      
      console.log("Row Data to be submitted:", rowData);
      
      // Script URL - replace with your Google Apps Script URL
      const scriptUrl = "https://script.google.com/macros/s/AKfycbxeo5tv3kAcSDDAheOCP07HaK76zSfq49jFGtZknseg7kPlj2G1O8U2PuiA2fQSuPvKqA/exec"
      
      // Parameters for Google Apps Script
      const params = {
        sheetName: "Leads Tracker",
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
        showNotification("Follow-up recorded successfully", "success")
        navigate("/follow-up")
      } else {
        showNotification("Error recording follow-up: " + (result.error || "Unknown error"), "error")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      showNotification("Error submitting form: " + error.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const addItem = () => {
    const newId = (items.length + 1).toString()
    setItems([...items, { id: newId, name: "", quantity: "" }])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">New Follow-Up</h2>
          <p className="text-sm text-slate-500">
            Record details of the follow-up call
            {leadId && <span className="font-medium"> for Lead #{leadId}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Lead No.
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="LD-001"
                value={formData.leadNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customerFeedback" className="block text-sm font-medium text-gray-700">
                What did the customer say?
              </label>
              <textarea
                id="customerFeedback"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                placeholder="Enter customer feedback"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lead Status</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="hot"
                    name="leadStatus"
                    value="hot"
                    checked={leadStatus === "hot"}
                    onChange={() => setLeadStatus("hot")}
                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="hot" className="text-sm text-gray-700">
                    Hot
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="warm"
                    name="leadStatus"
                    value="warm"
                    checked={leadStatus === "warm"}
                    onChange={() => setLeadStatus("warm")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="warm" className="text-sm text-gray-700">
                    Warm
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cold"
                    name="leadStatus"
                    value="cold"
                    checked={leadStatus === "cold"}
                    onChange={() => setLeadStatus("cold")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cold" className="text-sm text-gray-700">
                    Cold
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Enquiry Received Status</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="yes"
                    name="enquiryStatus"
                    value="yes"
                    checked={enquiryStatus === "yes"}
                    onChange={() => setEnquiryStatus("yes")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="expected"
                    name="enquiryStatus"
                    value="expected"
                    checked={enquiryStatus === "expected"}
                    onChange={() => setEnquiryStatus("expected")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="expected" className="text-sm text-gray-700">
                    Expected
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="not-interested"
                    name="enquiryStatus"
                    value="not-interested"
                    checked={enquiryStatus === "not-interested"}
                    onChange={() => setEnquiryStatus("not-interested")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="not-interested" className="text-sm text-gray-700">
                    Not Interested
                  </label>
                </div>
              </div>
            </div>

            {enquiryStatus === "expected" && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700">
                    Next Action
                  </label>
                  <input
                    id="nextAction"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter next action"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nextCallDate" className="block text-sm font-medium text-gray-700">
                      Next Call Date
                    </label>
                    <input
                      id="nextCallDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="nextCallTime" className="block text-sm font-medium text-gray-700">
                      Next Call Time
                    </label>
                    <input
                      id="nextCallTime"
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {enquiryStatus === "yes" && (
              <div className="space-y-6 border p-4 rounded-md">
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
                    required
                  >
                    <option value="">Select state</option>
                    {enquiryStates.map((state, index) => (
                      <option key={index} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                  <div className="space-y-2">
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                      Project Name
                    </label>
                    <input
                      id="projectName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                  <label htmlFor="salesType" className="block text-sm font-medium text-gray-700">
                    Sales Type
                  </label>
                  <select
                    id="salesType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select type</option>
                    {salesTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                  <div className="space-y-2">
                    <label htmlFor="requiredDate" className="block text-sm font-medium text-gray-700">
                      Required Product Date
                    </label>
                    <input
                      id="requiredDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectValue" className="block text-sm font-medium text-gray-700">
                      Project Approximate Value
                    </label>
                    <input
                      id="projectValue"
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter value"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md"
                    >
                      + Add Item
                    </button>
                  </div>

                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5 space-y-2">
                        <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-gray-700">
                          Item Name
                        </label>
                        <input
                          id={`itemName-${item.id}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Enter item name"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          required
                        />
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
            )}
          </div>
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewFollowUp