"use client"

const ConsigneeDetails = ({ quotationData, handleInputChange, isUserDisabled = false }) => {
  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Consignee Details</h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={quotationData?.consigneeName || ""}
            onChange={(e) => !isUserDisabled && handleInputChange("consigneeName", e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            placeholder="Enter consignee name"
            disabled={isUserDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={quotationData?.consigneeAddress || ""}
            onChange={(e) => !isUserDisabled && handleInputChange("consigneeAddress", e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            rows="3"
            placeholder="Enter consignee address"
            disabled={isUserDisabled}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="text"
              value={quotationData?.consigneeMobile || ""}
              onChange={(e) => !isUserDisabled && handleInputChange("consigneeMobile", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Enter mobile number"
              disabled={isUserDisabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={quotationData?.consigneePhone || ""}
              onChange={(e) => !isUserDisabled && handleInputChange("consigneePhone", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Enter phone number"
              disabled={isUserDisabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              value={quotationData?.consigneeGSTIN || ""}
              onChange={(e) => !isUserDisabled && handleInputChange("consigneeGSTIN", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Enter GSTIN"
              disabled={isUserDisabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
            <input
              type="text"
              value={quotationData?.consigneeStateCode || ""}
              onChange={(e) => !isUserDisabled && handleInputChange("consigneeStateCode", e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isUserDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Enter state code"
              disabled={isUserDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsigneeDetails
