import { useState, useEffect } from "react"

function OrderExpectedForm({ formData, onFieldChange }) {
  const [followupStatusOptions, setFollowupStatusOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch dropdown options from DROPDOWN sheet column 81
  useEffect(() => {
    const fetchFollowupStatusOptions = async () => {
      try {
        setIsLoading(true)
        
        // Fetch data from DROPDOWN sheet
        const dropdownUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const response = await fetch(dropdownUrl)
        const text = await response.text()
        
        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)
        
        const data = JSON.parse(jsonData)
        
        // Extract column 81 values (skip header row)
        if (data && data.table && data.table.rows) {
          const options = []
          
          // Skip the header row (index 0)
          data.table.rows.slice(0).forEach(row => {
            // Column 81 is index 80 (0-based indexing)
            if (row.c && row.c[80] && row.c[80].v) {
              options.push(row.c[80].v)
            }
          })
          
          setFollowupStatusOptions(options)
        }
      } catch (error) {
        console.error("Error fetching followup status options:", error)
        // Fallback options if fetch fails
        setFollowupStatusOptions(["Pending", "In Progress", "Completed", "Cancelled"])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchFollowupStatusOptions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Expected</h3>
      <hr className="border-gray-200 mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="followupStatus" className="block text-sm font-medium text-gray-700">
            Followup Status
          </label>
          <select
            id="followupStatus"
            name="followupStatus"
            value={formData.followupStatus || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            disabled={isLoading}
          >
            <option value="">
              {isLoading ? "Loading..." : "Select followup status"}
            </option>
            {followupStatusOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="nextCallDate" className="block text-sm font-medium text-gray-700">
            Next Call Date
          </label>
          <input
            id="nextCallDate"
            name="nextCallDate"
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.nextCallDate || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="nextCallTime" className="block text-sm font-medium text-gray-700">
            Next Call Time
          </label>
          <input
            id="nextCallTime"
            name="nextCallTime"
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.nextCallTime || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>
    </div>
  )
}

export default OrderExpectedForm