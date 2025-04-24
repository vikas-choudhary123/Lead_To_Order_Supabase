import { useState, useEffect } from "react"

function QuotationValidationForm({ formData, onFieldChange }) {
  const [sendStatusOptions, setSendStatusOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch dropdown options from DROPDOWN sheet column F
  useEffect(() => {
    const fetchSendStatusOptions = async () => {
      try {
        setIsLoading(true)
        
        // Fetch data from DROPDOWN sheet
        const dropdownUrl = "https://docs.google.com/spreadsheets/d/14n58u8M3NYiIjW5vT_dKrugmWwOiBsk-hnYB4e3Oyco/gviz/tq?tqx=out:json&sheet=DROPDOWN"
        const response = await fetch(dropdownUrl)
        const text = await response.text()
        
        // Extract the JSON part from the response
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}') + 1
        const jsonData = text.substring(jsonStart, jsonEnd)
        
        const data = JSON.parse(jsonData)
        
        // Extract column F values (skip header row)
        if (data && data.table && data.table.rows) {
          const options = []
          
          // Skip the header row (index 0)
          data.table.rows.slice(1).forEach(row => {
            // Column F is index 5
            if (row.c && row.c[5] && row.c[5].v) {
              options.push(row.c[5].v)
            }
          })
          
          setSendStatusOptions(options)
        }
      } catch (error) {
        console.error("Error fetching dropdown options:", error)
        // Fallback options if fetch fails
        setSendStatusOptions(["mail", "whatsapp", "both"])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSendStatusOptions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Quotation Validation</h3>
      <hr className="border-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="validationQuotationNumber" className="block text-sm font-medium text-gray-700">
            Quotation Number
          </label>
          <input
            id="validationQuotationNumber"
            name="validationQuotationNumber"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter quotation number"
            value={formData.validationQuotationNumber || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="validatorName" className="block text-sm font-medium text-gray-700">
            Quotation Validator Name
          </label>
          <input
            id="validatorName"
            name="validatorName"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter validator name"
            value={formData.validatorName || ""}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="sendStatus" className="block text-sm font-medium text-gray-700">
          Quotation Send Status
        </label>
        <select
          id="sendStatus"
          name="sendStatus"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={formData.sendStatus || ""}
          onChange={handleChange}
          required
        >
          <option value="">Select status</option>
          {sendStatusOptions.map((option, index) => (
            <option key={index} value={option.toLowerCase()}>{option}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="validationRemark" className="block text-sm font-medium text-gray-700">
          Quotation Validation Remark
        </label>
        <textarea
          id="validationRemark"
          name="validationRemark"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter validation remarks"
          value={formData.validationRemark || ""}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Additional Materials Sent</h4>

        <div className="space-y-3">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Send FAQ Video</label>
            <div className="flex">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="faq-yes"
                  name="faqVideo"
                  value="yes"
                  checked={formData.faqVideo === "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="faq-yes" className="text-sm text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="radio"
                  id="faq-no"
                  name="faqVideo"
                  value="no"
                  checked={formData.faqVideo !== "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="faq-no" className="text-sm text-gray-700">
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Send Product Video</label>
            <div className="flex">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="product-video-yes"
                  name="productVideo"
                  value="yes"
                  checked={formData.productVideo === "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="product-video-yes" className="text-sm text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="radio"
                  id="product-video-no"
                  name="productVideo"
                  value="no"
                  checked={formData.productVideo !== "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="product-video-no" className="text-sm text-gray-700">
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Send Offer Video</label>
            <div className="flex">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="offer-video-yes"
                  name="offerVideo"
                  value="yes"
                  checked={formData.offerVideo === "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="offer-video-yes" className="text-sm text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="radio"
                  id="offer-video-no"
                  name="offerVideo"
                  value="no"
                  checked={formData.offerVideo !== "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="offer-video-no" className="text-sm text-gray-700">
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Send Product Catalog</label>
            <div className="flex">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="catalog-yes"
                  name="productCatalog"
                  value="yes"
                  checked={formData.productCatalog === "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="catalog-yes" className="text-sm text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="radio"
                  id="catalog-no"
                  name="productCatalog"
                  value="no"
                  checked={formData.productCatalog !== "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="catalog-no" className="text-sm text-gray-700">
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Send Product Image</label>
            <div className="flex">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="image-yes"
                  name="productImage"
                  value="yes"
                  checked={formData.productImage === "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="image-yes" className="text-sm text-gray-700">
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="radio"
                  id="image-no"
                  name="productImage"
                  value="no"
                  checked={formData.productImage !== "yes"}
                  onChange={handleChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="image-no" className="text-sm text-gray-700">
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuotationValidationForm