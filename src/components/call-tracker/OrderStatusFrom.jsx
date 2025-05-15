"use client"

import { useState, useEffect } from "react"

function OrderStatusForm({ formData, onFieldChange }) {
  const [orderStatus, setOrderStatus] = useState(formData.orderStatus || "")
  const [acceptanceViaOptions, setAcceptanceViaOptions] = useState([])
  const [paymentModeOptions, setPaymentModeOptions] = useState([])
  const [reasonStatusOptions, setReasonStatusOptions] = useState([])
  const [holdReasonOptions, setHoldReasonOptions] = useState([])
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([])
  const [conveyedOptions, setConveyedOptions] = useState([])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false)
  const [orderVideoError, setOrderVideoError] = useState("")
  const [transportModeOptions, setTransportModeOptions] = useState([])

  // Fetch dropdown options from DROPDOWN sheet
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        setIsLoadingDropdowns(true)
        
        // Fetch data from DROPDOWN sheet
        const dropdownUrl = "https://docs.google.com/spreadsheets/d/1TZVWkmASF7tG-QER17588sl4SvRgY7knFKFDtYFjB0Q/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const response = await fetch(dropdownUrl)
        const text = await response.text()
        
        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)
        
        const data = JSON.parse(jsonData)
        
        if (data && data.table && data.table.rows) {
          // For Acceptance Via options (column H = index 7)
          const acceptanceOptions = []
          // For Payment Mode options (column I = index 8)
          const paymentOptions = []
          // For Reason Status options (column J = index 9)
          const reasonOptions = []
          // For Hold Reason options (column K = index 10)
          const holdOptions = []
          // For Payment Terms options (column BS = index 71)
          const paymentTermsOptions = []
          // For Conveyed options (column BT = index 72)
          const conveyedOptions = []
          // For Transport Mode options (column BN = index 65)
          const transportOptions = []
          
          // Skip the header row (index 0)
          data.table.rows.slice(0).forEach(row => {
            // Extract column H values (index 7)
            if (row.c && row.c[7] && row.c[7].v) {
              acceptanceOptions.push(row.c[7].v)
            }
            
            // Extract column I values (index 8)
            if (row.c && row.c[8] && row.c[8].v) {
              paymentOptions.push(row.c[8].v)
            }
            
            // Extract column J values (index 9)
            if (row.c && row.c[9] && row.c[9].v) {
              reasonOptions.push(row.c[9].v)
            }
            
            // Extract column K values (index 10)
            if (row.c && row.c[10] && row.c[10].v) {
              holdOptions.push(row.c[10].v)
            }
            
            // Extract column BS values (index 71)
            if (row.c && row.c[70] && row.c[70].v) {
              paymentTermsOptions.push(row.c[70].v)
            }
            
            // Extract column BT values (index 72)
            if (row.c && row.c[71] && row.c[71].v) {
              conveyedOptions.push(row.c[71].v)
            }
            
            // Extract column BN values (index 65)
            if (row.c && row.c[65] && row.c[65].v) {
              transportOptions.push(row.c[65].v)
            }
          })
          
          setAcceptanceViaOptions(acceptanceOptions)
          setPaymentModeOptions(paymentOptions)
          setReasonStatusOptions(reasonOptions)
          setHoldReasonOptions(holdOptions)
          setPaymentTermsOptions(paymentTermsOptions)
          setConveyedOptions(conveyedOptions)
          setTransportModeOptions(transportOptions)
        }
      } catch (error) {
        console.error("Error fetching dropdown options:", error)
        // Fallback options if fetch fails
        setAcceptanceViaOptions(["email", "phone", "in-person", "other"])
        setPaymentModeOptions(["cash", "check", "bank-transfer", "credit-card"])
        setReasonStatusOptions(["price", "competitor", "timeline", "specifications", "other"])
        setHoldReasonOptions(["budget", "approval", "project-delay", "reconsideration", "other"])
        setPaymentTermsOptions(["30", "45", "60", "90"])
        setConveyedOptions(["Yes", "No"])
        setTransportModeOptions(["Road", "Air", "Sea", "Rail"])
      } finally {
        setIsLoadingDropdowns(false)
      }
    }
    
    fetchDropdownOptions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  const handleFileChange = (e) => {
    const { name } = e.target
    const file = e.target.files[0]
    
    if (name === "orderVideo" && !file) {
      setOrderVideoError("Order Video is mandatory")
    } else {
      setOrderVideoError("")
    }
    
    if (file) {
      onFieldChange(name, file)
    }
  }

  const handleStatusChange = (status) => {
    setOrderStatus(status)
    onFieldChange('orderStatus', status)
  }

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Status</h3>
      <hr className="border-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="orderStatusQuotationNumber" className="block text-sm font-medium text-gray-700">
            Quotation Number
          </label>
          <input
            id="orderStatusQuotationNumber"
            name="orderStatusQuotationNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter quotation number"
            value={formData.orderStatusQuotationNumber || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Is Order Received? Status</label>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-yes"
              name="orderStatus"
              value="yes"
              checked={orderStatus === "yes"}
              onChange={() => handleStatusChange("yes")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-yes" className="text-sm text-gray-700">
              YES
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-no"
              name="orderStatus"
              value="no"
              checked={orderStatus === "no"}
              onChange={() => handleStatusChange("no")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-no" className="text-sm text-gray-700">
              NO
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-hold"
              name="orderStatus"
              value="hold"
              checked={orderStatus === "hold"}
              onChange={() => handleStatusChange("hold")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-hold" className="text-sm text-gray-700">
              HOLD
            </label>
          </div>
        </div>
      </div>

      {orderStatus === "yes" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Received Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="acceptanceVia" className="block text-sm font-medium text-gray-700">
                Acceptance Via
              </label>
              <select
                id="acceptanceVia"
                name="acceptanceVia"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.acceptanceVia || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select method</option>
                {acceptanceViaOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                name="paymentMode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentMode || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select mode</option>
                {paymentModeOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentTerms || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map((option, index) => (
                  <option key={index} value={option}>{option} days</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
  <label htmlFor="transportMode" className="block text-sm font-medium text-gray-700">
    Transport Mode
  </label>
  <select
    id="transportMode"
    name="transportMode"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={formData.transportMode || ""}
    onChange={handleChange}
  >
    <option value="">Select transport mode</option>
    {transportModeOptions.map((option, index) => (
      <option key={index} value={option.toLowerCase()}>{option}</option>
    ))}
  </select>
</div>

            <div className="space-y-2">
              <label htmlFor="conveyedForRegistration" className="block text-sm font-medium text-gray-700">
                CONVEYED FOR REGISTRATION FORM
              </label>
              <select
                id="conveyedForRegistration"
                name="conveyedForRegistration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.conveyedForRegistration || ""}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                {conveyedOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
  <label htmlFor="orderVideo" className="block text-sm font-medium text-gray-700">
    Order Video (If Order Received)
  </label>
  <select
    id="orderVideo"
    name="orderVideo"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    onChange={handleChange}
  >
    <option value="">Select an option</option>
    <option value="yes">Yes</option>
    <option value="no">No</option>
  </select>
</div>

          <div className="space-y-2">
            <label htmlFor="acceptanceFile" className="block text-sm font-medium text-gray-700">
              Acceptance File Upload
            </label>
            <input
              id="acceptanceFile"
              name="acceptanceFile"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="orderRemark" className="block text-sm font-medium text-gray-700">
              REMARK
            </label>
            <textarea
              id="orderRemark"
              name="orderRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter remarks"
              value={formData.orderRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "no" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Lost Details</h4>

          <div className="space-y-2">
            <label htmlFor="apologyVideo" className="block text-sm font-medium text-gray-700">
              Order Lost Apology Video
            </label>
            <input
              id="apologyVideo"
              name="apologyVideo"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonStatus" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Status
            </label>
            <select
              id="reasonStatus"
              name="reasonStatus"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.reasonStatus || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {reasonStatusOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonRemark" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Remark
            </label>
            <textarea
              id="reasonRemark"
              name="reasonRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter reason remarks"
              value={formData.reasonRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "hold" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Hold Details</h4>

          <div className="space-y-2">
            <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700">
              CUSTOMER ORDER HOLD REASON CATEGORY
            </label>
            <select
              id="holdReason"
              name="holdReason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdReason || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {holdReasonOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="holdingDate" className="block text-sm font-medium text-gray-700">
              HOLDING DATE
            </label>
            <input
              id="holdingDate"
              name="holdingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdingDate || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="holdRemark" className="block text-sm font-medium text-gray-700">
              HOLD REMARK
            </label>
            <textarea
              id="holdRemark"
              name="holdRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter hold remarks"
              value={formData.holdRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderStatusForm